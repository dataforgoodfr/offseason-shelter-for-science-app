import { ipcMain, BrowserWindow } from 'electron'
import { WINDOW_DIMENSIONS } from 'shared/constants'

export function registerWindowEvents() {

  ipcMain.handle("window:expand-height", async (event, isExpanded: boolean) => {
    try {
      const requestingWindow = BrowserWindow.fromWebContents(event.sender);
      if (!requestingWindow) return;

      // Set height based on storage selector state
      const height = isExpanded 
        ? WINDOW_DIMENSIONS.MAIN.HEIGHT.EXPANDED 
        : WINDOW_DIMENSIONS.MAIN.HEIGHT.COLLAPSED;
      requestingWindow.setContentSize(WINDOW_DIMENSIONS.MAIN.WIDTH, height, false);
    } catch (error) {
      console.error('Failed to set main window height:', error);
    }
  });

}