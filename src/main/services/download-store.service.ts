import Store from "electron-store";
import * as fs from "fs";
import { BrowserWindow } from "electron";
import { loggerService } from "./logger";
import { userConfig } from "lib/electron-app/utils/user-config";

const store = new Store();

// === INTERFACES ===
interface DownloadedFile {
  filePath: string;
  downloadedAt: number;
  modifiedAt: number;
  size: number;
  // seedingInfo: SeedingInfo | null;
}

interface DownloadedFilesStore {
  [filePath: string]: DownloadedFile;
}

interface SeedingInfo {
  magnetURI: string;
  name: string;
  torrentKey: string;
  filepath: string;
  lastSeeded: number;
}

class DownloadStoreService {
  private window: BrowserWindow | null = null;

  setWindow(window: BrowserWindow) {
    this.window = window;
  }

  private sendCleanupFilesSuccess() {
    if (this.window) {
      this.window.webContents.send('cleanup:files-success');
    }
  }

  private sendCleanupError(error: string) {
    if (this.window) {
      this.window.webContents.send('cleanup:error', { error });
    }
  }

  // === DOWNLOADED FILES ===
  getDownloadedFiles(): DownloadedFilesStore {
    const result = store.get("downloadedFiles", {}) as DownloadedFilesStore;
    return result;
  }

  private computeTotalDownloadedFileSize(downloadedFiles: DownloadedFilesStore): number {
    let totalSize = 0;
    Object.values(downloadedFiles).forEach((file) => {
      if (fs.existsSync(file.filePath)) {
        const fileStats = fs.statSync(file.filePath);
        totalSize += fileStats.size;
      }
    });
    return totalSize;
  }

  /** Get the total size of all downloaded files */
  getTotalDownloadedFileSize(): number {
    const downloadedFiles = this.getDownloadedFiles();
    
    return this.computeTotalDownloadedFileSize(downloadedFiles);
  }

  getRemainingFreeSpace(): number {
    return this.computeRemainingFreeSpace();
  }

  private setRemainingFreeSpace(freeSpace: number): void {
    store.set("remainingFreeSpace", freeSpace);
  }

  private computeRemainingFreeSpace(): number {
    const storageAllocation = userConfig.getStorageAllocation();
    const freeSpace = storageAllocation - this.computeTotalDownloadedFileSize(this.getDownloadedFiles());
    return freeSpace;
  }

  checkRemainingFreeSpace(): boolean {
    const freeSpace = this.computeRemainingFreeSpace();
    const result = freeSpace > 0

    if (freeSpace != this.getRemainingFreeSpace()) {
      this.setRemainingFreeSpace(freeSpace);
    }

    // Send free space exhausted event to main window
    if (!result) {
      loggerService.error('Free space exhausted');
       if (this.window) {
         this.window.webContents.send('free-space:exhausted');
       }
    }
    return result;
  }
  
  // Add a downloaded file path in DB
  addDownloadedFile(filePath: string, updateFreeSpace: boolean = true): void {
    const downloadedFiles = this.getDownloadedFiles();
    
    downloadedFiles[filePath] = {
      filePath,
      downloadedAt: Date.now(),
      modifiedAt: fs.statSync(filePath).mtime.getTime(),
      size: fs.statSync(filePath).size,
      // seedingInfo: null,
    };

    store.set("downloadedFiles", downloadedFiles);

    console.log(`Added downloaded file to DB: ${filePath}`);

    if (updateFreeSpace === true) {
      this.updateRemainingFreeSpace();
    }
  }

  private updateRemainingFreeSpace() {
    // Retrieve storage allocation from config
    const storageAllocation = userConfig.getStorageAllocation();

    // Check if the total size of the downloaded files is greater than the storage allocation
    const freeSpace = storageAllocation - this.computeTotalDownloadedFileSize(this.getDownloadedFiles());

    if (freeSpace <= 0) {
      this.setRemainingFreeSpace(0);

      // Send free space exhausted event to main window
      if (this.window) {
        this.window.webContents.send('free-space:exhausted');
      }
    } else {
      this.setRemainingFreeSpace(freeSpace);
    }
  }
  
  // Delete all downloaded files in a directory
  async cleanupDownloadedFiles(directoryPath: string): Promise<{
    deletedFiles: string[];
    errors: string[];
  }> {
    const downloadedFiles = this.getDownloadedFiles();
    const deletedFiles: string[] = [];
    const errors: string[] = [];
    
    loggerService.info(`Starting cleanup of downloaded files...`);

    // Start time measurement
    const startTime = Date.now();
    
    // For all downloaded files
    Object.values(downloadedFiles).forEach((fileInfo) => {
      // Check if the file is in the target directory
      if (fileInfo.filePath.startsWith(directoryPath)) {
        try {
          // Check if the file still exists
          if (fs.existsSync(fileInfo.filePath)) {
            // Delete the file
            fs.unlinkSync(fileInfo.filePath);
            deletedFiles.push(fileInfo.filePath);
            console.log(`Deleted: ${fileInfo.filePath}`);
          } else {
            console.log(`File not found: ${fileInfo.filePath}`);
          }
          
          // Delete the file from the database
          delete downloadedFiles[fileInfo.filePath];
  
        } catch (error) {
          const errorMsg = `Failed to delete ${fileInfo.filePath}: ${error}`;
          errors.push(errorMsg);
          loggerService.error(`Failed to delete ${fileInfo.filePath}: ${error}`);
        }
      }
    });

    // End time measurement
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // If the cleanup took less than 2 seconds, wait 2 seconds for UX
    if (duration < 2) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Update the store
    store.set("downloadedFiles", downloadedFiles);
    
    loggerService.info(`Cleanup completed. Deleted: ${deletedFiles.length}, Errors: ${errors.length}`);
    
    // Send IPC events based on cleanup result
    if (errors.length > 0) {
      this.sendCleanupError(`Cleanup completed with ${errors.length} errors`);
    } else {
      this.sendCleanupFilesSuccess();
    }
    
    return { deletedFiles, errors };
  }

  async clear() {
    store.set("downloadedFiles", {});
  }
}

/** SEEDING */

export function saveSeedingInfo(filePath: string, info: SeedingInfo) {
  const seedingData = getSeedingData();
  seedingData[filePath] = info;
  store.set("seedingData", seedingData);
}

export function getSeedingData(): Record<string, SeedingInfo> {
  return store.get("seedingData", {}) as Record<string, SeedingInfo>;
}

export function clearSeedingData() {
  store.set("seedingData", {});
}

export function removeSeedingInfo(filePath: string) {
  const seedingData = getSeedingData();
  delete seedingData[filePath];
  store.set("seedingData", seedingData);
}

// === SINGLETON INSTANCE ===
export const downloadStoreService = new DownloadStoreService();