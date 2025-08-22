import * as fs from "fs";
import * as path from "path";
import { addDownloadedFile } from "./download-store.service";

interface DownloadProgress {
  progress: number;
  speed: string;
  eta: string;
}

interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

import { MEGA_BYTES } from "../../lib/electron-app/utils/units"

/**
 * Downloads a file from a URL and saves it to the specified directory
 * @param url - The URL of the file to download
 * @param downloadPath - The destination directory
 * @param fileName - File name (optional, will be extracted from URL if not provided)
 * @param onProgress - Callback to track progress
 * @returns Promise<DownloadResult>
 */
export async function downloadFile(
  url: string,
  downloadPath: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
  try {
    if (!downloadPath) {
      throw new Error("Download path is required");
    }

    // Checking URL
    if (!isValidUrl(url)) {
      throw new Error("Invalid URL");
    }

    // Extract file name from URL
    const fileName = path.basename(url) || `download_${Date.now()}`;

    // Build complete file path
    const filePath = path.join(downloadPath, fileName);
    
    console.log(`🚀 Starting download from: ${url}`);
    console.log(`📁 Saving to: ${filePath}`);

    // Perform HTTP request
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get total file size
    const totalSize = Number.parseInt(
      response.headers.get("content-length") || "0",
      10
    );

    // Create read stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get response body reader");
    }

    // Create write stream
    const writer = fs.createWriteStream(filePath);
    
    let downloadedSize = 0;
    const startTime = Date.now();

    // Read chunks and write them
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // Write chunk
      writer.write(value);
      downloadedSize += value.length;

      // Calculate and report progress
      if (totalSize > 0 && onProgress) {
        const progress = Math.round((downloadedSize / totalSize) * 100);
        const elapsedTime = (Date.now() - startTime) / 1000;
        const speed = formatSpeed(downloadedSize / elapsedTime);
        const eta = formatETA(
          (totalSize - downloadedSize) / (downloadedSize / elapsedTime)
        );

        onProgress({ progress, speed, eta });
      }
    }

    // Close writer
    writer.end();

    // Wait for write to complete
    await new Promise<void>((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`✅ Download completed: ${filePath}`);
        resolve();
      });
      
      writer.on("error", (error) => {
        console.error(`❌ Write error: ${error.message}`);
        reject(error);
      });
    });

    // Add file to downloaded files store
    addDownloadedFile(filePath);
    console.log(`📝 Added to download store: ${filePath}`);

    return {
      success: true,
      filePath
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Download failed: ${errorMessage}`);
    
    // Clean up partial file on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned up partial file: ${filePath}`);
      } catch (cleanupError) {
        console.error(`⚠️ Failed to cleanup partial file: ${cleanupError}`);
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Downloads multiple files in parallel
 * @param downloads - Array of download objects
 * @param downloadPath - Destination directory
 * @param onProgress - Callback to track overall progress
 * @returns Promise<DownloadResult[]>
 */
export async function downloadMultipleFiles(
  downloads: Array<{ url: string }>,
  downloadPath: string,
  onProgress?: (overallProgress: number) => void
): Promise<DownloadResult[]> {
  const results: DownloadResult[] = [];
  let completedDownloads = 0;

  const downloadPromises = downloads.map(async (download, index) => {
    const result = await downloadFile(
      download.url,
      downloadPath,
      (progress) => {
        // Individual file progress
        console.log(`📁 File ${index + 1}/${downloads.length}: ${progress.progress}%`);
      }
    );

    completedDownloads++;
    
    // Overall progress
    if (onProgress) {
      const overallProgress = Math.round((completedDownloads / downloads.length) * 100);
      onProgress(overallProgress);
    }

    return result;
  });

  return Promise.all(downloadPromises);
}

/**
 * Formats speed in MB/s or KB/s
 */
function formatSpeed(bytesPerSecond: number): string {
  const mbps = bytesPerSecond / (MEGA_BYTES);
  if (mbps >= 1) {
    return `${mbps.toFixed(1)} MB/s`;
  }
  const kbps = bytesPerSecond / 1024;
  return `${kbps.toFixed(1)} KB/s`;
}

/**
 * Formats estimated time remaining
 */
function formatETA(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "--";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Checks if a URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}