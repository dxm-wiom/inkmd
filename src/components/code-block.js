const copyIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
</svg>`;

export function mount() {
  const codeBlocks = document.querySelectorAll('.markdown-body pre');

  codeBlocks.forEach((pre) => {
    const codeEl = pre.querySelector('code');
    if (!codeEl) return;

    // Detect language from class
    const langClass = Array.from(codeEl.classList).find((c) => c.startsWith('language-'));
    const lang = langClass ? langClass.replace('language-', '') : '';

    // Create header
    const header = document.createElement('div');
    header.className = 'code-header';

    const langSpan = document.createElement('span');
    langSpan.className = 'code-lang';
    langSpan.textContent = lang;
    header.appendChild(langSpan);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.setAttribute('aria-label', 'Copy code');
    copyBtn.setAttribute('title', 'Copy code');
    copyBtn.innerHTML = `${copyIcon}<span>Copy</span>`;
    header.appendChild(copyBtn);

    pre.insertBefore(header, codeEl);

    // Copy button handler
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeEl.textContent);
        copyBtn.classList.add('copied');
        copyBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.querySelector('span').textContent = 'Copy';
        }, 2000);
      } catch {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = codeEl.textContent;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copyBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.querySelector('span').textContent = 'Copy';
        }, 2000);
      }
    });
  });
}
