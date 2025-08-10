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
  // Méthodes pour le streaming des fichiers torrent au main process
  createTorrentStream: (fileName: string, downloadPath?: string) => 
    ipcRenderer.invoke('create-torrent-stream', fileName, downloadPath),
  writeTorrentChunk: (streamId: string, chunkData: ArrayBuffer, offset: number) => 
    ipcRenderer.invoke('write-torrent-chunk', streamId, chunkData, offset),
  closeTorrentStream: (streamId: string, fileName: string) => 
    ipcRenderer.invoke('close-torrent-stream', streamId, fileName),
  // Méthode pour lire un fichier pour création de torrent
  getFileForTorrent: (filePath: string) => 
    ipcRenderer.invoke('get-file-for-torrent', filePath),
  // Méthodes pour la persistance du seeding
  saveSeedingInfo: (filePath: string, info: any) => 
    ipcRenderer.invoke('save-seeding-info', filePath, info),
  getSeedingData: () => 
    ipcRenderer.invoke('get-seeding-data'),
  removeSeedingInfo: (filePath: string) => 
    ipcRenderer.invoke('remove-seeding-info', filePath),
  scanDirectoryForSeeding: (directoryPath: string) =>
    ipcRenderer.invoke('scan-directory-for-seeding', directoryPath),
  
  // Obtenir l'espace disque disponible (libre) pour un chemin donné
  getFreeSpace: (path: string) => ipcRenderer.invoke('get-free-space', path),
  
  // Détecter la bande passante réseau actuelle
  detectBandwidth: () => ipcRenderer.invoke('detect-bandwidth'),
  
  // Sauvegarder les préférences d'allocation
  setStorageAllocation: (percentage: number) => 
    ipcRenderer.invoke('set-storage-allocation', percentage),
  setBandwidthAllocation: (percentage: number) => 
    ipcRenderer.invoke('set-bandwidth-allocation', percentage),
  
  // Récupérer les préférences sauvegardées
  getStorageAllocation: () => ipcRenderer.invoke('get-storage-allocation'),
  getBandwidthAllocation: () => ipcRenderer.invoke('get-bandwidth-allocation')
}

contextBridge.exposeInMainWorld('App', API)