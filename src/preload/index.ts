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

    // Methods for logging
    addLog: (logData: any) => ipcRenderer.invoke('logger:add-log', logData),
    getLogs: () => ipcRenderer.invoke('logger:get-logs'),
    clearLogs: () => ipcRenderer.invoke('logger:clear-logs'),
    onLoggerNewLog: (callback: (log: any) => void) => {
      ipcRenderer.on('logger:new-log', (_, log) => callback(log))
      return () => ipcRenderer.removeAllListeners('logger:new-log')
    },
    onLoggerLogsCleared: (callback: () => void) => {
      ipcRenderer.on('logger:logs-cleared', () => callback())
      return () => ipcRenderer.removeAllListeners('logger:logs-cleared')
    },

      // Downloaded files persistence
  getDownloadedFiles: () => 
    ipcRenderer.invoke('get-downloaded-files'),
  addDownloadedFile: (filePath: string) => 
    ipcRenderer.invoke('add-downloaded-file', filePath),
  cleanupDownloadedFiles: (directoryPath: string) =>
    ipcRenderer.invoke('cleanup-downloaded-files', directoryPath),

  // Dummy downloader
  downloadFile: (url: string, downloadPath: string, filename: string) =>
    ipcRenderer.invoke('download-file', url, downloadPath, filename),
  

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
  getBandwidthAllocation: () => ipcRenderer.invoke('get-bandwidth-allocation'),

 // Nouvelles méthodes pour éviter CORS
  fetchClimateData: (url: string, options: any) => 
    ipcRenderer.invoke('fetch-climate-data', url, options),

  checkFileExists: (filePath: string) => 
    ipcRenderer.invoke('check-file-exists', filePath),

  // Initialization methods
  startInitialization: (path: string) => ipcRenderer.invoke('init:start', path),
  retryInitialization: () => ipcRenderer.invoke('init:retry'),
  
  // Initialization event listeners
  onInitializationStepStatus: (callback: (data: { stepId: string, status: string }) => void) => {
    ipcRenderer.on('init:step-status', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('init:step-status')
  },
  onInitializationStateChange: (callback: (data: { state: string, value: boolean }) => void) => {
    ipcRenderer.on('init:state-change', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('init:state-change')
  },
  onInitializationComplete: (callback: (data: { freeBytes: number }) => void) => {
    ipcRenderer.on('init:complete', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('init:complete')
  },
  onInitializationError: (callback: (data: { error: string }) => void) => {
    ipcRenderer.on('init:error', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('init:error')
  },

  // Window height control
  expandMainWindowHeight: (isExpanded: boolean) => ipcRenderer.invoke('window:expand-height', isExpanded),

  // Cleanup event listeners
  onCleanupFilesSuccess: (callback: () => void) => {
    ipcRenderer.on('cleanup:files-success', () => callback())
    return () => ipcRenderer.removeAllListeners('cleanup:files-success')
  },
  onCleanupError: (callback: (data: { error: string }) => void) => {
    ipcRenderer.on('cleanup:error', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('cleanup:error')
  },
}

contextBridge.exposeInMainWorld('App', API)
