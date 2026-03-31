import { emit } from '../core/events.js';

let dropAbort = null;

export function render() {
  return `
    <div class="input-card" id="file-input-card">
      <div class="input-card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <div class="input-card-title">Open File</div>
      <div class="input-card-desc">Drop a .md file or click to browse</div>
      <div class="drop-zone" id="drop-zone" tabindex="0" role="button" aria-label="Drop markdown file here or click to browse">
        <input type="file" id="file-picker" accept=".md,.markdown,.txt" hidden />
        <div class="drop-zone-text"><strong>Choose file</strong> or drag it here</div>
      </div>
    </div>
  `;
}

export function mount() {
  destroy(); // clean up any prior listeners

  const dropZone = document.getElementById('drop-zone');
  const filePicker = document.getElementById('file-picker');
  dropAbort = new AbortController();
  const { signal } = dropAbort;

  dropZone.addEventListener('click', () => {
    if (window.electronAPI) {
      window.electronAPI.openFileDialog();
    } else {
      filePicker.click();
    }
  }, { signal });

  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dropZone.click();
    }
  }, { signal });

  filePicker.addEventListener('change', (e) => {
    if (e.target.files[0]) readFileWeb(e.target.files[0]);
  }, { signal });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  }, { signal });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  }, { signal });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleDrop(e);
  }, { signal });

  // Document-level drop handler (files dragged anywhere on the page)
  document.addEventListener('dragover', (e) => e.preventDefault(), { signal });
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    handleDrop(e);
  }, { signal });
}

export function destroy() {
  if (dropAbort) {
    dropAbort.abort();
    dropAbort = null;
  }
}

function handleDrop(e) {
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;

  if (window.electronAPI && file.path) {
    window.electronAPI.readFile(file.path).then((result) => {
      if (result) emit('file:loaded', result);
    });
  } else {
    readFileWeb(file);
  }
}

function readFileWeb(file) {
  const reader = new FileReader();
  reader.onload = () => {
    emit('file:loaded', {
      name: file.name,
      content: reader.result,
    });
  };
  reader.onerror = () => {
    emit('file:error', { name: file.name });
  };
  reader.readAsText(file);
}
