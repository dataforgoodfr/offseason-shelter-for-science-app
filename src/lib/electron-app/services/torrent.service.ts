// src/main/services/TorrentService.ts
import WebTorrent from 'webtorrent';
import * as path from 'path';
import * as fs from 'fs';

class TorrentService {
    private client: WebTorrent.Instance;
    private activeTorrents: Map<string, WebTorrent.Torrent> = new Map();

    constructor() {
        this.client = new WebTorrent();
    }

    /**
     * Crée un magnet link à partir d'un fichier local et commence le seeding
     */
    async createMagnetAndSeed(filePath: string, datasetId: string): Promise<string> {
        console.log(`[TorrentService] Creating torrent for file: ${filePath}`);

        // Vérifier que le fichier existe
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Options pour créer le torrent
        const torrentOptions = {
            name: `dataset_${datasetId}`,
            comment: `Shelter4Science dataset: ${datasetId}`,
            createdBy: 'Shelter4Science Node v1.0.0',
            announceList: [
                ['wss://tracker.openwebtorrent.com'],
            ]
        };

        // Promisifier la création de torrent
        const torrent = await this.seedFile(filePath, torrentOptions);

        console.log(`[TorrentService] Torrent created successfully:`);
        console.log(`  - InfoHash: ${torrent.infoHash}`);
        console.log(`  - MagnetURI: ${torrent.magnetURI}`);

        // Stocker la référence
        this.activeTorrents.set(datasetId, torrent);

        // Écouter les événements
        this.setupTorrentListeners(torrent, datasetId);

        return torrent.magnetURI;
    }

    /**
     * Helper pour promisifier client.seed()
     */
    private async seedFile(filePath: string, options: any): Promise<WebTorrent.Torrent> {
        return new Promise((resolve, reject) => {
            this.client.seed(filePath, options, (torrent) => {
                if (torrent) {
                    resolve(torrent);
                } else {
                    reject(new Error('Failed to create torrent'));
                }
            });
        });
    }

    /**
     * Configure les listeners pour un torrent
     */
    private setupTorrentListeners(torrent: WebTorrent.Torrent, datasetId: string): void {
        torrent.on('upload', () => {
            console.log(`[TorrentService] Uploading dataset ${datasetId} - Speed: ${torrent.uploadSpeed} bytes/s`);
        });

        torrent.on('wire', () => {
            console.log(`[TorrentService] New peer connected for dataset ${datasetId}`);
        });

        torrent.on('error', (error) => {
            console.error(`[TorrentService] Torrent error for dataset ${datasetId}:`, error);
        });

        torrent.on('warning', (warning) => {
            console.warn(`[TorrentService] Torrent warning for dataset ${datasetId}:`, warning);
        });
    }

    /**
     * Arrête le seeding d'un dataset
     */
    async stopSeeding(datasetId: string): Promise<boolean> {
        const torrent = this.activeTorrents.get(datasetId);

        if (!torrent) {
            console.warn(`[TorrentService] No active torrent found for dataset: ${datasetId}`);
            return false;
        }

        await this.destroyTorrent(torrent);
        this.activeTorrents.delete(datasetId);
        console.log(`[TorrentService] Stopped seeding dataset: ${datasetId}`);

        return true;
    }

    /**
     * Helper pour promisifier torrent.destroy()
     */
    private async destroyTorrent(torrent: WebTorrent.Torrent): Promise<void> {
        return new Promise((resolve) => {
            torrent.destroy({}, () => resolve());
        });
    }


    /**
     * Récupère les stats d'un torrent
     */
    getTorrentStats(datasetId: string): any {
        const torrent = this.activeTorrents.get(datasetId);

        if (!torrent) {
            return null;
        }

        return {
            peers: torrent.numPeers,
            uploaded: torrent.uploaded,
            uploadSpeed: torrent.uploadSpeed,
            ratio: torrent.ratio,
            progress: torrent.progress
        };
    }

    /**
     * Liste tous les torrents actifs
     */
    getActiveTorrents(): string[] {
        return Array.from(this.activeTorrents.keys());
    }

    /**
     * Nettoie et ferme le client WebTorrent
     */
    async destroy(): Promise<void> {
        await this.destroyClient();
        console.log('[TorrentService] WebTorrent client destroyed');
    }

    /**
     * Helper pour promisifier client.destroy()
     */
    private async destroyClient(): Promise<void> {
        return new Promise((resolve) => {
            this.client.destroy(() => resolve());
        });
    }
}

// Export singleton
export const torrentService = new TorrentService();
export { TorrentService };
