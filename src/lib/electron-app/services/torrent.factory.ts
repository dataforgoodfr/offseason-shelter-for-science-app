// lib/electron-app/factories/services/torrent-factory.ts

import { TorrentService } from "./torrent.service"

let torrentServiceInstance: TorrentService | null = null

export function createTorrentService(): TorrentService {
    if (!torrentServiceInstance) {
        torrentServiceInstance = new TorrentService()
    }
    return torrentServiceInstance
}

export function getTorrentService(): TorrentService {
    if (!torrentServiceInstance) {
        throw new Error('TorrentService non initialisé. Appelez createTorrentService() d\'abord.')
    }
    return torrentServiceInstance
}
