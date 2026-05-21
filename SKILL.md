# 📄 Technical Report PDF Skill
## مهارة تقارير PDF الفنية

A **generic, data-driven** technical report PDF generator. Write your content as JSON, run one command, get a beautiful professional PDF.

Supports **Arabic, English, RTL, LTR**, and mixed content.

---

## ✨ Features

- **Generic & reusable** — any project, any client, any report type
- **Data-driven** — write JSON, get PDF (no HTML editing needed)
- **Beautiful styling** — professional design with cards, timelines, tables, code blocks
- **Arabic + RTL** — full support for Arabic and mixed Arabic/English content
- **Custom sections** — timeline, problems, analysis, action tables, summary boxes, conclusion
- **CLI-first** — works standalone, in CI/CD, or as an OpenClaw skill

---

## 📋 Requirements

- **Node.js** 18+
- **npm** (or pnpm)

Dependencies (auto-installed):
- `puppeteer` — Chromium-based PDF generation

---

## 🚀 Quick Start

### 1. Install

```bash
cd skills/report-template
npm install
```

### 2. Create your data file

Create `my-report.json` with your report data (see `sample-data.json` for full reference):

```json
{
  "title": "تقرير فني — مشروع ABC",
  "subtitle": "تحليل وتشخيص وإصلاح",
  "badge": { "text": "✅ تم الإنجاز", "color": "#27ae60" },
  "meta": [
    { "label": "اسم العميل", "value": "شركة ABC" },
    { "label": "التاريخ", "value": "20 مايو 2026" },
    { "label": "الحالة", "value": "✅ مكتمل", "tag": "green" }
  ],
  "executiveSummary": "تم إنجاز <strong>3 مهام</strong> رئيسية...",
  "sections": [
    {
      "type": "timeline",
      "title": "⏱ الجدول الزمني",
      "items": [
        { "date": "الأسبوع الأول", "text": "بدء المشروع", "class": "" },
        { "date": "الأسبوع الثاني", "text": "<strong>✅ اكتمال المرحلة الأولى</strong>", "class": "success" }
      ]
    },
    {
      "type": "problems",
      "title": "المشاكل المكتشفة",
      "problems": [
        {
          "iconColor": "red",
          "number": 1,
          "title": "مشكلة في النظام",
          "description": "<strong>السبب:</strong> خطأ في الإعدادات.<br><strong>الإصلاح:</strong> تم التعديل.",
          "files": ["path/to/file"],
          "tags": [{ "text": "✅ تم الإصلاح", "color": "green" }]
        }
      ]
    },
    {
      "type": "summary_boxes",
      "title": "📊 الملخص",
      "boxes": [
        { "value": "5", "label": "مهام منجزة", "color": "#d4edda", "textColor": "#155724" }
      ]
    },
    {
      "type": "conclusion",
      "title": "✅ الخلاصة",
      "text": "تم إنجاز جميع المهام.",
      "footer": "© 2026 - جميع الحقوق محفوظة"
    }
  ]
}
```

### 3. Generate PDF

```bash
node generate-pdf.js --data my-report.json --output ./output/my-report.pdf
```

### 4. Done! 🎉

Your PDF is in `./output/my-report.pdf`.

---

## 🔧 CLI Reference

```
node generate-pdf.js [options]

Options:
  --data <path>         Path to JSON data file (required)
  --template <path>     Path to custom HTML template (optional)
  --output <path>       Output PDF path (default: ./output/report.pdf)
  --title <text>        Override report title from CLI
  --client <text>       Override client name from CLI
  --date <text>         Override report date from CLI
  --html-output <path>  Also save intermediate HTML for debugging
  --help, -h            Show help
```

### Examples

```bash
# Basic — use sample data
npm run generate:demo

# Custom report
node generate-pdf.js --data ./my-data.json --output ./output/my-report.pdf

# Quick override from CLI
node generate-pdf.js --data ./data.json --title "تقرير جديد" --date "اليوم"

# Save HTML for manual tweaking
node generate-pdf.js --data ./data.json --html-output ./output/preview.html
```

---

## 📁 Project Structure

```
skills/report-template/
├── SKILL.md              # This file
├── package.json          # Dependencies
├── generate-pdf.js       # The PDF generator script
├── template.html         # Reference HTML template (legacy)
├── sample-data.json      # Full sample data file (use as template)
└── output/               # Generated PDFs go here
```

---

## 🧩 Section Types

Each section in `sections[]` has a `type`. Here are the supported types:

| Type | Description | Key Fields |
|------|------------|------------|
| `timeline` | Chronological event list | `title`, `items[]` (date, text, class) |
| `problems` | Problem cards with icons | `title`, `problems[]` (iconColor, number, title, description, files, codeBlocks, tags, details) |
| `malware_analysis` | Technical analysis table | `title`, `items[]` (label, value), `details` |
| `actions_table` | Tables with headers + rows | `title`, `subsections[]` (heading, type, headers[], rows[][]) |
| `summary_boxes` | KPI summary cards | `title`, `boxes[]` (value, label, color, textColor) |
| `conclusion` | Final verdict section | `title`, `text`, `items[]`, `footer` |
| `custom` | Free-form HTML section | `title`, `body` (raw HTML) |

### Timeline item classes
- `danger` — red dot
- `warning` — orange dot
- `success` — green dot
- `""` (empty) — default red dot

### Problem icon colors
- `red` — critical
- `orange` — warning
- `purple` — security/malware
- `green` — resolved

---

## 🌐 Arabic & RTL Support

The skill is designed for Arabic-first content:
- Default direction: **RTL**
- Default language: **ar**
- Google Fonts: **Cairo** (Arabic-optimized)
- Code blocks: **LTR** regardless of document direction
- Mixed RTL/LTR handled automatically by the browser renderer

For English/LTR reports, set in your data:
```json
{
  "lang": "en",
  "dir": "ltr"
}
```

---

## 🛠 Use with OpenClaw

This skill works as an OpenClaw skill. Place it in your skills directory:

```
~/.openclaw/skills/report-template/
# or
<your-workspace>/skills/report-template/
```

Then ask your assistant:
> "جهز تقرير PDF فني للعميل X"

The assistant will:
1. Create a data JSON from your conversation
2. Run `generate-pdf.js`
3. Return the PDF

---

## 🔄 Migration from v1 (Hardcoded Template)

If you have an old hardcoded `template.html`:
1. Extract your content into the JSON data format (see `sample-data.json`)
2. Run with `--data your-data.json`
3. The `template.html` is kept as reference but no longer needed

---

## 📦 Sample Data

See `sample-data.json` for a complete, real-world example with:
- Executive summary
- 8-item timeline
- 3 problem cards (with code blocks and file paths)
- Malware analysis section
- Security actions table
- Summary KPI boxes
- Conclusion

---

## 📄 License

MIT — free to use, modify, and distribute.
