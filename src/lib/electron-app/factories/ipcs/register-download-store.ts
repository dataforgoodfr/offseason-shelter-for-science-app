import { ipcMain, BrowserWindow } from "electron";
import {
    downloadStoreService,
} from "main/services/download-store.service";

export function registerDownloadStore() {
    ipcMain.handle("get-downloaded-files", (event) => {
        const senderWindow = BrowserWindow.fromWebContents(event.sender);
        if (senderWindow) {
            downloadStoreService.setWindow(senderWindow);
        }

        return downloadStoreService.getDownloadedFiles();
    });
    
    ipcMain.handle("add-downloaded-file", (event, filePath: string, updateFreeSpace: boolean) => {
        downloadStoreService.addDownloadedFile(filePath, updateFreeSpace);
    });
    
    ipcMain.handle("cleanup-downloaded-files", (event, directoryPath: string) => {
        // Set the window reference for sending IPC events
        const senderWindow = BrowserWindow.fromWebContents(event.sender);
        if (senderWindow) {
            downloadStoreService.setWindow(senderWindow);
        }
        
        return downloadStoreService.cleanupDownloadedFiles(directoryPath);
    });

    ipcMain.handle("download-store:clear", () => {
        downloadStoreService.clear();
    });

    ipcMain.handle("free-space:get-remaining", () => {
        return downloadStoreService.getRemainingFreeSpace();
    });

    ipcMain.handle("free-space:check-remaining", () => {
        return downloadStoreService.checkRemainingFreeSpace();
    });
}