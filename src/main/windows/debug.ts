import { screen } from 'electron'
import { join } from 'node:path'

import { createWindow } from 'lib/electron-app/factories/windows/create'
import { displayName } from '~/package.json'

export async function DebugWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const window = createWindow({
    id: 'debug',
    title: `${displayName} - Debug`,
    width: 600,
    height: 400,
    show: false,
    center: false,
    x: Math.floor((screenWidth - 600) / 2),
    y: Math.floor((screenHeight - 400) / 2) + 100,
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
    // Allow closing the debug window (optional: hide instead)
    event.preventDefault()
    window.hide()
  })

  return window
}
