import { ipcMain } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { getDownloadPath } from '../../../../main/services/store.service'
import { downloadDataset } from '../../../../main/services/download.service'

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
      
      return { success: true }
    } catch (error: any) {
      console.error('Error closing torrent stream:', error)
      return { success: false, error: error.message }
    }
  })

  // Nouveau handler pour lire un fichier pour création de torrent
  ipcMain.handle('get-file-for-torrent', async (event, filePath: string) => {
    try {
      // Vérifier que le fichier existe
      await fs.access(filePath)
      
      // Lire le fichier
      const fileData = await fs.readFile(filePath)
      
      // Extraire le nom du fichier
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown'
      
      return { 
        success: true, 
        fileData: fileData.buffer, 
        originalFileName: fileName 
      }
    } catch (error: any) {
      console.error('Error reading file for torrent:', error)
      return { success: false, error: error.message }
    }
  })
}
