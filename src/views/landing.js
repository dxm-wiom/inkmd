import * as fileInput from '../components/file-input.js';
import * as textInput from '../components/text-input.js';
import * as urlInput from '../components/url-input.js';
import * as pathInput from '../components/path-input.js';
import * as recentFiles from '../components/recent-files.js';
import { renderToggleButtons, mountToggleButtons } from '../components/theme-toggle.js';

export function render() {
  return `
    <div class="landing view-enter">
      <div class="landing-theme-toggle">
        ${renderToggleButtons()}
      </div>
      <div class="landing-header">
        <div class="landing-logo">
          <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <circle cx="16" cy="16" r="10" stroke="#faf6f0" stroke-width="1.8"/>
            <line x1="16" y1="16" x2="16" y2="5.5" stroke="#faf6f0" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="16" y1="16" x2="24.2" y2="9.5" stroke="#faf6f0" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="16" y1="16" x2="26.2" y2="18.3" stroke="#faf6f0" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="16" y1="16" x2="20.6" y2="25.5" stroke="#faf6f0" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="16" y1="16" x2="11.4" y2="25.5" stroke="#faf6f0" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="16" y1="16" x2="5.8" y2="18.3" stroke="#faf6f0" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="16" y1="16" x2="7.8" y2="9.5" stroke="#faf6f0" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="16" cy="16" r="2.2" fill="#faf6f0"/>
          </svg>
        </div>
        <h1 class="landing-title">inkMD</h1>
        <p class="landing-subtitle">A beautiful way to read markdown</p>
      </div>
      <div class="landing-container">
        <div class="input-grid">
          <div class="input-grid-utilities">
            ${fileInput.render()}
            ${urlInput.render()}
            ${pathInput.render()}
          </div>
          ${textInput.render()}
        </div>
        ${recentFiles.render()}
      </div>
    </div>
  `;
}

export function mount() {
  fileInput.mount();
  textInput.mount();
  urlInput.mount();
  pathInput.mount();
  recentFiles.mount();
  mountToggleButtons();
}

export function destroy() {
  fileInput.destroy();
  pathInput.destroy();
}
