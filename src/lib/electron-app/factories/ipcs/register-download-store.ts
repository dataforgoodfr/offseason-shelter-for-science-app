import { ipcMain } from "electron";
import {
    getDownloadedFiles,
    addDownloadedFile,
    cleanupDownloadedFiles,
} from "main/services/download-store.service";

export function registerDownloadStore() {
    ipcMain.handle("get-downloaded-files", () => {
        return getDownloadedFiles();
    });
    
    ipcMain.handle("add-downloaded-file", (event, filePath: string) => {
        addDownloadedFile(filePath);
    });
    
    ipcMain.handle("cleanup-downloaded-files", (event, directoryPath: string) => {
        cleanupDownloadedFiles(directoryPath);
    });
}