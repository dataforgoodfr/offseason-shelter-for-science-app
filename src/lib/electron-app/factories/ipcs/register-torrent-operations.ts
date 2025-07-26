// lib/electron-app/factories/ipcs/register-torrent-operations.ts
import { ipcMain } from 'electron'
import path from 'path'
import { app } from 'electron'
import { getTorrentService } from 'lib/electron-app/services/torrent.factory'

export function registerTorrentOperations() {
    // Ajouter un torrent
    ipcMain.handle('torrent:add', async (event, magnetUri: string, downloadPath?: string) => {
        try {
            const torrentService = getTorrentService()
            const defaultPath = downloadPath || path.join(app.getPath('downloads'), 'ShelterForScience')

            console.log('📥 IPC: Ajout torrent', { magnetUri, downloadPath: defaultPath })

            const result = await torrentService.addTorrent(magnetUri, defaultPath)
            return { success: true, data: result }
        } catch (error: any) {
            console.error('❌ Erreur ajout torrent:', error)
            return { success: false, error: error.message }
        }
    })

    // Lister les torrents
    ipcMain.handle('torrent:list', async () => {
        try {
            const torrentService = getTorrentService()
            const torrents = torrentService.getTorrents()
            return { success: true, data: torrents }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    })

    // Mettre en pause
    ipcMain.handle('torrent:pause', async (event, infoHash: string) => {
        try {
            const torrentService = getTorrentService()
            torrentService.pauseTorrent(infoHash)
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    })

    // Reprendre
    ipcMain.handle('torrent:resume', async (event, infoHash: string) => {
        try {
            const torrentService = getTorrentService()
            torrentService.resumeTorrent(infoHash)
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    })

    // Supprimer
    ipcMain.handle('torrent:remove', async (event, infoHash: string) => {
        try {
            const torrentService = getTorrentService()
            torrentService.removeTorrent(infoHash)
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    })

    console.log('✅ IPC handlers torrent enregistrés')
}
