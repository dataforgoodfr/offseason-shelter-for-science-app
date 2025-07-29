import { contextBridge, ipcRenderer } from 'electron'

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
  onDownloadProgress: (callback: (progress: number, speed: string, eta: string) => void) => {
    ipcRenderer.on('download-progress', (_, progress, speed, eta) => callback(progress, speed, eta))
  },
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('download-progress')
  },
  // Nouvelles méthodes pour les torrents
  saveTorrentFile: (fileName: string, fileData: ArrayBuffer, downloadPath: string) => 
    ipcRenderer.invoke('save-torrent-file', fileName, fileData, downloadPath),
  onTorrentSaveProgress: (callback: (fileName: string, saved: boolean, error?: string) => void) => {
    ipcRenderer.on('torrent-save-progress', (_, fileName, saved, error) => callback(fileName, saved, error))
  },
  removeTorrentSaveProgressListener: () => {
    ipcRenderer.removeAllListeners('torrent-save-progress')
  },
  // Nouvelles méthodes pour le streaming
  createTorrentStream: (fileName: string, downloadPath?: string) => 
    ipcRenderer.invoke('create-torrent-stream', fileName, downloadPath),
  writeTorrentChunk: (streamId: string, chunkData: ArrayBuffer, offset: number) => 
    ipcRenderer.invoke('write-torrent-chunk', streamId, chunkData, offset),
  closeTorrentStream: (streamId: string, fileName: string) => 
    ipcRenderer.invoke('close-torrent-stream', streamId, fileName),
  // Nouvelle méthode pour lire un fichier pour création de torrent
  getFileForTorrent: (filePath: string) => 
    ipcRenderer.invoke('get-file-for-torrent', filePath)
}

contextBridge.exposeInMainWorld('App', API)
