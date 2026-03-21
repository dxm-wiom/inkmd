import { emit } from '../core/events.js';

export function render() {
  return `
    <div class="input-card" id="url-input-card">
      <div class="input-card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </div>
      <div class="input-card-title">From URL</div>
      <div class="input-card-desc">Fetch a markdown file from a URL</div>
      <div class="url-input-row">
        <input type="url" class="url-input" id="url-field" placeholder="https://example.com/README.md" aria-label="Markdown file URL" />
        <button class="btn btn-primary" id="fetch-btn">Fetch</button>
      </div>
      <div id="url-error"></div>
    </div>
  `;
}

export function mount() {
  const input = document.getElementById('url-field');
  const btn = document.getElementById('fetch-btn');
  const errorEl = document.getElementById('url-error');

  function showError(msg) {
    errorEl.textContent = '';
    const div = document.createElement('div');
    div.className = 'error-msg';
    div.textContent = msg;
    errorEl.appendChild(div);
  }

  async function fetchUrl() {
    const url = input.value.trim();
    if (!url) return;

    // Validate protocol
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      showError('Please enter a valid URL.');
      return;
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      showError('Only http:// and https:// URLs are supported.');
      return;
    }

    errorEl.textContent = '';
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span>';

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const content = await res.text();
      const name = url.split('/').pop() || 'Fetched Document';
      emit('file:loaded', { name, content });
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        showError('Could not fetch — the server may block cross-origin requests (CORS).');
      } else {
        showError('Error: ' + err.message);
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Fetch';
    }
  }

  btn.addEventListener('click', fetchUrl);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fetchUrl();
  });
}
