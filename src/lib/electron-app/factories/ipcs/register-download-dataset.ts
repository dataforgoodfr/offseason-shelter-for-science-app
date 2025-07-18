import { ipcMain } from "electron";
import { downloadDataset } from "lib/electron-app/services/download.service";

export function registerDownloadDataset() {
  ipcMain.handle("download-dataset", async (event, datasetId: string) => {
    try {
      const filePath = await downloadDataset(
        datasetId,
        (progress, speed, eta) => {
          // Envoie la progression au renderer
          event.sender.send("download-progress", progress, speed, eta);
        }
      );

      return { success: true, filePath };
    } catch (error: any) {
      console.error("Download failed:", error);
      return { success: false, error: error?.message || error };
    }
  });
}
