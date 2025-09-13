import { config } from 'config';
import { ipcMain } from 'electron'

export function climateDataHandlers() {

    ipcMain.handle('check-file-exists', async (event, filePath: string) => {
        console.log('Checking if file exists:', filePath)
        try {
            const fs = require('fs').promises;
            await fs.access(filePath);

            console.log(' File exists:', filePath);
            return true;
        } catch (error) {
            return false;
        }
    })

    ipcMain.handle('rescue-api:call', async (event, route: string, options: any) => {
        try {       
            const response = await fetch(`${config.api.baseURL}${route}`, {
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body || undefined,
            })

            if (!response.ok) {
                const body = await response.text();
                let errorDetails = undefined;

                const bodyJson = JSON.parse(body);
                if (bodyJson && bodyJson.detail) {
                    errorDetails = bodyJson.detail;
                    console.error('❌ Rescue API error details:', errorDetails)
                }

                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                }
            }

            const data = await response.json()

            return {
                success: true,
                data: data
            }
        } catch (error: any) {
            console.error('❌ Rescue API error:', error)
            return {
                success: false,
                error: error?.message || 'Network error'
            }
        }
    })
}