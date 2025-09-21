import { ipcMain } from 'electron'
import * as fs from 'fs'

import { GIGA_BYTES, MEGA_BYTES, TERA_BYTES } from '../../utils/units'
import { userConfig } from '../../utils/user-config'

const DEFAULT_STORAGE_ALLOCATION = 50 * GIGA_BYTES

export function registerSystemInfo() {

  // Handler pour l'espace libre
  ipcMain.handle('get-free-space', async (event, folderPath: string) => {
    console.log('Demande espace libre pour:', folderPath)

    try {
      if (!fs.existsSync(folderPath)) {
        throw new Error('Le dossier n\'existe pas')
      }

      const stats = fs.statSync(folderPath)
      if (!stats.isDirectory()) {
        throw new Error('Ce n\'est pas un dossier')
      }

      const { spawn } = require('child_process')

      return new Promise((resolve) => {
        let command: string
        let args: string[]

        if (process.platform === 'win32') {
          command = 'dir'
          args = [folderPath, '/-c']
        } else {
          command = 'df'
          args = ['-h', folderPath]
        }

        const child = spawn(command, args, { shell: true })
        let output = ''

        child.stdout.on('data', (data: any) => {
          output += data.toString()
        })

        child.on('close', (code: any) => {
          console.log('Sortie commande espace disque:', output)

          if (process.platform === 'win32') {
            const freeMatch = output.match(/(\d+)\s+bytes\s+free/i)
            if (freeMatch) {
              const freeBytes = parseInt(freeMatch[1], 10)
              console.log(`Espace libre Windows: ${Math.round(freeBytes / GIGA_BYTES)} GB`)
              resolve(freeBytes)
              return
            }
          } else {
            const lines = output.split('\n')
            for (const line of lines) {
              if (line.includes('/') && !line.startsWith('Filesystem')) {
                const parts = line.split(/\s+/)
                if (parts.length >= 4) {
                  const availStr = parts[3] || parts[2]
                  let multiplier = 1024

                  if (availStr.includes('G')) {
                    multiplier = GIGA_BYTES
                  } else if (availStr.includes('M')) {
                    multiplier = MEGA_BYTES
                  } else if (availStr.includes('T')) {
                    multiplier = TERA_BYTES
                  }

                  const sizeNum = parseFloat(availStr.replace(/[^\d.]/g, ''))
                  const freeBytes = Math.round(sizeNum * multiplier)

                  if (freeBytes > 0) {
                    console.log(`Espace libre Unix: ${Math.round(freeBytes / GIGA_BYTES)} GB`)
                    resolve(freeBytes)
                    return
                  }
                }
              }
            }
          }

          console.log('Parsing échoué, utilisation valeur par défaut')
          resolve(DEFAULT_STORAGE_ALLOCATION)
        })

        child.on('error', (err: any) => {
          console.error('Erreur commande espace disque:', err)
          resolve(DEFAULT_STORAGE_ALLOCATION)
        })

        setTimeout(() => {
          child.kill()
          resolve(DEFAULT_STORAGE_ALLOCATION)
        }, 5000)
      })

    } catch (error) {
      console.error('Erreur get-free-space:', error)
      return DEFAULT_STORAGE_ALLOCATION
    }
  })

  // Handler pour la bande passante
  ipcMain.handle('detect-bandwidth', async () => {
    console.log('Détection de la bande passante...')

    return new Promise((resolve) => {
      const https = require('https')

      const startTime = Date.now()
      let downloadedBytes = 0

      const options = {
        hostname: 'httpbin.org',
        path: '/bytes/102400',
        method: 'GET',
        timeout: 5000
      }

      const req = https.request(options, (res: any) => {
        res.on('data', (chunk: any) => {
          downloadedBytes += chunk.length
        })

        res.on('end', () => {
          const duration = Math.max((Date.now() - startTime) / 1000, 0.1)
          const speedMbps = (downloadedBytes * 8) / (duration * 1000000)
          const speedGbps = speedMbps / 1000

          console.log(`Test vitesse: ${downloadedBytes} bytes en ${duration}s = ${speedMbps.toFixed(1)} Mbps`)

          const result = {
            download: Math.max(speedGbps, 0.005),
            upload: Math.max(speedGbps * 0.3, 0.001)
          }

          resolve(result)
        })
      })

      req.on('error', (err: any) => {
        console.log('Erreur test réseau:', err.message)
        resolve({
          download: 0.05,
          upload: 0.015
        })
      })

      req.on('timeout', () => {
        console.log('Timeout test réseau')
        req.destroy()
        resolve({
          download: 0.05,
          upload: 0.015
        })
      })

      req.end()

      setTimeout(() => {
        resolve({
          download: 0.05,
          upload: 0.015
        })
      }, 6000)
    })
  })

  // Prefs handlers
  ipcMain.handle('set-storage-allocation', async (event, storageBytes: number) => {
    userConfig.setStorageAllocation(storageBytes);
  })

  ipcMain.handle('set-bandwidth-allocation', async (event, bandwidthBps: number) => {
    userConfig.setBandwidthAllocation(bandwidthBps);
  })

  ipcMain.handle('get-storage-allocation', async () => {
    return userConfig.getStorageAllocation()
  })

  ipcMain.handle('get-bandwidth-allocation', async () => {
    return userConfig.getBandwidthAllocation()
  })

}