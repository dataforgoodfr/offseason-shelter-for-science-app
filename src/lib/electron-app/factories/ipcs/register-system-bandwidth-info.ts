import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

export function registerSystemInfo() {
  console.log('Enregistrement des handlers système...')

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
              console.log(`Espace libre Windows: ${Math.round(freeBytes / (1024**3))} GB`)
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
                    multiplier = 1024 * 1024 * 1024
                  } else if (availStr.includes('M')) {
                    multiplier = 1024 * 1024
                  } else if (availStr.includes('T')) {
                    multiplier = 1024 * 1024 * 1024 * 1024
                  }
                  
                  const sizeNum = parseFloat(availStr.replace(/[^\d.]/g, ''))
                  const freeBytes = Math.round(sizeNum * multiplier)
                  
                  if (freeBytes > 0) {
                    console.log(`Espace libre Unix: ${Math.round(freeBytes / (1024**3))} GB`)
                    resolve(freeBytes)
                    return
                  }
                }
              }
            }
          }
          
          console.log('Parsing échoué, utilisation valeur par défaut')
          resolve(50 * 1024 * 1024 * 1024)
        })

        child.on('error', (err: any) => {
          console.error('Erreur commande espace disque:', err)
          resolve(50 * 1024 * 1024 * 1024)
        })

        setTimeout(() => {
          child.kill()
          resolve(50 * 1024 * 1024 * 1024)
        }, 5000)
      })

    } catch (error) {
      console.error('Erreur get-free-space:', error)
      return 50 * 1024 * 1024 * 1024
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

  // Handlers pour les préférences
  ipcMain.handle('set-storage-allocation', async (event, percentage: number) => {
    try {
      const configPath = path.join(os.homedir(), '.shelter-config.json')
      let config: any = {}
      
      if (fs.existsSync(configPath)) {
        try {
          config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        } catch (e) {
          config = {}
        }
      }
      
      config.storageAllocation = percentage
      fs.writeFileSync(configPath, JSON.stringify(config))
      console.log(`Allocation stockage sauvegardée: ${percentage}%`)
      return true
    } catch (error) {
      console.error('Erreur sauvegarde allocation stockage:', error)
      return false
    }
  })

  ipcMain.handle('set-bandwidth-allocation', async (event, percentage: number) => {
    try {
      const configPath = path.join(os.homedir(), '.shelter-config.json')
      let config: any = {}
      
      if (fs.existsSync(configPath)) {
        try {
          config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        } catch (e) {
          config = {}
        }
      }
      
      config.bandwidthAllocation = percentage
      fs.writeFileSync(configPath, JSON.stringify(config))
      console.log(`Allocation bande passante sauvegardée: ${percentage}%`)
      return true
    } catch (error) {
      console.error('Erreur sauvegarde allocation bande passante:', error)
      return false
    }
  })

  ipcMain.handle('get-storage-allocation', async () => {
    try {
      const configPath = path.join(os.homedir(), '.shelter-config.json')
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        return config.storageAllocation || 50
      }
    } catch (error) {
      console.error('Erreur lecture allocation stockage:', error)
    }
    return 50
  })

  ipcMain.handle('get-bandwidth-allocation', async () => {
    try {
      const configPath = path.join(os.homedir(), '.shelter-config.json')
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        return config.bandwidthAllocation || 10
      }
    } catch (error) {
      console.error('Erreur lecture allocation bande passante:', error)
    }
    return 10
  })

  console.log('Handlers système enregistrés ✓')
}