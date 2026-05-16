const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const templatePath = process.argv[2] || path.resolve(__dirname, 'template.html');
  const outputDir = path.resolve(__dirname, 'output');
  const pdfPath = path.join(outputDir, 'report.pdf');
  const reportTitle = process.argv[3] || 'report';
  const finalPdfPath = path.join(outputDir, `${reportTitle}.pdf`);

  // Create output dir
  fs.mkdirSync(outputDir, { recursive: true });

  const html = fs.readFileSync(templatePath, 'utf8');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: finalPdfPath,
    format: 'A4',
    margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;text-align:center;font-size:9px;color:#999;padding:5px 20px;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  });

  console.log(`✅ PDF generated: ${finalPdfPath}`);
  console.log(`📦 Size: ${(fs.statSync(finalPdfPath).size / 1024).toFixed(0)} KB`);

  await browser.close();
})();
