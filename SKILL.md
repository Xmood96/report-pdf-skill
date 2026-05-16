# مهارة تقارير PDF الفنية (Technical Report PDF Skill)

## الوصف
مهارة لإنشاء تقارير فنية احترافية بصيغة PDF باللغة العربية. تستخدم HTML + Puppeteer لطباعة تقارير منسقة وجاهزة للإرسال للعملاء.

## المتطلبات
- Node.js (18+)
- puppeteer (npm)

## التثبيت
```bash
npm install -g puppeteer
```

## الاستخدام
1. افتح `template.html` وعدّل المحتوى حسب الحاجة
2. شغّل:
```bash
node generate-pdf.js
```
3. التقرير سيكون في `output/report.pdf`

## هيكل المجلد
```
skills/report-template/
├── SKILL.md              # هذا الملف
├── template.html          # قالب HTML للتقرير
└── generate-pdf.js        # سكريبت تحويل HTML → PDF
```

## التخصيص
- عدّل `template.html` لتغيير المحتوى والألوان والترويسة
- عدّل `generate-pdf.js` لتغيير إعدادات الصفحة (حجم الورق، الهوامش)
