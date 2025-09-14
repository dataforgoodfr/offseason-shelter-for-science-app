import { ipcMain } from "electron";
import { downloadFile, DownloadProgress } from "main/services/download-dummy.service";

export function registerDownloadDummy() {
    ipcMain.handle("download-file", (event, url: string, downloadPath: string, fileName: string, defaultFileNamePrefix: string) => {
        return downloadFile(
            url,
            downloadPath,
            fileName,
            defaultFileNamePrefix,
            (progress: DownloadProgress) => event.sender.send('download-progress', progress.progress, progress.speed, progress.eta)
        );
    });
}
