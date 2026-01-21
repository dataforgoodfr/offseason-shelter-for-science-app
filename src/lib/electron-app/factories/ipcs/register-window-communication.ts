import { ipcMain } from 'electron';

export function registerWindowCommunication(windowMap: Map<string, Electron.BrowserWindow>) {
    ipcMain.handle("window:send", async (event, windowId: string, message: any) => {
        try {
            const targetWindow = windowMap.get(windowId);
            if (!targetWindow) {
                console.error(`No window found with ID ${windowId}`);
                return;
            }
            targetWindow.webContents.send(message);
        } catch (error) {
            console.error('Failed to send message to window:', error);
        }
  });
}