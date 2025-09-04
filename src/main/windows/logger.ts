// import { BrowserWindow } from 'electron'
import { screen } from 'electron'
import { join } from 'node:path'

import { createWindow } from 'lib/electron-app/factories/windows/create'
import { displayName } from '~/package.json'
import { WINDOW_DIMENSIONS } from 'shared/constants'

export async function LoggerWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const window = createWindow({
    id: 'logger',
    title: `${displayName} - Logs`,
    width: 800,
    height: 600,
    show: false,
    center: false,
    x: Math.floor((screenWidth - WINDOW_DIMENSIONS.MAIN.WIDTH) / 2) + WINDOW_DIMENSIONS.MAIN.WIDTH + 20,
    y: Math.floor((screenHeight - 600) / 2),
    movable: true,
    resizable: true,
    alwaysOnTop: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      scrollBounce: false,
    },
  })

  window.webContents.on('did-finish-load', () => {
    window.show()
  })

  window.on('close', (event) => {
    // Prevent the logger window from being closed
    event.preventDefault()
    window.hide()
  })

  return window
}
