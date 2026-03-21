import { emit } from '../core/events.js';

export function render() {
  return `
    <div class="input-card" id="text-input-card">
      <div class="input-card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="4 7 4 4 20 4 20 7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
      </div>
      <div class="input-card-title">Paste Markdown</div>
      <div class="input-card-desc">Paste raw markdown text below</div>
      <textarea class="text-input-area" id="paste-area" placeholder="# Paste your markdown here..." aria-label="Paste markdown text"></textarea>
      <button class="btn btn-primary" id="render-btn" style="margin-top: var(--space-sm); width: 100%;">Render</button>
    </div>
  `;
}

export function mount() {
  const textarea = document.getElementById('paste-area');
  const btn = document.getElementById('render-btn');

  btn.addEventListener('click', () => {
    const content = textarea.value.trim();
    if (!content) return;
    emit('file:loaded', {
      name: 'Pasted Markdown',
      content,
    });
  });
}
