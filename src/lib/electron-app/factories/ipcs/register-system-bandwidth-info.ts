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

        // Commandes spécifiques par OS
        if (process.platform === 'win32') {
          command = 'wmic'
          args = ['logicaldisk', 'where', `"DeviceID='${path.parse(folderPath).root.replace('\\', '').replace(':', '')}':"`, 'get', 'FreeSpace', '/format:csv']
        } else if (process.platform === 'darwin') {
          command = 'df'
          args = ['-k', folderPath] // -k pour avoir en KB sur Mac
        } else {
          command = 'df'
          args = ['-B1', folderPath] // -B1 pour avoir en bytes sur Linux
        }

        const child = spawn(command, args, { shell: true })
        let output = ''

        child.stdout.on('data', (data: any) => {
          output += data.toString()
        })

        child.on('close', (code: any) => {
          console.log('Sortie commande espace disque:', output)
          
          try {
            if (process.platform === 'win32') {
              // Parse WMIC output
              const lines = output.split('\n').filter(line => line.trim())
              for (const line of lines) {
                const match = line.match(/(\d+)/)
                if (match && parseInt(match[1]) > 1000000) { // Éviter les headers
                  const freeBytes = parseInt(match[1])
                  console.log(`Espace libre Windows: ${Math.round(freeBytes / (1024**3))} GB`)
                  resolve(freeBytes)
                  return
                }
              }
            } else {
              // Parse df output (Linux/Mac)
              const lines = output.split('\n')
              for (const line of lines) {
                if (line.includes('/') && !line.startsWith('Filesystem')) {
                  const parts = line.trim().split(/\s+/)
                  if (parts.length >= 4) {
                    let freeBytes: number
                    
                    if (process.platform === 'darwin') {
                      // Mac : df -k retourne en KB
                      freeBytes = parseInt(parts[3]) * 1024
                    } else {
                      // Linux : df -B1 retourne en bytes
                      freeBytes = parseInt(parts[3])
                    }
                    
                    if (freeBytes > 0) {
                      console.log(`Espace libre ${process.platform}: ${Math.round(freeBytes / (1024**3))} GB`)
                      resolve(freeBytes)
                      return
                    }
                  }
                }
              }
            }
          } catch (parseError) {
            console.error('Erreur parsing:', parseError)
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
        }, 10000)
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
        hostname: 'speed.cloudflare.com',
        path: '/__down?bytes=1048576', // 1MB
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'ShelterApp-BandwidthTest/1.0'
        }
      }

      const req = https.request(options, (res: any) => {
        res.on('data', (chunk: any) => {
          downloadedBytes += chunk.length
        })
        
        res.on('end', () => {
          const duration = Math.max((Date.now() - startTime) / 1000, 0.1)
          const speedBps = downloadedBytes / duration
          const speedMbps = (speedBps * 8) / 1000000
          const speedGbps = speedMbps / 1000
          
          console.log(`Test vitesse: ${downloadedBytes} bytes en ${duration}s = ${speedMbps.toFixed(1)} Mbps`)
          
          const result = {
            download: Math.max(speedGbps, 0.001), 
            upload: Math.max(speedGbps * 0.1, 0.0005) 
          }
          
          resolve(result)
        })
      })

      req.on('error', (err: any) => {
        console.log('Erreur test réseau:', err.message)
        resolve({
          download: 0.0, 
          upload: 0.00   
        })
      })

      req.on('timeout', () => {
        console.log('Timeout test réseau')
        req.destroy()
        resolve({
          download: 0.1,
          upload: 0.01
        })
      })

      req.end()
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