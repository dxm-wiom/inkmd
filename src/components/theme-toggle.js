import { getPreference, setPreference } from '../core/storage.js';
import { emit } from '../core/events.js';

export function initTheme() {
  // Color mode
  const savedMode = getPreference('colorMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const mode = savedMode || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', mode);

  // Font theme
  const savedFont = getPreference('fontTheme') || 'modern';
  document.documentElement.setAttribute('data-font-theme', savedFont);
}

export function renderToggleButtons() {
  const mode = document.documentElement.getAttribute('data-theme');
  const font = document.documentElement.getAttribute('data-font-theme');

  return `
    <button class="btn btn-icon btn-ghost" id="theme-color-toggle" aria-label="Toggle dark mode" title="Toggle dark mode">
      ${mode === 'dark' ? sunIcon : moonIcon}
    </button>
    <button class="btn btn-ghost" id="theme-font-toggle" aria-label="Toggle font theme" title="Toggle font theme" style="font-size: var(--text-xs); padding: 0 8px;">
      ${font === 'modern' ? 'Aa' : '<i>Aa</i>'}
    </button>
  `;
}

export function mountToggleButtons() {
  const colorBtn = document.getElementById('theme-color-toggle');
  const fontBtn = document.getElementById('theme-font-toggle');

  if (colorBtn) {
    colorBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      setPreference('colorMode', next);
      colorBtn.innerHTML = next === 'dark' ? sunIcon : moonIcon;
      emit('theme:changed', { colorMode: next });
    });
  }

  if (fontBtn) {
    fontBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-font-theme');
      const next = current === 'modern' ? 'classic' : 'modern';
      document.documentElement.setAttribute('data-font-theme', next);
      setPreference('fontTheme', next);
      fontBtn.innerHTML = next === 'modern' ? 'Aa' : '<i>Aa</i>';
      emit('theme:changed', { fontTheme: next });
    });
  }
}

const moonIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>`;

const sunIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
</svg>`;
