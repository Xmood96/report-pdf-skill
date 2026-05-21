#!/usr/bin/env node
/**
 * generate-pdf.js — Generic Technical Report PDF Generator
 *
 * Reads a JSON data file, renders it through the HTML template,
 * and outputs a professional PDF.
 *
 * Usage:
 *   node generate-pdf.js --data ./data.json --output ./output/report.pdf
 *   node generate-pdf.js --template ./custom-template.html --data ./data.json --output ./output/report.pdf
 *   node generate-pdf.js --help
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// ── CLI arg parser ────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--help' || key === '-h') {
      console.log(`
Usage:
  node generate-pdf.js [options]

Options:
  --data <path>         Path to JSON data file (required)
  --template <path>     Path to HTML template (default: ./template.html)
  --output <path>       Output PDF path (default: ./output/report.pdf)
  --title <text>        Override report title from CLI
  --client <text>       Override client name from CLI
  --date <text>         Override report date from CLI
  --html-output <path>  Also save intermediate HTML (for debugging)
  --help, -h            Show this help
`);
      process.exit(0);
    }
    if (key.startsWith('--')) {
      const name = key.slice(2);
      const val = argv[i + 1];
      if (!val || val.startsWith('--')) args[name] = true;
      else { args[name] = val; i++; }
    }
  }
  return args;
}

// ── Escaping ──────────────────────────────────────────────────────
function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Section renderers ─────────────────────────────────────────────
const renderers = {
  timeline(section) {
    const items = (section.items || []).map(item => `
      <div class="tl-item ${item.class || ''}">
        <div class="tl-date">${item.date}</div>
        <div class="tl-text">${item.text}</div>
      </div>`).join('\n');
    return `
      <div class="section">
        <h2>${section.title}</h2>
        <div class="timeline">${items}</div>
      </div>`;
  },

  problems(section) {
    const cards = (section.problems || []).map(p => {
      const files = (p.files || []).map(f => `<div class="p-file">📄 ${f}</div>`).join('\n');
      const code = (p.codeBlocks || []).map(cb => `
        <div class="code-block"><span style="color:#89b4fa;font-weight:600">${esc(cb.label)}</span>\n${esc(cb.code)}</div>`).join('\n');
      const tags = (p.tags || []).map(t => `<span class="tag ${t.color}">${t.text}</span>`).join(' ');
      return `
        <div class="problem-card">
          <div class="p-header">
            <div class="p-icon ${p.iconColor}">${p.number}</div>
            <div class="p-title">${p.title}</div>
          </div>
          <div class="p-desc">
            ${p.description}
            ${p.details || ''}
            ${files}
            ${code}
            ${tags}
          </div>
        </div>`;
    }).join('\n');
    return `
      <div class="section">
        <h2>${section.title}</h2>
        ${cards}
      </div>`;
  },

  malware_analysis(section) {
    const items = (section.items || []).map(item => `
      <tr><td style="font-weight:700;color:#e94560;width:140px;padding:8px 12px;border-bottom:1px solid #eee">${item.label}</td>
           <td style="padding:8px 12px;border-bottom:1px solid #eee">${item.value}</td></tr>`).join('\n');
    return `
      <div class="section">
        <h2>${section.title}</h2>
        <div class="problem-card">
          <div class="p-desc">
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:15px">${items}</table>
            ${section.details || ''}
          </div>
        </div>
      </div>`;
  },

  actions_table(section) {
    const subs = (section.subsections || []).map(sub => {
      if (sub.type === 'key_value_table') {
        const headRow = (sub.headers || []).map(h => `<th style="padding:8px 12px;text-align:right;background:#1a1a2e;color:#fff">${h}</th>`).join('');
        const rows = (sub.rows || []).map((row, idx) => {
          const cells = row.map(c => `<td style="padding:8px 12px;border-bottom:1px solid #e8e8e8">${c}</td>`).join('');
          return `<tr${idx % 2 === 0 ? ' style="background:#fafafa"' : ''}>${cells}</tr>`;
        }).join('\n');
        return `
          <h4 style="color:#155724;margin:15px 0 8px">${sub.heading}</h4>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px;">
            <tr>${headRow}</tr>
            ${rows}
          </table>`;
      }
      return '';
    }).join('\n');
    return `
      <div class="section">
        <h2>${section.title}</h2>
        <div class="problem-card" style="background:#d4edda;border-color:#c3e6cb;">
          <div class="p-desc">${subs}</div>
        </div>
      </div>`;
  },

  summary_boxes(section) {
    const boxes = (section.boxes || []).map(b => `
      <div style="flex:1;min-width:120px;background:${b.color};border-radius:12px;padding:14px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:${b.textColor};">${b.value}</div>
        <div style="font-size:12px;color:${b.textColor};">${b.label}</div>
      </div>`).join('\n');
    return `
      <div class="section">
        <h2>${section.title}</h2>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin:15px 0;">${boxes}</div>
      </div>`;
  },

  conclusion(section) {
    const items = (section.items || []).map(i => `<li>${i}</li>`).join('\n');
    return `
      <div class="section">
        <h2>${section.title}</h2>
        <div class="problem-card" style="background:#d4edda;border-color:#c3e6cb;">
          <div class="p-desc" style="color:#155724;">
            ${section.text}
            <ol style="margin:8px 0 0 18px;">${items}</ol>
          </div>
        </div>
      </div>
      <div class="footer">
        ${section.footer || ''}
      </div>`;
  },

  custom(section) {
    return `<div class="section"><h2>${section.title}</h2><div class="problem-card"><div class="p-desc">${section.body || ''}</div></div></div>`;
  }
};

function renderSections(sections) {
  return (sections || []).map(s => {
    const fn = renderers[s.type];
    if (fn) return fn(s);
    return renderers.custom(s);
  }).join('\n');
}

// ── Full HTML builder ─────────────────────────────────────────────
function buildHtml(data) {
  const secHtml = renderSections(data.sections);
  return `<!DOCTYPE html>
<html dir="${data.dir || 'rtl'}" lang="${data.lang || 'ar'}">
<head>
<meta charset="UTF-8">
<title>${esc(data.title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Cairo', sans-serif;
    background: #f0f2f5;
    color: #1a1a2e;
    padding: 40px;
  }
  .container {
    max-width: 900px;
    margin: 0 auto;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.1);
    padding: 50px;
  }
  .header {
    text-align: center;
    border-bottom: 3px solid #e94560;
    padding-bottom: 30px;
    margin-bottom: 30px;
  }
  .header h1 { color: #1a1a2e; font-size: 28px; font-weight: 800; margin-bottom: 5px; }
  .header .sub { color: #666; font-size: 14px; }
  .header .badge {
    display: inline-block;
    background: #e94560; color: #fff;
    padding: 6px 20px; border-radius: 20px;
    font-size: 13px; font-weight: 700; margin-top: 12px;
  }
  .meta-table {
    width: 100%; border-collapse: collapse;
    margin: 25px 0; font-size: 14px;
  }
  .meta-table td { padding: 8px 12px; border-bottom: 1px solid #eee; }
  .meta-table td:first-child { font-weight: 700; color: #e94560; width: 140px; }
  .section { margin: 35px 0; }
  .section h2 {
    font-size: 22px; font-weight: 700; color: #1a1a2e;
    border-right: 4px solid #e94560; padding-right: 15px; margin-bottom: 20px;
  }
  .problem-card {
    background: #fafafa; border-radius: 12px;
    padding: 20px 25px; margin-bottom: 20px; border: 1px solid #e8e8e8;
  }
  .problem-card .p-header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
  }
  .problem-card .p-icon {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .p-icon.red { background: #e94560; }
  .p-icon.orange { background: #f39c12; }
  .p-icon.purple { background: #9b59b6; }
  .p-icon.green { background: #27ae60; }
  .problem-card .p-title { font-size: 17px; font-weight: 700; color: #1a1a2e; }
  .problem-card .p-desc { font-size: 14px; color: #555; line-height: 1.7; }
  .problem-card .p-desc strong { color: #1a1a2e; }
  .problem-card .p-file {
    background: #f0f0f5; padding: 6px 12px; border-radius: 6px;
    font-family: monospace; font-size: 12px; color: #666;
    margin-top: 8px; display: inline-block;
  }
  .tag {
    display: inline-block; padding: 3px 10px; border-radius: 12px;
    font-size: 11px; font-weight: 700; margin: 2px;
  }
  .tag.green { background: #d4edda; color: #155724; }
  .tag.red { background: #f8d7da; color: #721c24; }
  .tag.orange { background: #fff3cd; color: #856404; }
  .tag.blue { background: #d1ecf1; color: #0c5460; }

  .timeline { position: relative; padding-right: 30px; margin: 20px 0; }
  .timeline::before {
    content: ''; position: absolute; right: 8px; top: 0; bottom: 0;
    width: 2px; background: #e94560;
  }
  .tl-item { position: relative; margin-bottom: 18px; padding-right: 20px; }
  .tl-item::before {
    content: ''; position: absolute; right: -22px; top: 5px;
    width: 12px; height: 12px; border-radius: 50%;
    background: #e94560; border: 2px solid #fff;
  }
  .tl-item .tl-date { font-size: 12px; color: #e94560; font-weight: 700; }
  .tl-item .tl-text { font-size: 14px; color: #444; line-height: 1.5; }
  .tl-item.warning::before { background: #f39c12; }
  .tl-item.success::before { background: #27ae60; }
  .tl-item.danger::before { background: #e94560; }

  .code-block {
    background: #1e1e2e; color: #cdd6f4; padding: 14px 18px; border-radius: 8px;
    font-family: 'Consolas', monospace; font-size: 12px; line-height: 1.6;
    margin: 10px 0; overflow-x: auto; direction: ltr; text-align: left;
  }
  .footer {
    text-align: center; padding-top: 30px; margin-top: 30px;
    border-top: 1px solid #eee; font-size: 13px; color: #999;
  }
  @media print {
    body { padding: 0; background: #fff; }
    .container { box-shadow: none; padding: 30px; }
  }
</style>
</head>
<body>
<div class="container">

  <!-- HEADER -->
  <div class="header">
    <h1>${esc(data.title)}</h1>
    ${data.subtitle ? `<div class="sub">${esc(data.subtitle)}</div>` : ''}
    ${data.badge ? `<div class="badge" style="${data.badge.color ? `background:${data.badge.color}` : ''}">${data.badge.text}</div>` : ''}
  </div>

  <!-- META TABLE -->
  ${data.meta && data.meta.length ? `<table class="meta-table">${data.meta.map(m => {
    const val = m.tag ? `<span class="tag ${m.tag}">${m.value}</span>` : m.value;
    return `<tr><td>${esc(m.label)}</td><td>${val}</td></tr>`;
  }).join('\n')}</table>` : ''}

  <!-- EXECUTIVE SUMMARY -->
  ${data.executiveSummary ? `
  <div class="section">
    <h2>📌 ملخص تنفيذي</h2>
    <p style="font-size:14px;line-height:1.8;color:#444;">${data.executiveSummary}</p>
  </div>` : ''}

  <!-- DYNAMIC SECTIONS -->
  ${secHtml}

</div>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────
(async () => {
  const args = parseArgs(process.argv);

  if (!args.data && !args.title) {
    console.error('❌ Error: --data <json-file> is required.');
    console.error('   Run with --help for usage.');
    process.exit(1);
  }

  // Load data
  const dataPath = args.data
    ? path.resolve(args.data)
    : path.resolve(__dirname, 'sample-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(rawData);

  // CLI overrides
  if (args.title) data.title = args.title;
  if (args.client && data.meta) {
    const clientRow = data.meta.find(m => m.label === 'اسم العميل');
    if (clientRow) clientRow.value = args.client;
  }
  if (args.date && data.meta) {
    const dateRow = data.meta.find(m => m.label === 'التاريخ');
    if (dateRow) dateRow.value = args.date;
  }

  // Build HTML
  const html = buildHtml(data);

  // Output path
  const outPath = args.output
    ? path.resolve(args.output)
    : path.resolve(__dirname, 'output', 'report.pdf');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  // Optionally save intermediate HTML
  if (args['html-output']) {
    fs.writeFileSync(path.resolve(args['html-output']), html);
  }

  // Generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outPath,
    format: 'A4',
    margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;text-align:center;font-size:9px;color:#999;padding:5px 20px;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  });

  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`✅ PDF generated: ${outPath}`);
  console.log(`📦 Size: ${sizeKB} KB`);
  console.log(`📄 Pages: ${page.pdf ? '(check PDF)' : 'N/A'}`);

  await browser.close();
})().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
