import './style.css';
import { on } from './core/events.js';
import { initTheme } from './components/theme-toggle.js';
import * as landing from './views/landing.js';
import * as reader from './views/reader.js';

const app = document.getElementById('app');

let currentView = null;
let currentData = null;

function navigateTo(view, data) {
  // Destroy previous view
  if (currentView?.destroy) currentView.destroy();

  currentView = view;
  currentData = data;

  app.innerHTML = view.render(data);
  view.mount(data);
}

// Initialize theme before first render
initTheme();

// Event listeners
on('file:loaded', (data) => {
  navigateTo(reader, data);
});

on('navigate:landing', () => {
  navigateTo(landing, {});
});

on('navigate:reader', (data) => {
  navigateTo(reader, data);
});

// Start on landing
navigateTo(landing, {});

// Listen for files opened via Electron native menu/dialog/file association
if (window.electronAPI) {
  window.electronAPI.onFileOpened((data) => {
    navigateTo(reader, data);
  });
  // Tell main process we're ready to receive files (for CLI args / file associations)
  window.electronAPI.signalReady();
}

// Register service worker
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onOfflineReady() {
        showToast('App is ready for offline use');
      },
    });
  }).catch(() => {
    // PWA registration not available in dev mode
  });
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
