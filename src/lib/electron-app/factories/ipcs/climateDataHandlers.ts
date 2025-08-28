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
}