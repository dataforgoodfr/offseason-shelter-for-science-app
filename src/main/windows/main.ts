import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'

import { createWindow } from 'lib/electron-app/factories/windows/create'
import { ENVIRONMENT, WINDOW_DIMENSIONS } from 'shared/constants'
import { displayName } from '~/package.json'

export async function MainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const window = createWindow({
    id: 'main',
    title: displayName,
    width: WINDOW_DIMENSIONS.MAIN.WIDTH,
    height: WINDOW_DIMENSIONS.MAIN.HEIGHT.COLLAPSED,
    frame: false, // Supprime la barre de titre native
    transparent: true,
    show: false,
    center: false,
    x: Math.floor((screenWidth - WINDOW_DIMENSIONS.MAIN.WIDTH) / 2) - 100,
    y: Math.floor((screenHeight - WINDOW_DIMENSIONS.MAIN.HEIGHT.COLLAPSED) / 2),
    movable: true,
    resizable: false,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      scrollBounce: false,
    },
  })

  window.webContents.on('did-finish-load', () => {
    if (ENVIRONMENT.IS_DEV) {
      window.webContents.openDevTools({ mode: 'detach' })
    }

    window.show();
  });

  window.on('close', () => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.destroy()
    }
  })

  return window
}
