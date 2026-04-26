import { parse, parseFile, isMarkdownFile } from '../core/parser.js';
import { getDocument, updateContent, isDirty, markSaved, setFilePath } from '../core/document.js';
import { emit } from '../core/events.js';
import { renderToggleButtons, mountToggleButtons } from '../components/theme-toggle.js';
import * as codeBlock from '../components/code-block.js';

let debounceTimer = null;
let abortController = null;
let lastRendered = null;
let headingMenuOpen = false;
let editorAlive = false;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderPreview(content, name) {
  return isMarkdownFile(name) ? parse(content) : parseFile(content, name);
}

function placeholderFor(name) {
  if (!name) return 'Start writing markdown...';
  return isMarkdownFile(name) ? `Edit ${name}...` : `Editing ${name}...`;
}

const MIME_BY_EXT = {
  md: 'text/markdown', markdown: 'text/markdown', mdown: 'text/markdown', mkd: 'text/markdown', mdx: 'text/markdown',
  txt: 'text/plain', log: 'text/plain', spec: 'text/plain', env: 'text/plain', ini: 'text/plain',
  json: 'application/json',
  yaml: 'application/yaml', yml: 'application/yaml',
  toml: 'application/toml',
  csv: 'text/csv',
  xml: 'application/xml',
};

function extOf(name) {
  return (name || '').match(/\.([^.]+)$/)?.[1].toLowerCase() || '';
}

function mimeFor(name) {
  return MIME_BY_EXT[extOf(name)] || 'text/plain';
}

function pickerTypesFor(name) {
  const ext = extOf(name);
  const mime = MIME_BY_EXT[ext] || 'text/plain';
  const dotExt = ext ? '.' + ext : '.md';
  return [{ description: ext ? ext.toUpperCase() : 'Markdown', accept: { [mime]: [dotExt] } }];
}

export function render() {
  const doc = getDocument();
  const name = doc.name || 'Untitled';
  const content = doc.content || '';
  const dirty = isDirty();
  const initialHtml = content ? renderPreview(content, doc.name) : '';
  const isMd = isMarkdownFile(doc.name);
  const formatLabel = extOf(doc.name).toUpperCase();

  return `
    <div class="editor-layout view-enter">
      <div class="topbar editor-topbar">
        <div class="topbar-title-wrap">
          <div class="topbar-title" title="${escapeAttr(name)}">${escapeHtml(name)}</div>
          <span class="dirty-dot ${dirty ? 'visible' : ''}" id="dirty-dot" title="Unsaved changes"></span>
        </div>
        <div class="topbar-actions">
          <button class="btn btn-ghost" id="editor-reader-btn" aria-label="Back to reader">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Reader
          </button>
          <button class="btn btn-secondary" id="editor-save-btn" aria-label="Save file" title="Save (Ctrl+S)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            Save
          </button>
          ${renderToggleButtons()}
          <button class="btn btn-secondary" id="editor-new-btn" aria-label="Open new file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New
          </button>
        </div>
      </div>
      <div class="editor-toolbar">
        <div class="editor-toolbar-left">
          ${isMd ? `
          <button class="toolbar-btn" id="tb-bold" title="Bold (Ctrl+B)" aria-label="Bold"><strong>B</strong></button>
          <button class="toolbar-btn" id="tb-italic" title="Italic (Ctrl+I)" aria-label="Italic"><em>I</em></button>
          <div class="toolbar-heading-wrap" id="tb-heading-wrap">
            <button class="toolbar-btn" id="tb-heading" title="Heading" aria-label="Heading">H</button>
            <div class="toolbar-heading-menu" id="heading-menu">
              <button class="toolbar-heading-option" data-level="1">Heading 1</button>
              <button class="toolbar-heading-option" data-level="2">Heading 2</button>
              <button class="toolbar-heading-option" data-level="3">Heading 3</button>
            </div>
          </div>
          <div class="toolbar-divider"></div>
          <button class="toolbar-btn" id="tb-link" title="Link" aria-label="Insert link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
          <button class="toolbar-btn" id="tb-list" title="Bullet list" aria-label="Bullet list">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
          <button class="toolbar-btn" id="tb-code" title="Inline code" aria-label="Inline code">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </button>
          ` : `
          <span class="toolbar-format-label">${escapeHtml(formatLabel || 'TEXT')}</span>
          `}
        </div>
        <div class="editor-toolbar-right">
          <button class="btn-claude" id="send-to-claude-btn" title="Copy and send to Claude">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
            </svg>
            Send to Claude
          </button>
        </div>
      </div>
      <div class="editor-tab-switcher">
        <div class="editor-tab-bar">
          <button class="editor-tab active" data-tab="write">Write</button>
          <button class="editor-tab" data-tab="preview">Preview</button>
        </div>
      </div>
      <div class="editor-split">
        <div class="editor-pane-write">
          <textarea class="editor-textarea" id="editor-textarea" placeholder="${escapeAttr(placeholderFor(doc.name))}" spellcheck="true">${escapeHtml(content)}</textarea>
        </div>
        <div class="editor-pane-preview">
          <div class="editor-preview-content markdown-body" id="editor-preview">${initialHtml}</div>
        </div>
      </div>
      <button class="claude-fab" id="claude-fab-btn" aria-label="Send to Claude" title="Send to Claude">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
        </svg>
      </button>
    </div>
  `;
}

export function mount() {
  abortController = new AbortController();
  const signal = abortController.signal;

  const textarea = document.getElementById('editor-textarea');
  const preview = document.getElementById('editor-preview');
  const dirtyDot = document.getElementById('dirty-dot');
  lastRendered = textarea.value;

  // Mount theme toggles
  mountToggleButtons();

  // Mount code blocks on initial preview
  codeBlock.mount();

  // --- Live preview (debounced) ---
  const docName = getDocument().name;
  textarea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const val = textarea.value;
      if (val === lastRendered) return;
      lastRendered = val;
      updateContent(val);
      preview.innerHTML = renderPreview(val, docName);
      codeBlock.mount();
      updateDirtyDot();
    }, 250);
  }, { signal });

  // --- Tab key inserts tab character ---
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '\t' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 1;
      textarea.dispatchEvent(new Event('input'));
    }
  }, { signal });

  // --- Keyboard shortcuts (textarea-specific: Bold, Italic) — markdown-only ---
  if (isMarkdownFile(getDocument().name)) {
    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        wrapSelection(textarea, '**', '**');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        wrapSelection(textarea, '*', '*');
      }
    }, { signal });
  }

  // Global Ctrl+S capture (single handler avoids double-fire)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && document.querySelector('.editor-layout')) {
      e.preventDefault();
      handleSave();
    }
  }, { signal });

  // --- Toolbar buttons ---
  document.getElementById('tb-bold')?.addEventListener('click', () => {
    wrapSelection(textarea, '**', '**');
    textarea.focus();
  }, { signal });

  document.getElementById('tb-italic')?.addEventListener('click', () => {
    wrapSelection(textarea, '*', '*');
    textarea.focus();
  }, { signal });

  document.getElementById('tb-link')?.addEventListener('click', () => {
    insertLink(textarea);
    textarea.focus();
  }, { signal });

  document.getElementById('tb-list')?.addEventListener('click', () => {
    insertList(textarea);
    textarea.focus();
  }, { signal });

  document.getElementById('tb-code')?.addEventListener('click', () => {
    wrapSelection(textarea, '`', '`');
    textarea.focus();
  }, { signal });

  // --- Heading dropdown ---
  document.getElementById('tb-heading')?.addEventListener('click', () => {
    headingMenuOpen = !headingMenuOpen;
    document.getElementById('heading-menu')?.classList.toggle('open', headingMenuOpen);
  }, { signal });

  document.querySelectorAll('.toolbar-heading-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const level = parseInt(btn.dataset.level, 10);
      insertHeading(textarea, level);
      headingMenuOpen = false;
      document.getElementById('heading-menu')?.classList.remove('open');
      textarea.focus();
    }, { signal });
  });

  // Close heading menu on outside click
  document.addEventListener('click', (e) => {
    if (headingMenuOpen && !e.target.closest('#tb-heading-wrap')) {
      headingMenuOpen = false;
      document.getElementById('heading-menu')?.classList.remove('open');
    }
  }, { signal });

  // --- Send to Claude ---
  document.getElementById('send-to-claude-btn')?.addEventListener('click', () => sendToClaude(), { signal });
  document.getElementById('claude-fab-btn')?.addEventListener('click', () => sendToClaude(), { signal });

  // --- Navigation buttons ---
  document.getElementById('editor-reader-btn')?.addEventListener('click', () => {
    // Flush pending debounce so document model has the latest content
    flushDebounce(textarea);
    const doc = getDocument();
    emit('navigate:reader', doc);
  }, { signal });

  document.getElementById('editor-save-btn')?.addEventListener('click', () => handleSave(), { signal });

  document.getElementById('editor-new-btn')?.addEventListener('click', () => {
    emit('navigate:landing');
  }, { signal });

  // --- Mobile: initialize preview as hidden on small screens ---
  if (window.matchMedia('(max-width: 600px)').matches) {
    document.querySelector('.editor-pane-preview')?.classList.add('hidden');
  }

  // --- Mobile tab switcher ---
  document.querySelectorAll('.editor-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.editor-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const writePane = document.querySelector('.editor-pane-write');
      const previewPane = document.querySelector('.editor-pane-preview');
      if (tab.dataset.tab === 'write') {
        writePane?.classList.remove('hidden');
        previewPane?.classList.add('hidden');
      } else {
        writePane?.classList.add('hidden');
        previewPane?.classList.remove('hidden');
      }
    }, { signal });
  });

  // --- Electron menu save (gated by editorAlive flag, cleaned up in destroy) ---
  editorAlive = true;
  if (window.electronAPI?.onMenuSave) {
    window.electronAPI.onMenuSave(() => {
      if (editorAlive) handleSave();
    });
  }

  // --- beforeunload for unsaved changes ---
  window.addEventListener('beforeunload', (e) => {
    if (isDirty()) {
      e.preventDefault();
      e.returnValue = '';
    }
  }, { signal });

  function updateDirtyDot() {
    const dot = document.getElementById('dirty-dot');
    if (dot) {
      dot.classList.toggle('visible', isDirty());
    }
  }
}

export function destroy() {
  editorAlive = false;
  clearTimeout(debounceTimer);
  debounceTimer = null;

  // Sync latest content to document model
  const textarea = document.getElementById('editor-textarea');
  if (textarea) {
    updateContent(textarea.value);
  }

  if (abortController) {
    abortController.abort();
    abortController = null;
  }

  // Remove Electron menu-save IPC listener to prevent stale callbacks
  if (window.electronAPI?.onMenuSave) {
    window.electronAPI.onMenuSave(() => {});
  }

  lastRendered = null;
  headingMenuOpen = false;
}

// --- Flush pending debounce to sync document model ---

function flushDebounce(textarea) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (textarea) {
    updateContent(textarea.value);
  }
}

// --- Formatting helpers ---

function wrapSelection(textarea, before, after) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  const replacement = before + (selected || 'text') + after;
  textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

  if (selected) {
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length + selected.length;
  } else {
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length + 4; // select "text"
  }
  textarea.dispatchEvent(new Event('input'));
}

function insertLink(textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);

  if (selected) {
    const replacement = `[${selected}](url)`;
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    // Select "url"
    textarea.selectionStart = start + selected.length + 3;
    textarea.selectionEnd = start + selected.length + 6;
  } else {
    const replacement = '[link text](url)';
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.selectionStart = start + 1;
    textarea.selectionEnd = start + 10;
  }
  textarea.dispatchEvent(new Event('input'));
}

function insertList(textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);

  if (selected) {
    const lines = selected.split('\n').map((line) => '- ' + line).join('\n');
    textarea.value = textarea.value.substring(0, start) + lines + textarea.value.substring(end);
    textarea.selectionStart = start;
    textarea.selectionEnd = start + lines.length;
  } else {
    const prefix = start > 0 && textarea.value[start - 1] !== '\n' ? '\n' : '';
    textarea.value = textarea.value.substring(0, start) + prefix + '- ' + textarea.value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + prefix.length + 2;
  }
  textarea.dispatchEvent(new Event('input'));
}

function insertHeading(textarea, level) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  const hashes = '#'.repeat(level) + ' ';
  const prefix = start > 0 && textarea.value[start - 1] !== '\n' ? '\n' : '';

  if (selected) {
    const replacement = prefix + hashes + selected;
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.selectionStart = start + prefix.length + hashes.length;
    textarea.selectionEnd = start + prefix.length + hashes.length + selected.length;
  } else {
    const replacement = prefix + hashes + 'Heading';
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.selectionStart = start + prefix.length + hashes.length;
    textarea.selectionEnd = start + prefix.length + hashes.length + 7;
  }
  textarea.dispatchEvent(new Event('input'));
}

// --- Save logic ---

async function handleSave() {
  const doc = getDocument();
  const textarea = document.getElementById('editor-textarea');
  const content = textarea ? textarea.value : doc.content;

  // Sync to document model
  updateContent(content);

  if (window.electronAPI?.saveFile) {
    // Electron save
    try {
      const result = await window.electronAPI.saveFile({
        filePath: doc.filePath,
        content,
        name: doc.name,
      });
      if (result?.filePath) {
        setFilePath(result.filePath);
      }
      if (result?.success) {
        markSaved();
        updateDirtyDotGlobal();
        showToast('Saved');
      }
    } catch {
      showToast('Save failed');
    }
  } else if ('showSaveFilePicker' in window) {
    // Web File System Access API
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: doc.name || 'document.md',
        types: pickerTypesFor(doc.name),
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      markSaved();
      updateDirtyDotGlobal();
      showToast('Saved');
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Save failed');
      }
    }
  } else {
    // Fallback: blob download
    const blob = new Blob([content], { type: mimeFor(doc.name) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name || 'document.md';
    a.click();
    URL.revokeObjectURL(url);
    markSaved();
    updateDirtyDotGlobal();
    showToast('Downloaded');
  }
}

function updateDirtyDotGlobal() {
  const dot = document.getElementById('dirty-dot');
  if (dot) {
    dot.classList.toggle('visible', isDirty());
  }
}

// --- Send to Claude ---

async function sendToClaude() {
  const doc = getDocument();
  const textarea = document.getElementById('editor-textarea');
  const content = textarea ? textarea.value : doc.content;

  if (!content || content.trim().length === 0) {
    showToast('Nothing to send \u2014 write something first');
    return;
  }

  const prompt = `Please review and polish this markdown document. Fix any grammar issues, improve clarity, and maintain the existing formatting structure:\n\n${content}`;

  try {
    await navigator.clipboard.writeText(prompt);
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = prompt;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  if (navigator.onLine) {
    // In Electron, window.open triggers shell.openExternal via setWindowOpenHandler
    window.open('https://claude.ai/new', '_blank');
  }

  showToast('Copied to clipboard \u2014 paste into Claude');
}

// --- Toast utility ---

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

// --- Unsaved changes modal ---

export function showUnsavedModal() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'unsaved-overlay';
    overlay.innerHTML = `
      <div class="unsaved-backdrop"></div>
      <div class="unsaved-modal" role="dialog" aria-modal="true" aria-labelledby="unsaved-heading">
        <h3 id="unsaved-heading">Unsaved Changes</h3>
        <p>You have unsaved edits. What would you like to do?</p>
        <div class="unsaved-actions">
          <button class="btn btn-ghost" id="unsaved-discard">Discard</button>
          <button class="btn btn-primary" id="unsaved-save">Save & Continue</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Focus the discard button initially
    const discardBtn = overlay.querySelector('#unsaved-discard');
    const saveBtn = overlay.querySelector('#unsaved-save');
    discardBtn?.focus();

    function cleanup(result) {
      document.removeEventListener('keydown', onKeydown);
      overlay.remove();
      resolve(result);
    }

    // Escape to cancel, Tab trap between the two buttons
    function onKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup('cancel');
      }
      if (e.key === 'Tab') {
        const focusable = [discardBtn, saveBtn];
        const idx = focusable.indexOf(document.activeElement);
        if (e.shiftKey) {
          e.preventDefault();
          focusable[idx <= 0 ? focusable.length - 1 : idx - 1]?.focus();
        } else {
          e.preventDefault();
          focusable[idx >= focusable.length - 1 ? 0 : idx + 1]?.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeydown);

    discardBtn?.addEventListener('click', () => cleanup('discard'));

    saveBtn?.addEventListener('click', async () => {
      await handleSave();
      cleanup('save');
    });

    overlay.querySelector('.unsaved-backdrop')?.addEventListener('click', () => cleanup('cancel'));
  });
}
