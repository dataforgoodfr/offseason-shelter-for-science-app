import { ipcMain } from "electron";
import { downloadService, DownloadProgress } from "main/services/download-dummy.service";
import { Asset } from "shared/api";

export function registerDownloadDummy() {
    ipcMain.handle("download-file", (event, url: string, downloadPath: string, fileName: string, defaultFileNamePrefix: string) => {
        return downloadService.downloadFile(
            url,
            downloadPath,
            fileName,
            defaultFileNamePrefix,
            (progress: DownloadProgress) => event.sender.send('download-progress', progress.progress, progress.speed, progress.eta)
        );
    });

    ipcMain.handle('asset:download', (event, asset: Asset, downloadPath: string, fileName: string, defaultFileNamePrefix: string) => {
        return downloadService.downloadAsset(
            asset,
            downloadPath,
            fileName,
            defaultFileNamePrefix,
            (progress: DownloadProgress) => event.sender.send('download-progress', progress.progress, progress.speed, progress.eta)
        );
    })
}
