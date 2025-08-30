import { ipcMain, BrowserWindow } from "electron";
import { initializationService } from "../../../../main/services/initialization.service";
import { loggerService } from "../../../../main/services/logger";

export function registerInitialization() {
  // Handle initialization start request
  ipcMain.handle('init:start', async (event, selectedPath: string) => {
    try {
      // Set the window reference for sending events
      const senderWindow = BrowserWindow.fromWebContents(event.sender);
      if (senderWindow) {
        initializationService.setWindow(senderWindow);
      }
     
      const result = await initializationService.startInitialization(selectedPath);
      
      return result;
    } catch (error: any) {
      loggerService.error('Initialization start failed', { error: error.message });
      return { success: false, error: error.message };
    }
  });

  // Handle initialization retry request
  ipcMain.handle('init:retry', async (event) => {
    try {
      // Set the window reference for sending events
      const senderWindow = BrowserWindow.fromWebContents(event.sender);
      if (senderWindow) {
        initializationService.setWindow(senderWindow);
      }

      loggerService.info('Received initialization retry request');
      
      const result = await initializationService.retry();
      
      return result;
    } catch (error: any) {
      loggerService.error('Initialization retry failed',{ error: error.message });
      return { success: false, error: error.message };
    }
  });

  console.log('Initialization IPC handlers registered');
}
