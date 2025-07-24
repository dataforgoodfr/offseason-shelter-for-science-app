import { ipcMain } from "electron";
import { downloadService } from "lib/electron-app/services/download.service";

export function registerDownloadDataset() {
  ipcMain.handle("download-dataset", async (event, datasetId: string) => {
    try {
      const filePath = await downloadService.downloadDataset(
        datasetId,
        (progress) => {
          event.sender.send("download-progress", 
            progress.progress,
            progress.speed,
            progress.eta,
          );
        }
      );

      return { success: true, filePath };
    } catch (error: any) {
      console.error("Download failed:", error);
      return { success: false, error: error?.message || error };
    }
  });
}

