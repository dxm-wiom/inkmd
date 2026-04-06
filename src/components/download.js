import { getDocument } from '../core/document.js';
import { parse } from '../core/parser.js';

/**
 * Collects all stylesheets from the page that affect the rendered markdown,
 * so the exported document looks close to the reader view.
 */
function collectStyles() {
  const styles = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        styles.push(rule.cssText);
      }
    } catch {
      // cross-origin sheets (Google Fonts) — skip
    }
  }
  return styles.join('\n');
}

function buildHtmlDocument(title, bodyHtml) {
  const css = collectStyles();
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const fontTheme = document.documentElement.getAttribute('data-font-theme') || 'modern';
  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}" data-font-theme="${fontTheme}">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<style>${css}</style>
<style>
  body { background: var(--color-bg); padding: 2rem; }
  .markdown-body { max-width: 720px; margin: 0 auto; }
  @media print {
    body { padding: 0; background: #fff; }
    .markdown-body { max-width: 100%; }
  }
</style>
</head>
<body>
<article class="markdown-body">${bodyHtml}</article>
</body>
</html>`;
}

function baseName(fileName) {
  return fileName.replace(/\.(md|markdown|txt)$/i, '') || 'document';
}

export function downloadAsPdf() {
  const doc = getDocument();
  if (!doc.content) return;

  const html = parse(doc.content);
  const fullHtml = buildHtmlDocument(doc.name || 'Document', html);

  const printWin = window.open('', '_blank');
  if (!printWin) return;

  printWin.document.write(fullHtml);
  printWin.document.close();

  // Wait for fonts to load before triggering print
  printWin.onload = () => {
    setTimeout(() => {
      printWin.print();
      // Don't auto-close — user may cancel print
    }, 400);
  };
}

export function downloadAsWord() {
  const doc = getDocument();
  if (!doc.content) return;

  const html = parse(doc.content);
  const name = baseName(doc.name || 'document');

  // Word-compatible HTML with inline styles for basic formatting
  const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>${name}</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>
<![endif]-->
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #333; max-width: 720px; margin: 0 auto; }
  h1 { font-size: 24pt; font-weight: bold; margin: 24pt 0 8pt; }
  h2 { font-size: 18pt; font-weight: bold; margin: 20pt 0 6pt; border-bottom: 1px solid #ccc; padding-bottom: 4pt; }
  h3 { font-size: 14pt; font-weight: bold; font-style: italic; margin: 16pt 0 6pt; }
  h4 { font-size: 12pt; font-weight: bold; margin: 14pt 0 4pt; }
  h5, h6 { font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 12pt 0 4pt; }
  p { margin: 8pt 0; }
  code { font-family: Consolas, 'Courier New', monospace; font-size: 10pt; background: #f4f4f4; padding: 1pt 3pt; }
  pre { font-family: Consolas, 'Courier New', monospace; font-size: 10pt; background: #f4f4f4; padding: 8pt; border: 1px solid #ddd; overflow-x: auto; white-space: pre-wrap; }
  blockquote { border-left: 3px solid #c5232a; padding-left: 12pt; margin: 12pt 0; color: #555; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
  th, td { border: 1px solid #ccc; padding: 6pt 10pt; text-align: left; }
  th { background: #f0f0f0; font-weight: bold; }
  img { max-width: 100%; }
  a { color: #0563C1; }
  ul, ol { margin: 8pt 0; padding-left: 24pt; }
  li { margin: 2pt 0; }
  hr { border: none; border-top: 1px solid #ccc; margin: 16pt 0; }
</style>
</head>
<body>${html}</body>
</html>`;

  const blob = new Blob(['\ufeff' + wordHtml], {
    type: 'application/msword',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function renderDownloadMenu() {
  return `
    <div class="download-menu" id="download-menu">
      <button class="download-menu-item" id="download-pdf">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        Save as PDF
      </button>
      <button class="download-menu-item" id="download-word">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        Save as Word
      </button>
    </div>
  `;
}

export function mountDownloadMenu() {
  const btn = document.getElementById('download-btn');
  const menu = document.getElementById('download-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  document.getElementById('download-pdf')?.addEventListener('click', () => {
    menu.classList.remove('open');
    downloadAsPdf();
  });

  document.getElementById('download-word')?.addEventListener('click', () => {
    menu.classList.remove('open');
    downloadAsWord();
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
    }
  });
}
