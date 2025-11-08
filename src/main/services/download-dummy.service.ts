import * as fs from "fs";
import * as path from "path";
import { downloadStoreService } from "./download-store.service";
import { BandwidthLimiterService } from "./bandwidth-limiter.service";
import { KILO_BYTES, MEGA_BYTES, GIGA_BYTES } from "../../lib/electron-app/utils/units"
import { FILE_REJECTION_CODES } from "shared/constants";
import { Asset } from 'shared/api'
import { rescueApiService } from "./rescue-api-service";
import { loggerService } from "./logger";

export interface DownloadProgress {
  progress: number;
  speed: string;
  eta: string;
}

interface DownloadResult {
  success: boolean;
  statusCode?: number;
  filePath?: string;
  fileSize?: number;
  error?: string;
}

const MAX_SEEDING_SIZE = GIGA_BYTES;
const MVP_BETA_LIMIT_SIZE = 400 * MEGA_BYTES;

class DownloadService {
  private bandwidthLimiterService: BandwidthLimiterService;

  constructor() {
    this.bandwidthLimiterService = new BandwidthLimiterService();
  }
  
  /**
   * Downloads a file from a URL and saves it to the specified directory
   * @param url - The URL of the file to download
   * @param downloadPath - The destination directory
   * @param fileName - File name (optional, will be extracted from URL if not provided)
   * @param onProgress - Callback to track progress
   * @returns Promise<DownloadResult>
   */
  async downloadFile(
    url: string,
    downloadPath: string,
    fileName?: string,
    defaultFileNamePrefix?: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    let filePath: string | undefined;
    let statusCode: number | undefined;

    try {
      if (!downloadPath) {
        throw new Error("Download path is required");
      }

      // Checking URL
      if (!isValidUrl(url)) {
        throw new Error("Invalid URL");
      }
    
      console.log(`Starting download from: ${url}`);

      // Perform HTTP request
      const response = await fetch(url);
      statusCode = response.status;
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // File name is not provided
      if (!fileName) {
        let guessedFileName = null;

        // Guessing it from Content-Disposition header
        const contentDisposition = response.headers.get("content-disposition");
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;\r\n]+)/);
          if (fileNameMatch) {
            guessedFileName = fileNameMatch[1];
            console.log(`Guessed filename from Content-Disposition: ${guessedFileName}`);
          }
        }

        if (!guessedFileName) {
          // Retrieving filename from URL, removing query parameters if any
          guessedFileName = url.split("/").pop()?.split("?")[0];
          console.log(`Guessed filename from URL: ${guessedFileName}`);
        }

        if (guessedFileName) {
          // Checking if file already exists
          const guessedFilePath = path.join(downloadPath, guessedFileName);
          if (!fs.existsSync(guessedFilePath)) {
            fileName = guessedFileName;
          }
        }

        if (!fileName) {
          fileName = `${Date.now()}`; // Default filename
        }
        
        // Always Prepend default prefix if provided
        if (defaultFileNamePrefix) {
            fileName = `${defaultFileNamePrefix}_${fileName}`;
        }
      }

      // Build complete file path
      filePath = path.join(downloadPath, fileName);

      console.log(`Saving to: ${filePath}`);

      // Get total file size
      const totalSize = Number.parseInt(
        response.headers.get("content-length") || "0",
        10
      );

      // Abort download if Content-Length exceeds MVP beta limit size
      if (totalSize > MVP_BETA_LIMIT_SIZE) {
        loggerService.error(`File too big for seeding (Content-Length: ${totalSize} bytes)`);
        return {
          success: false,
          fileSize: totalSize,
          filePath: filePath,
          error: "file too big (content-length)",
        }
      }

      // Create read stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response body reader");
      }

      // Create write stream
      const writer = fs.createWriteStream(filePath);
      
      let downloadedSize = 0;
      const startTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Throttle
        if (value) {
          // broija 2025/09/15 : @todo could be enhanced by passing a callback and letting the service handle the throttling asynchronously
          await this.bandwidthLimiterService.controlBandwidth(value.length);
        }

        // Write chunk
        writer.write(value);
        downloadedSize += value.length;

        // Abort download if it exceeds MVP beta limit size
        if (downloadedSize > MVP_BETA_LIMIT_SIZE) {
          loggerService.error(`File too big for seeding (Downloaded size so far : ${downloadedSize} bytes)`);
          writer.end();

          return {
            success: false,
            fileSize: downloadedSize,
            filePath: filePath,
            error: "file too big (downloaded size)",
          };
        }

        // Calculate and report progress
        if (onProgress) {
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

      let result: DownloadResult = {
        success: true,
        filePath: filePath,
        statusCode: statusCode
      };

      // We do not trust totalSize, fetching the file size from the file
      const fileSize = fs.statSync(filePath).size;
      if (fileSize) {
        result.fileSize = fileSize;
      } else if (totalSize) {
        result.fileSize = totalSize;
      }
      result.fileSize = fileSize ? fileSize : totalSize;

      return result;
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
        error: errorMessage,
        statusCode: statusCode
      };
    }
  }

  async downloadAsset(
    asset: Asset,
    downloadPath: string,
    fileName?: string,
    defaultFileNamePrefix?: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    const downloadResult = await this.downloadFile(
      asset.url,
      downloadPath,
      fileName,
      defaultFileNamePrefix,
      onProgress
    );

    if (downloadResult) {
      if (downloadResult.fileSize && downloadResult.fileSize > MVP_BETA_LIMIT_SIZE) {
        // File is too big for seeding, call the API
        rescueApiService.rejectAsset(
          asset.res_id,
          FILE_REJECTION_CODES.FILE_NOT_SUITABLE_FOR_BETA, // File too big for MVP beta
          downloadResult.fileSize
        );

        if (downloadResult.filePath && fs.existsSync(downloadResult.filePath)) {
          fs.unlinkSync(downloadResult.filePath);
        }
      } else if (downloadResult.success == true && downloadResult.filePath) {
        // Add file to downloaded files store
        downloadStoreService.addDownloadedFile(downloadResult.filePath);
      } else if (downloadResult.statusCode === 404) {
          loggerService.error(`Asset not found (404): Reporting to Rescue API.`);
          // Link is broken, report to Rescue API
          rescueApiService.rejectAsset(
            asset.res_id,
            FILE_REJECTION_CODES.HTTP_404, // Not found
          );
      } else if (downloadResult.statusCode === 403) {
          loggerService.error(`Access denied (403): Reporting to Rescue API.`);
          // Access denied, report to Rescue API
          rescueApiService.rejectAsset(
            asset.res_id,
            FILE_REJECTION_CODES.HTTP_403, // Forbidden
          );
      } else if (downloadResult.error === "fetch failed") {
          loggerService.error(`Network error during download: Reporting to Rescue API.`);
          // Network error, report to Rescue API
          rescueApiService.rejectAsset(
            asset.res_id,
            FILE_REJECTION_CODES.FETCH_FAILED, // Network error
          );
      }
    }

    return downloadResult;
  }
}

export let downloadService = new DownloadService();

/**
 * Downloads multiple files in parallel
 * @param downloads - Array of download objects
 * @param downloadPath - Destination directory
 * @param onProgress - Callback to track overall progress
 * @returns Promise<DownloadResult[]>
 * /
export async function downloadMultipleFiles(
  downloads: Array<{ url: string }>,
  downloadPath: string,
  onProgress?: (overallProgress: number) => void
): Promise<DownloadResult[]> {
  const results: DownloadResult[] = [];
  let completedDownloads = 0;

  const downloadPromises = downloads.map(async (download, index) => {
    const result = await downloadService.downloadFile(
      download.url,
      downloadPath,
      undefined,
      undefined,
      (progress: DownloadProgress) => {
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
*/

/**
 * Formats speed in MB/s or KB/s
 */
function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond > MEGA_BYTES) {
    return `${(bytesPerSecond / MEGA_BYTES).toFixed(1)} MB/s`;
  }
  return `${(bytesPerSecond / KILO_BYTES).toFixed(1)} KB/s`;
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