import { ipcMain } from 'electron'

export function climateDataHandlers() {

    ipcMain.handle('check-file-exists', async (event, filePath: string) => {
        console.log('🔍 Checking if file exists:', filePath)
        try {
            const fs = require('fs').promises;
            await fs.access(filePath);

            console.log(' File exists:', filePath);
            return true;
        } catch (error) {
            return false;
        }
    })



    ipcMain.handle('fetch-climate-data', async (event, url: string, options: any) => {
    try {
        console.log('🌐 Main process HTTP call:', url)
        
        const response = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body || undefined,
        })

        if (!response.ok) {
        return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
        }
        }

        const data = await response.json()
        
        return {
        success: true,
        data: data
        }
    } catch (error: any) {
        console.error('❌ Main process HTTP error:', error)
        return {
        success: false,
        error: error?.message || 'Network error'
        }
    }
    })

    // Handler pour télécharger un fichier depuis une URL
    ipcMain.handle('download-file-from-url', async (event, url: string, downloadPath: string, filename: string) => {
    try {
        console.log('📥 Downloading file from URL:', url)
        
        const response = await fetch(url)
        
        if (!response.ok) {
        return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
        }
        }

        const fs = require('fs')
        const path = require('path')
        
        // Créer le chemin complet
        const fullPath = path.join(downloadPath, filename)
        
        // Créer le dossier si il n'existe pas
        const dir = path.dirname(fullPath)
        if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        }

        // Écrire le fichier
        const buffer = Buffer.from(await response.arrayBuffer())
        fs.writeFileSync(fullPath, buffer)

        console.log(' File downloaded successfully:', fullPath)
        
        return {
        success: true,
        filePath: fullPath
        }
    } catch (error: any) {
        console.error('❌ File download error:', error)
        return {
        success: false,
        error: error?.message || 'Download failed'
        }
    }
    })

    console.log(' Climate data handlers registered')
}