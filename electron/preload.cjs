const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onFileOpened: (callback) => {
    ipcRenderer.removeAllListeners('file-opened');
    ipcRenderer.on('file-opened', (_event, data) => callback(data));
  },
  signalReady: () => ipcRenderer.send('renderer-ready'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  isElectron: true,
});
