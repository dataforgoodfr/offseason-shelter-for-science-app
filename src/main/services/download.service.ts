// src/main/services/DatasetService.ts
import * as fs from "fs";
import * as path from "path";
import type { Readable } from "stream";
import httpService from "./http.service";
import { getDownloadPath } from "./store.service";

export async function downloadDataset(
  datasetId: string,
  onProgress: (progress: number, speed: string, eta: string) => void
): Promise<string> {
  const datasetsDir = getDownloadPath() || "datasets";
  // const datasetsDir = path.join(process.cwd(), getDownloadPath() || "datasets");
  console.log(`Datasets directory: ${datasetsDir}`);
  if (!fs.existsSync(datasetsDir)) {
    fs.mkdirSync(datasetsDir, { recursive: true });
  }

  // TODO : Récupérer le nom du dataset depuis l'API
  const filePath = path.join(datasetsDir, `${datasetId}.csv`);

  console.log(`Starting download for dataset: ${datasetId}`);
  console.log(`Saving to: ${filePath}`);

  const response = await httpService.get("/datasets", {
    params: { id: datasetId },
    responseType: "stream",
    timeout: 300000, // 5 minutes timeout
  });

  // Cast vers stream pour TypeScript
  const stream = response.data as Readable;

  const totalSize = Number.parseInt(
    response.headers["content-length"] || "0",
    10
  );
  let downloadedSize = 0;
  const startTime = Date.now();

  // Créer le stream d'écriture
  const writer = fs.createWriteStream(filePath);

  // Écouter les chunks pour calculer la progression
  stream.on("data", (chunk: Buffer) => {
    downloadedSize += chunk.length;

    if (totalSize > 0) {
      const progress = Math.round((downloadedSize / totalSize) * 100);
      const elapsedTime = (Date.now() - startTime) / 1000;
      const speed = formatSpeed(downloadedSize / elapsedTime);
      const eta = formatETA(
        (totalSize - downloadedSize) / (downloadedSize / elapsedTime)
      );

      onProgress(progress, speed, eta);
    }
  });

  // Pipe le stream vers le fichier
  stream.pipe(writer);

  // Promesse pour attendre la fin du téléchargement
  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      console.log(`Download completed: ${filePath}`);
      resolve(filePath);
    });

    writer.on("error", (error) => {
      console.error(`Download failed: ${error.message}`);
      // Supprimer le fichier partiel en cas d'erreur
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      reject(error);
    });

    stream.on("error", (error) => {
      console.error(`Stream error: ${error.message}`);
      reject(error);
    });
  });
}

function formatSpeed(bytesPerSecond: number): string {
  const mbps = bytesPerSecond / (1024 * 1024);
  if (mbps >= 1) {
    return `${mbps.toFixed(1)} MB/s`;
  }
  const kbps = bytesPerSecond / 1024;
  return `${kbps.toFixed(1)} KB/s`;
}

function formatETA(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "--";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}
