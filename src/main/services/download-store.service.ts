import Store from "electron-store";
import * as fs from "fs";
import { loggerService } from "./logger";

const store = new Store();

// === DOWNLOADED FILES ===
interface DownloadedFile {
    filePath: string;
    downloadedAt: number;
  }
  
  interface DownloadedFilesStore {
    [filePath: string]: DownloadedFile;
  }
  
  // Retrieve all downloaded files from DB
  export function getDownloadedFiles(): DownloadedFilesStore {
    return store.get("downloadedFiles", {}) as DownloadedFilesStore;
  }
  
  // Add a downloaded file path in DB
  export function addDownloadedFile(
    filePath: string
  ): void {
    const downloadedFiles = getDownloadedFiles();
    
    downloadedFiles[filePath] = {
      filePath,
      downloadedAt: Date.now(),
    };
    
    store.set("downloadedFiles", downloadedFiles);
    console.log(`📁 Added downloaded file to DB: ${filePath}`);
  }
  
  // Delete all downloaded files in a directory
  export function cleanupDownloadedFiles(directoryPath: string): {
    deletedFiles: string[];
    errors: string[];
  } {
    const downloadedFiles = getDownloadedFiles();
    const deletedFiles: string[] = [];
    const errors: string[] = [];
    
    loggerService.info(`Starting cleanup of downloaded files...`);
    
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
            loggerService.info(`Deleted: ${fileInfo.filePath}`);
          } else {
            loggerService.warn(`File not found: ${fileInfo.filePath}`);
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
    
    // Update the store
    store.set("downloadedFiles", downloadedFiles);
    
    loggerService.info(`Cleanup completed. Deleted: ${deletedFiles.length}, Errors: ${errors.length}`);
    
    return { deletedFiles, errors };
  }