// Wrapper pour webtorrent qui gère les modules ES
let WebTorrent: any;

// Import dynamique pour éviter les problèmes de modules ES
async function loadWebTorrent() {
    if (!WebTorrent) {
        try {
            const webtorrentModule = await import('webtorrent');
            WebTorrent = webtorrentModule.default || webtorrentModule;
        } catch (error) {
            console.error('Failed to load webtorrent:', error);
            throw error;
        }
    }
    return WebTorrent;
}

export class WebTorrentWrapper {
    private client: any;
    private activeTorrents: Map<string, any> = new Map();

    constructor() {
        this.initializeClient();
    }

    private async initializeClient() {
        const WebTorrentClass = await loadWebTorrent();
        this.client = new WebTorrentClass();
    }

    async createMagnetAndSeed(filePath: string, datasetId: string): Promise<string> {
        console.log(`[WebTorrentWrapper] Creating torrent for file: ${filePath}`);

        // S'assurer que le client est initialisé
        if (!this.client) {
            await this.initializeClient();
        }

        // Vérifier que le fichier existe
        const fs = await import('fs');
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

        console.log(`  - InfoHash: ${torrent.infoHash}`);
        console.log(`  - MagnetURI: ${torrent.magnetURI}`);

        // Stocker la référence
        this.activeTorrents.set(datasetId, torrent);

        // Écouter les événements
        this.setupTorrentListeners(torrent, datasetId);

        return torrent.magnetURI;
    }

    private async seedFile(filePath: string, options: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.seed(filePath, options, (torrent: any) => {
                if (torrent) {
                    resolve(torrent);
                } else {
                    reject(new Error('Failed to create torrent'));
                }
            });
        });
    }

    async downloadTorrent(
        magnetLink: string,
        downloadPath: string,
        onProgress?: (progress: any) => void
    ): Promise<any> {
        console.log(`[WebTorrentWrapper] Starting torrent download from magnet: ${magnetLink}`);

        // S'assurer que le client est initialisé
        if (!this.client) {
            await this.initializeClient();
        }

        // Promisifier l'ajout du torrent
        const torrent = await this.addTorrent(magnetLink, downloadPath);

        console.log(`[WebTorrentWrapper] Torrent added successfully:`);
        console.log(`  - InfoHash: ${torrent.infoHash}`);
        console.log(`  - Name: ${torrent.name}`);

        // Configurer le callback de progression
        if (onProgress) {
            torrent.on('download', () => {
                const progress = {
                    progress: torrent.progress,
                    downloadSpeed: torrent.downloadSpeed,
                    uploadSpeed: torrent.uploadSpeed,
                    numPeers: torrent.numPeers,
                    timeRemaining: this.calculateTimeRemaining(torrent),
                    downloaded: torrent.downloaded,
                    total: torrent.length
                };
                onProgress(progress);
            });
        }

        // Attendre que le téléchargement soit terminé
        await this.waitForDownloadComplete(torrent);

        return torrent;
    }

    private async addTorrent(magnetLink: string, downloadPath: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.add(magnetLink, { path: downloadPath }, (torrent: any) => {
                if (torrent) {
                    resolve(torrent);
                } else {
                    reject(new Error('Failed to add torrent'));
                }
            });
        });
    }

    private calculateTimeRemaining(torrent: any): number {
        if (torrent.downloadSpeed === 0) return 0;
        const remaining = torrent.length - torrent.downloaded;
        return remaining / torrent.downloadSpeed;
    }

    private async waitForDownloadComplete(torrent: any): Promise<void> {
        return new Promise((resolve) => {
            torrent.on('done', () => {
                console.log(`[WebTorrentWrapper] Torrent download completed: ${torrent.name}`);
                resolve();
            });
        });
    }

    private setupTorrentListeners(torrent: any, datasetId: string): void {
        torrent.on('upload', () => {
            console.log(`[WebTorrentWrapper] Uploading dataset ${datasetId} - Speed: ${torrent.uploadSpeed} bytes/s`);
        });

        torrent.on('wire', () => {
            console.log(`[WebTorrentWrapper] New peer connected for dataset ${datasetId}`);
        });

        torrent.on('error', (error: any) => {
            console.error(`[WebTorrentWrapper] Torrent error for dataset ${datasetId}:`, error);
        });

        torrent.on('warning', (warning: any) => {
            console.warn(`[WebTorrentWrapper] Torrent warning for dataset ${datasetId}:`, warning);
        });
    }

    async stopSeeding(datasetId: string): Promise<boolean> {
        const torrent = this.activeTorrents.get(datasetId);

        if (!torrent) {
            console.warn(`[WebTorrentWrapper] No active torrent found for dataset: ${datasetId}`);
            return false;
        }

        await this.destroyTorrent(torrent);
        this.activeTorrents.delete(datasetId);
        console.log(`[WebTorrentWrapper] Stopped seeding dataset: ${datasetId}`);

        return true;
    }

    private async destroyTorrent(torrent: any): Promise<void> {
        return new Promise((resolve) => {
            torrent.destroy({}, () => resolve());
        });
    }

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

    getActiveTorrents(): string[] {
        return Array.from(this.activeTorrents.keys());
    }

    async destroy(): Promise<void> {
        await this.destroyClient();
        console.log("[WebTorrentWrapper] WebTorrent client destroyed");
    }

    private async destroyClient(): Promise<void> {
        return new Promise((resolve) => {
            this.client.destroy(() => resolve());
        });
    }
}

// Export singleton
export const webtorrentWrapper = new WebTorrentWrapper(); 