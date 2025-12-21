import { join } from 'node:path'

import { createWindow } from 'lib/electron-app/factories/windows/create'
import { displayName } from '~/package.json'

export async function HiddenWindow() {
  const window = createWindow({
    id: 'hidden',
    title: `${displayName} - Hidden Mechanics`,
    width: 400,
    height: 300,
    show: false, // Hidden
    center: false,
    x: 0, // Position at top left (off-screen if necessary)
    y: 0,
    movable: false, // No need
    resizable: false,
    alwaysOnTop: false,
    autoHideMenuBar: true,
    skipTaskbar: true, // Don't appear in the taskbar
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      scrollBounce: false,
      backgroundThrottling: false, // Keep running even in the background
    },
  })

  // Don't show the window, even after loading
  window.webContents.on('did-finish-load', () => {
    // The window remains hidden
  })

  window.on('close', (event) => {
    // Prevent closing the hidden window
    event.preventDefault()
    window.hide()
  })

  return window
}