import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MD_REGEX = /\.(md|markdown|mdown|mkd|mdx|txt|json|yaml|yml|toml|csv|spec|log|ini|env|xml)$/i;

let mainWindow;
let pendingFile = null; // file to open once the renderer is ready

// Single-instance lock — so file associations work when the app is already open
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const filePath = findMdInArgs(argv);
      if (filePath) {
        if (mainWindow.webContents.isLoading()) {
          pendingFile = filePath;
        } else {
          sendFileToRenderer(filePath);
        }
      }
    }
  });

  // macOS: file associations dispatch via 'open-file', not argv. The listener
  // must be attached during 'will-finish-launching' so a cold-start event
  // (fired before app.whenReady resolves) is not dropped.
  app.on('will-finish-launching', () => {
    app.on('open-file', (event, filePath) => {
      event.preventDefault();
      if (mainWindow) {
        if (mainWindow.webContents.isLoading()) {
          pendingFile = filePath;
        } else {
          sendFileToRenderer(filePath);
        }
      } else {
        pendingFile = filePath;
      }
    });
  });

  app.whenReady().then(() => {
    createWindow();

    const filePath = findMdInArgs(process.argv);
    if (filePath) {
      pendingFile = filePath;
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  app.quit();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 600,
    minHeight: 500,
    title: 'inkMD',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    backgroundColor: '#faf6f0',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Block all navigation — the app is a single-page app that never navigates
  mainWindow.webContents.on('will-navigate', (e) => {
    e.preventDefault();
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  buildMenu();
}

function buildMenu() {
  const isDev = !app.isPackaged;
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => openFileDialog(),
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu-save');
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools' }] : []),
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function openFileDialog() {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Open File',
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'mdx'] },
      { name: 'Plain Text Files', extensions: ['txt', 'json', 'yaml', 'yml', 'toml', 'csv', 'spec', 'log', 'ini', 'env', 'xml'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (canceled || filePaths.length === 0) return;
  sendFileToRenderer(filePaths[0]);
}

function sendFileToRenderer(filePath) {
  try {
    const resolved = path.resolve(filePath);
    const content = fs.readFileSync(resolved, 'utf-8');
    const name = path.basename(resolved);
    mainWindow.webContents.send('file-opened', { name, content, filePath: resolved });
  } catch {
    // File not found or unreadable — ignore silently
  }
}

function findMdInArgs(argv) {
  const args = argv.slice(app.isPackaged ? 1 : 2);
  const match = args.find((a) => !a.startsWith('-') && MD_REGEX.test(a));
  if (match && fs.existsSync(path.resolve(match))) return match;
  return null;
}

// Renderer signals it's ready — send any pending file
ipcMain.on('renderer-ready', () => {
  if (pendingFile) {
    sendFileToRenderer(pendingFile);
    pendingFile = null;
  }
});

ipcMain.handle('open-file-dialog', async () => {
  await openFileDialog();
});

ipcMain.handle('read-file', async (_event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(filePath);
    return { name, content };
  } catch {
    return null;
  }
});

ipcMain.handle('save-file', async (_event, { filePath, content, name }) => {
  try {
    if (filePath) {
      await fs.promises.writeFile(filePath, content, 'utf-8');
      return { success: true, filePath };
    } else {
      const { canceled, filePath: savePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save File',
        defaultPath: name || 'document.md',
        filters: [
          { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'mdx'] },
          { name: 'Plain Text', extensions: ['txt', 'json', 'yaml', 'yml', 'toml', 'csv', 'spec', 'log', 'ini', 'env', 'xml'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (canceled || !savePath) return { success: false };
      await fs.promises.writeFile(savePath, content, 'utf-8');
      return { success: true, filePath: savePath };
    }
  } catch {
    return { success: false };
  }
});
