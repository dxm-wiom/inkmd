import { getRecentFiles, removeRecentFile } from '../core/storage.js';
import { emit } from '../core/events.js';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function render() {
  const files = getRecentFiles();
  if (files.length === 0) return '';

  const cards = files
    .map(
      (f) => `
    <div class="recent-card" data-id="${f.id}" tabindex="0" role="button" aria-label="Open ${f.name}">
      <div class="recent-card-content">
        <div class="recent-card-name">${escapeHtml(f.name)}</div>
        <div class="recent-card-snippet">${escapeHtml(f.snippet)}</div>
      </div>
      <div class="recent-card-time">${timeAgo(f.timestamp)}</div>
      <button class="recent-card-remove" data-remove="${f.id}" aria-label="Remove ${f.name}" title="Remove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `
    )
    .join('');

  return `
    <div class="recent-section">
      <h2 class="recent-title">Recent Files</h2>
      <div class="recent-list">${cards}</div>
    </div>
  `;
}

export function mount() {
  const files = getRecentFiles();

  // Click on card to open
  document.querySelectorAll('.recent-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.recent-card-remove')) return;
      const id = card.dataset.id;
      const file = files.find((f) => f.id === id);
      if (!file) return;
      if (file.contentTooLarge || !file.content) {
        showToast('This file was too large to store. Please re-open it.');
        return;
      }
      emit('file:loaded', { name: file.name, content: file.content });
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // Remove buttons
  document.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.remove;
      removeRecentFile(id);
      emit('navigate:landing');
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
