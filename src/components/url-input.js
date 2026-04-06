import { emit } from '../core/events.js';

function stripQuotes(str) {
  // Remove surrounding quotes that users might paste from terminals/file managers
  return str.replace(/^['"""']+|['"""']+$/g, '');
}

function isLocalPath(str) {
  // Detect local file paths: /unix/path, C:\windows\path, ~/home, file:///
  return /^(\/|[A-Za-z]:\\|~\/|~\\|file:\/\/)/.test(str);
}

function cleanLocalPath(str) {
  // Strip file:// prefix if present
  if (str.startsWith('file:///')) return str.slice(7);
  if (str.startsWith('file://')) return str.slice(7);
  return str;
}

export function render() {
  return `
    <div class="input-card input-card--compact" id="url-input-card">
      <div class="input-card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </div>
      <div class="input-card-title">From URL or Path</div>
      <div class="input-card-desc">Fetch from a URL or open a local file path</div>
      <div class="url-input-row">
        <input type="text" class="url-input" id="url-field" placeholder="https://example.com/README.md or /path/to/file.md" aria-label="URL or local file path" />
        <button class="btn btn-primary" id="fetch-btn">Open</button>
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

  async function openLocalFile(filePath) {
    const cleanPath = cleanLocalPath(filePath);
    errorEl.textContent = '';
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span>';

    try {
      if (window.electronAPI) {
        // Electron: read file via IPC
        const result = await window.electronAPI.readFile(cleanPath);
        if (result) {
          emit('file:loaded', result);
        } else {
          showError('Could not read file. Check that the path exists.');
        }
      } else {
        // Web: can't read local paths directly — open a file picker as fallback
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.md,.markdown,.txt';
        fileInput.onchange = () => {
          const file = fileInput.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            emit('file:loaded', { name: file.name, content: reader.result });
          };
          reader.readAsText(file);
        };
        fileInput.click();
        showError('Browsers cannot open local paths directly — please select the file from the picker.');
      }
    } catch (err) {
      showError('Error reading file: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Open';
    }
  }

  async function fetchUrl() {
    const value = stripQuotes(input.value.trim());
    if (!value) return;

    // Check if it's a local file path
    if (isLocalPath(value)) {
      return openLocalFile(value);
    }

    // Validate protocol
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      showError('Please enter a valid URL or local file path.');
      return;
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      showError('Only http/https URLs or local file paths are supported.');
      return;
    }

    errorEl.textContent = '';
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span>';

    try {
      const res = await fetch(value);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const content = await res.text();
      const name = value.split('/').pop() || 'Fetched Document';
      emit('file:loaded', { name, content });
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        showError('Could not fetch — the server may block cross-origin requests (CORS).');
      } else {
        showError('Error: ' + err.message);
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Open';
    }
  }

  btn.addEventListener('click', fetchUrl);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fetchUrl();
  });
}
