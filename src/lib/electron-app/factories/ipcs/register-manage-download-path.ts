import { ipcMain } from "electron";
import {
  getDownloadPath,
  saveDownloadPath,
} from "main/services/store.service";

export function registerManageDownloadPath() {
  ipcMain.handle("set-download-path", async (_event, path) => {
    saveDownloadPath(path);
    return true;
  });
  ipcMain.handle("get-download-path", async () => {
    return getDownloadPath();
  });
}
