import { ipcMain } from 'electron';
import { torrentDownloadService } from '../../services/torrent-download.service';

export function registerTorrentDownload() {
    // Télécharger un torrent à partir d'un magnet link
    ipcMain.handle('torrent:download', async (event, magnetLink: string, datasetId: string) => {
        try {
            console.log(`[IPC] Starting torrent download for dataset: ${datasetId}`);

            const filePath = await torrentDownloadService.downloadFromMagnet(
                magnetLink,
                datasetId,
                (progress) => {
                    // Envoyer la progression au renderer
                    event.sender.send('torrent:download-progress', datasetId, progress);
                }
            );

            console.log(`[IPC] Torrent download completed: ${filePath}`);
            return { success: true, filePath };
        } catch (error) {
            console.error("[IPC] Torrent download failed:", error);
            return { success: false, error: (error as Error).message };
        }
    });

    // Vérifier si un téléchargement est actif
    ipcMain.handle('torrent:is-downloading', async (event, datasetId: string) => {
        return torrentDownloadService.isDownloadActive(datasetId);
    });

    // Annuler un téléchargement
    ipcMain.handle('torrent:cancel-download', async (event, datasetId: string) => {
        return torrentDownloadService.cancelDownload(datasetId);
    });

    // Obtenir la liste des téléchargements actifs
    ipcMain.handle('torrent:get-active-downloads', async () => {
        return torrentDownloadService.getActiveDownloads();
    });
} 