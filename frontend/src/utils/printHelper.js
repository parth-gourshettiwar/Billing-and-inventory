export function printInvoice(elementId = 'a4-invoice') {
  const el = document.getElementById(elementId);
  if (!el) { console.error(`[printInvoice] #${elementId} not found`); return; }

  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/>
<title>Tax Invoice</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
<style>
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;background:white;font-family:'Inter',Arial,sans-serif}
  @page{size:A4 portrait;margin:8mm 8mm 8mm 8mm}
  @media print{
    html,body{margin:0!important;padding:0!important}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  }
</style>
</head><body>${el.outerHTML}</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open(); doc.write(html); doc.close();

  // setTimeout is more reliable than onload after document.write()
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 30000);
  }, 600);
}
