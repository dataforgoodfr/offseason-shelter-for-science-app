import { ipcMain } from "electron";
import { downloadFile } from "main/services/download-dummy.service";

export function registerDownloadDummy() {
    ipcMain.handle("download-file", (event, url: string, downloadPath: string, fileName: string) => {
        return downloadFile(url, downloadPath, fileName);
    });
}
