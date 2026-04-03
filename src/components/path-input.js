import { emit } from '../core/events.js';

let pathAbort = null;

export function render() {
  if (!window.electronAPI) return '';
  return `
    <div class="input-card input-card--compact" id="path-input-card">
      <div class="input-card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div class="input-card-title">Local Path</div>
      <div class="input-card-desc">Open a file by its path on disk</div>
      <div class="url-input-row">
        <input type="text" class="url-input" id="path-field" placeholder="C:\\Users\\...\\notes.json" aria-label="Local file path" />
        <button class="btn btn-primary" id="path-btn">Open</button>
      </div>
      <div id="path-error"></div>
    </div>
  `;
}

export function mount() {
  if (!window.electronAPI) return;

  const input = document.getElementById('path-field');
  const btn = document.getElementById('path-btn');
  const errorEl = document.getElementById('path-error');
  if (!input || !btn || !errorEl) return;

  pathAbort = new AbortController();
  const { signal } = pathAbort;

  function showError(msg) {
    errorEl.textContent = '';
    const div = document.createElement('div');
    div.className = 'error-msg';
    div.textContent = msg;
    errorEl.appendChild(div);
  }

  async function openPath() {
    const filePath = input.value.trim();
    if (!filePath) return;

    errorEl.textContent = '';
    btn.disabled = true;
    btn.textContent = '...';

    const result = await window.electronAPI.readFile(filePath);

    btn.disabled = false;
    btn.textContent = 'Open';

    if (result) {
      emit('file:loaded', result);
    } else {
      showError('Could not read file. Check that the path exists and is accessible.');
    }
  }

  btn.addEventListener('click', openPath, { signal });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') openPath();
  }, { signal });
}

export function destroy() {
  if (pathAbort) {
    pathAbort.abort();
    pathAbort = null;
  }
}
