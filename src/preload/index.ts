import { contextBridge, ipcRenderer } from 'electron'
import type { DownloadProgress } from 'lib/electron-app/types';

declare global {
  interface Window {
    App: typeof API
  }
}

const API = {
  sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
  username: process.env.USER,
  openFolderDialog: async (): Promise<string | null> => {
    return await ipcRenderer.invoke('open-folder-dialog');
  },
  setDownloadPath: (path: string) => ipcRenderer.invoke('set-download-path', path),
  getDownloadPath: () => ipcRenderer.invoke('get-download-path'),
  downloadDataset: (datasetId: string) => ipcRenderer.invoke('download-dataset', datasetId),
  onDownloadProgress: (callback: (progressData: DownloadProgress) => void) => {
    ipcRenderer.on('download-progress', (_, progressData) => {
      callback(progressData);
    });
  },
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('download-progress')
  }
}

// API pour les torrents
const torrentAPI = {
  downloadTorrent: (magnetLink: string, datasetId: string) =>
    ipcRenderer.invoke('torrent:download', magnetLink, datasetId),
  onTorrentProgress: (callback: (datasetId: string, progressData: any) => void) => {
    ipcRenderer.on('torrent:download-progress', (_, datasetId, progressData) => {
      callback(datasetId, progressData);
    });
  },
  isDownloading: (datasetId: string) =>
    ipcRenderer.invoke('torrent:is-downloading', datasetId),
  cancelDownload: (datasetId: string) =>
    ipcRenderer.invoke('torrent:cancel-download', datasetId),
  getActiveDownloads: () =>
    ipcRenderer.invoke('torrent:get-active-downloads')
}

contextBridge.exposeInMainWorld('App', API)
contextBridge.exposeInMainWorld('electronAPI', torrentAPI)
