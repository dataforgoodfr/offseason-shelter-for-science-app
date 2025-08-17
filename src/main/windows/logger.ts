// import { BrowserWindow } from 'electron'
import { join } from 'node:path'

import { createWindow } from 'lib/electron-app/factories/windows/create'
import { displayName } from '~/package.json'

export async function LoggerWindow() {
  const window = createWindow({
    id: 'logger',
    title: `${displayName} - Logs`,
    width: 800,
    height: 600,
    show: false,
    center: true,
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
