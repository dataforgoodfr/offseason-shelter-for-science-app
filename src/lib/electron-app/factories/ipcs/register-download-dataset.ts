import { ipcMain } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { getDownloadPath } from '../../services/store.service'
import { downloadDataset } from '../../services/download.service'

export function registerDownloadDataset() {
  ipcMain.handle('download-dataset', async (event, datasetId: string) => {
    try {
      const downloadPath = getDownloadPath()
      if (!downloadPath) {
        throw new Error('No download path set')
      }

      const result = await downloadDataset(datasetId, (progress: number, speed: string, eta: string) => {
        event.sender.send('download-progress', progress, speed, eta)
      })

      return { success: true, filePath: result }
    } catch (error: any) {
      console.error('Download error:', error)
      return { success: false, error: error.message }
    }
  })

  // Nouveau handler pour sauvegarder les fichiers torrents
  ipcMain.handle('save-torrent-file', async (event, fileName: string, fileData: ArrayBuffer, customPath?: string) => {
    try {
      const downloadPath = customPath || getDownloadPath()
      if (!downloadPath) {
        throw new Error('No download path set')
      }

      // Créer le chemin complet du fichier
      const filePath = join(downloadPath, fileName)
      
      // Convertir ArrayBuffer en Buffer
      const buffer = Buffer.from(fileData)
      
      // Écrire le fichier sur le disque
      await fs.writeFile(filePath, buffer)
      
      // Notifier le succès
      event.sender.send('torrent-save-progress', fileName, true)
      
      return { success: true, filePath }
    } catch (error: any) {
      console.error('Torrent file save error:', error)
      
      // Notifier l'erreur
      event.sender.send('torrent-save-progress', fileName, false, error.message)
      
      return { success: false, error: error.message }
    }
  })

  // Nouveaux handlers pour le streaming de fichiers torrents
  const activeStreams = new Map<string, fs.FileHandle>()

  ipcMain.handle('create-torrent-stream', async (event, fileName: string, customPath?: string) => {
    try {
      const downloadPath = customPath || getDownloadPath()
      if (!downloadPath) {
        throw new Error('No download path set')
      }

      const filePath = join(downloadPath, fileName)
      const fileHandle = await fs.open(filePath, 'w')
      
      // Stocker le handle pour les écritures futures
      const streamId = `${fileName}-${Date.now()}`
      activeStreams.set(streamId, fileHandle)
      
      return { success: true, streamId, filePath }
    } catch (error: any) {
      console.error('Error creating torrent stream:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('write-torrent-chunk', async (event, streamId: string, chunkData: ArrayBuffer, offset: number) => {
    try {
      const fileHandle = activeStreams.get(streamId)
      if (!fileHandle) {
        throw new Error('Stream not found')
      }

      const buffer = Buffer.from(chunkData)
      await fileHandle.write(buffer, 0, buffer.length, offset)
      
      return { success: true }
    } catch (error: any) {
      console.error('Error writing torrent chunk:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('close-torrent-stream', async (event, streamId: string, fileName: string) => {
    try {
      const fileHandle = activeStreams.get(streamId)
      if (fileHandle) {
        await fileHandle.close()
        activeStreams.delete(streamId)
      }
      
      // Notifier que le fichier est complètement sauvegardé
      event.sender.send('torrent-save-progress', fileName, true)
      
      return { success: true }
    } catch (error: any) {
      console.error('Error closing torrent stream:', error)
      event.sender.send('torrent-save-progress', fileName, false, error.message)
      return { success: false, error: error.message }
    }
  })
}
