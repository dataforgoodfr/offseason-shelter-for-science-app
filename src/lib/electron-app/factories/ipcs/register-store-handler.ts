import { ipcMain } from "electron";
import {
  getDownloadPath,
  getIsFirstLaunch,
  saveDownloadPath,
  setIsFirstLaunch,
} from "main/services/store.service";

export function registerStoreHandler() {
  ipcMain.handle("store:setDownloadPath", async (_event, path) => {
    saveDownloadPath(path);
    return true;
  });
  ipcMain.handle("store:getDownloadPath", async () => {
    return getDownloadPath();
  });
    // First launch
  ipcMain.handle("store:getIsFirstLaunch", () => {
    return getIsFirstLaunch();
  });

  ipcMain.handle("store:setIsFirstLaunch", (_, value: boolean) => {
    setIsFirstLaunch(value);
  });
}
