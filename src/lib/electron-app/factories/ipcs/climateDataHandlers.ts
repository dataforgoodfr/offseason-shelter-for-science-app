import { ipcMain } from 'electron'
import { ErrorHandlingOptions, rescueApiService } from '../../../../main/services/rescue-api-service'

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

    ipcMain.handle('rescue-api:call', (event, route: string, options: any, errorHandlingOptions?: ErrorHandlingOptions) => {
        return rescueApiService.call(route, options, errorHandlingOptions)
    })
}