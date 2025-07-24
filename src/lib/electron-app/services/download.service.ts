import * as fs from "fs";
import * as path from "path";
import type { Readable } from "stream";
import httpService from "./http.service";
import { getDownloadPath } from "./store.service";
import type { DownloadProgress } from "../types";
import { torrentService } from "./torrent.service";
import { dispatcherService } from "./dispatcher.service";

export class DownloadService {
  private activeDownloads = new Map<string, boolean>();

  async downloadDataset(
    datasetId: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    // Vérifier si le téléchargement est déjà en cours
    if (this.activeDownloads.has(datasetId)) {
      throw new Error(`Download already in progress for dataset: ${datasetId}`);
    }

    try {
      this.activeDownloads.set(datasetId, true);
      const filePath = await this.performDownload(datasetId, onProgress);

      // ✅ Créer le magnet link et commencer le seeding
      // const magnetLink = await torrentService.createMagnetAndSeed(filePath, datasetId);

      // // ✅ Notifier le dispatcher avec le vrai magnet link
      // await dispatcherService.notifyDownloadComplete(datasetId, magnetLink);

      return filePath;
    } finally {
      this.activeDownloads.delete(datasetId);
    }
  }

  private async performDownload(
    datasetId: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    const datasetsDir = this.ensureDownloadDirectory();
    const filePath = path.join(datasetsDir, `${datasetId}.csv`);

    console.log(`Starting download for dataset: ${datasetId}`);
    console.log(`Saving to: ${filePath}`);

    const response = await httpService.get("/datasets", {
      params: { id: datasetId },
      responseType: "stream",
      timeout: 300000, // 5 minutes timeout
    });

    const stream = response.data as Readable;
    const totalSize = Number.parseInt(
      response.headers["content-length"] || "0",
      10
    );

    return this.streamToFile(stream, filePath, totalSize, onProgress);
  }

  private ensureDownloadDirectory(): string {
    const datasetsDir = getDownloadPath() || "datasets";
    console.log(`Datasets directory: ${datasetsDir}`);

    if (!fs.existsSync(datasetsDir)) {
      fs.mkdirSync(datasetsDir, { recursive: true });
    }

    return datasetsDir;
  }

  private streamToFile(
    stream: Readable,
    filePath: string,
    totalSize: number,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let downloadedSize = 0;
      const startTime = Date.now();
      const writer = fs.createWriteStream(filePath);

      // Écouter les chunks pour calculer la progression
      stream.on("data", (chunk: Buffer) => {
        downloadedSize += chunk.length;

        if (totalSize > 0 && onProgress) {
          const progress = Math.round((downloadedSize / totalSize) * 100);
          const elapsedTime = (Date.now() - startTime) / 1000;
          const speed = this.formatSpeed(downloadedSize / elapsedTime);
          const eta = this.formatETA(
            (totalSize - downloadedSize) / (downloadedSize / elapsedTime)
          );

          onProgress({
            progress,
            speed,
            eta,
            downloadedSize,
            totalSize
          });
        }
      });

      // Pipe le stream vers le fichier
      stream.pipe(writer);

      writer.on("finish", () => {
        console.log(`Download completed: ${filePath}`);
        resolve(filePath);
      });

      writer.on("error", (error) => {
        console.error(`Download failed: ${error.message}`);
        this.cleanupFailedDownload(filePath);
        reject(error);
      });

      stream.on("error", (error) => {
        console.error(`Stream error: ${error.message}`);
        this.cleanupFailedDownload(filePath);
        reject(error);
      });
    });
  }

  private cleanupFailedDownload(filePath: string): void {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up partial file: ${filePath}`);
      } catch (error) {
        console.error(`Failed to cleanup file: ${error}`);
      }
    }
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

export const downloadService = new DownloadService();
