const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('xbat', {
  onControllerUpdate: (callback) => {
    ipcRenderer.on('controller-update', (event, data) => callback(data));
  },
  getData: () => ipcRenderer.invoke('get-data'),
  setLabel: (index, label) => ipcRenderer.invoke('set-label', index, label),
  minimize: () => ipcRenderer.invoke('minimize-window'),
  close: () => ipcRenderer.invoke('close-window'),
});
