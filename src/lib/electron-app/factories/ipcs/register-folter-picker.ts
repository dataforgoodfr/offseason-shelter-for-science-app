import {
  ipcMain,
  dialog,
  BrowserWindow,
  type OpenDialogReturnValue,
} from "electron";

export function registerFolderPicker() {
  ipcMain.handle("open-folder-dialog", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    // win peut être null !
    let result: OpenDialogReturnValue;
    if (win) {
      result = await dialog.showOpenDialog(win, {
        properties: ["openDirectory"],
      });
    } else {
      result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
      });
    }
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
}
