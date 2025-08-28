import { ipcMain, BrowserWindow } from "electron";
import {
    downloadStoreService,
} from "main/services/download-store.service";

export function registerDownloadStore() {
    ipcMain.handle("get-downloaded-files", () => {
        return downloadStoreService.getDownloadedFiles();
    });
    
    ipcMain.handle("add-downloaded-file", (event, filePath: string) => {
        downloadStoreService.addDownloadedFile(filePath);
    });
    
    ipcMain.handle("cleanup-downloaded-files", (event, directoryPath: string) => {
        // Set the window reference for sending IPC events
        const senderWindow = BrowserWindow.fromWebContents(event.sender);
        if (senderWindow) {
            downloadStoreService.setWindow(senderWindow);
        }
        
        return downloadStoreService.cleanupDownloadedFiles(directoryPath);
    });
}