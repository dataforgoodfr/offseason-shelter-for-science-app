import { ipcMain, BrowserWindow } from 'electron'
import { WINDOW_DIMENSIONS } from 'shared/constants'

export function registerWindowEvents() {
  
  // Minimize window
  ipcMain.handle("window:minimize", async (event) => {
    try {
      const requestingWindow = BrowserWindow.fromWebContents(event.sender);
      if (!requestingWindow) return;
      requestingWindow.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  });

  // Close window
  ipcMain.handle("window:close", async (event) => {
    try {
      const requestingWindow = BrowserWindow.fromWebContents(event.sender);
      if (!requestingWindow) return;
      requestingWindow.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  });

  // Start dragging window
  ipcMain.handle("window:start-dragging", async (event) => {
    try {
      const requestingWindow = BrowserWindow.fromWebContents(event.sender);
      if (!requestingWindow) return;
      
      // Pour les fenêtres frameless, on utilise la méthode native de déplacement
      requestingWindow.setMovable(true);
      // On simule un clic sur la barre de titre pour activer le déplacement
      requestingWindow.webContents.sendInputEvent({
        type: 'mouseDown',
        x: 0,
        y: 0,
        button: 'left',
        clickCount: 1
      });
    } catch (error) {
      console.error('Failed to start dragging:', error);
    }
  });

  // Move window
  ipcMain.handle("window:move", async (event, deltaX: number, deltaY: number) => {
    try {
      const requestingWindow = BrowserWindow.fromWebContents(event.sender);
      if (!requestingWindow) return;
      
      const [currentX, currentY] = requestingWindow.getPosition();
      requestingWindow.setPosition(currentX + deltaX, currentY + deltaY);
    } catch (error) {
      console.error('Failed to move window:', error);
    }
  });

  ipcMain.handle("window:set-height", async (event, height: number) => {
  try {
    const requestingWindow = BrowserWindow.fromWebContents(event.sender);
    if (!requestingWindow) return;

    const clampedHeight = Math.max(400, Math.min(height, 900));
    requestingWindow.setContentSize(WINDOW_DIMENSIONS.MAIN.WIDTH, clampedHeight, false);
  } catch (error) {
    console.error('Failed to set window height:', error);
  }
});

}