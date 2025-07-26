// src/main/services/TorrentService.ts
import { webtorrentWrapper } from './webtorrent-wrapper';

class TorrentService {
    /**
     * Crée un magnet link à partir d'un fichier local et commence le seeding
     */
    async createMagnetAndSeed(filePath: string, datasetId: string): Promise<string> {
        return webtorrentWrapper.createMagnetAndSeed(filePath, datasetId);
    }

    /**
     * Arrête le seeding d'un dataset
     */
    async stopSeeding(datasetId: string): Promise<boolean> {
        return webtorrentWrapper.stopSeeding(datasetId);
    }

    /**
     * Récupère les stats d'un torrent
     */
    getTorrentStats(datasetId: string): any {
        return webtorrentWrapper.getTorrentStats(datasetId);
    }

    /**
     * Liste tous les torrents actifs
     */
    getActiveTorrents(): string[] {
        return webtorrentWrapper.getActiveTorrents();
    }

    /**
     * Nettoie et ferme le client WebTorrent
     */
    async destroy(): Promise<void> {
        return webtorrentWrapper.destroy();
    }
}

// Export singleton
export const torrentService = new TorrentService();
export { TorrentService };
