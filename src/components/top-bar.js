import { renderToggleButtons, mountToggleButtons } from './theme-toggle.js';
import { emit } from '../core/events.js';

let topBarData = null;

export function render(fileName, data) {
  topBarData = data || null;
  return `
    <div class="topbar reader-topbar">
      <div class="topbar-title" title="${escapeAttr(fileName)}">${escapeHtml(fileName)}</div>
      <div class="topbar-actions">
        <button class="btn btn-icon btn-ghost" id="search-toggle-btn" aria-label="Search in document" title="Search (Ctrl+F)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        <button class="btn btn-icon btn-ghost" id="edit-btn" aria-label="Edit document" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        ${renderToggleButtons()}
        <button class="btn btn-secondary" id="open-new-btn" aria-label="Open new file">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New
        </button>
      </div>
    </div>
  `;
}

export function mount() {
  mountToggleButtons();

  document.getElementById('open-new-btn')?.addEventListener('click', () => {
    emit('navigate:landing');
  });

  document.getElementById('edit-btn')?.addEventListener('click', () => {
    emit('navigate:editor');
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
