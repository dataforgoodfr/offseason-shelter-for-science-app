import { webtorrentWrapper } from './webtorrent-wrapper';
import * as path from 'path';
import * as fs from 'fs';
import { getDownloadPath } from './store.service';

export interface TorrentDownloadProgress {
    progress: number;
    downloadSpeed: string;
    uploadSpeed: string;
    numPeers: number;
    timeRemaining: string;
    downloaded: number;
    total: number;
}

export class TorrentDownloadService {
    private activeDownloads = new Map<string, any>();

    async downloadFromMagnet(
        magnetLink: string,
        datasetId: string,
        onProgress?: (progress: TorrentDownloadProgress) => void
    ): Promise<string> {
        // Vérifier si le téléchargement est déjà en cours
        if (this.activeDownloads.has(datasetId)) {
            throw new Error(`Download already in progress for dataset: ${datasetId}`);
        }

        try {
            this.activeDownloads.set(datasetId, true);
            const filePath = await this.performTorrentDownload(magnetLink, datasetId, onProgress);
            return filePath;
        } finally {
            this.activeDownloads.delete(datasetId);
        }
    }

    private async performTorrentDownload(
        magnetLink: string,
        datasetId: string,
        onProgress?: (progress: TorrentDownloadProgress) => void
    ): Promise<string> {
        const downloadDir = this.ensureDownloadDirectory();
        const targetPath = path.join(downloadDir, datasetId);

        console.log(`[TorrentDownloadService] Starting torrent download for dataset: ${datasetId}`);
        console.log(`[TorrentDownloadService] Magnet link: ${magnetLink}`);
        console.log(`[TorrentDownloadService] Download path: ${targetPath}`);

        // Utiliser le wrapper webtorrent pour télécharger
        const torrent = await webtorrentWrapper.downloadTorrent(magnetLink, targetPath, (progress) => {
            if (onProgress) {
                onProgress({
                    progress: Math.round(progress.progress * 100),
                    downloadSpeed: this.formatSpeed(progress.downloadSpeed),
                    uploadSpeed: this.formatSpeed(progress.uploadSpeed),
                    numPeers: progress.numPeers,
                    timeRemaining: this.formatETA(progress.timeRemaining),
                    downloaded: progress.downloaded,
                    total: progress.total
                });
            }
        });

        console.log(`[TorrentDownloadService] Torrent download completed: ${targetPath}`);
        return targetPath;
    }

    private ensureDownloadDirectory(): string {
        const downloadDir = getDownloadPath() || "datasets";
        console.log(`[TorrentDownloadService] Download directory: ${downloadDir}`);

        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        return downloadDir;
    }

    private formatSpeed(bytesPerSecond: number): string {
        const mbps = bytesPerSecond / (1024 * 1024);
        if (mbps >= 1) {
            return `${mbps.toFixed(1)} MB/s`;
        }
        const kbps = bytesPerSecond / 1024;
        return `${kbps.toFixed(1)} KB/s`;
    }

    private formatETA(seconds: number): string {
        if (!Number.isFinite(seconds) || seconds < 0) return "--";

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    }

    // Méthodes utilitaires
    isDownloadActive(datasetId: string): boolean {
        return this.activeDownloads.has(datasetId);
    }

    getActiveDownloads(): string[] {
        return Array.from(this.activeDownloads.keys());
    }

    cancelDownload(datasetId: string): boolean {
        if (this.activeDownloads.has(datasetId)) {
            // TODO: Implémenter la logique d'annulation
            this.activeDownloads.delete(datasetId);
            return true;
        }
        return false;
    }
}

export const torrentDownloadService = new TorrentDownloadService(); 