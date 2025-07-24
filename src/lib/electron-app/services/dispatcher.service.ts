import httpService from "./http.service";

// src/main/services/DispatcherService.ts
interface DownloadCompletePayload {
    dataset_id: string;
    magnet: string;
}

class DispatcherService {

    constructor() {
    }

    /**
     * Notifie le dispatcher qu'un téléchargement est terminé
     */
    async notifyDownloadComplete(datasetId: string, magnetLink: string): Promise<boolean> {
        try {
            console.log(`[DispatcherService] Notifying download complete for dataset: ${datasetId}`);

            const payload: DownloadCompletePayload = {
                dataset_id: datasetId,
                magnet: magnetLink
            };

            console.log(`[DispatcherService] Payload:`, payload);

            const response = await httpService.post('/api/v1/download-complete', payload);

            if (response.status === 200) {
                console.log(`[DispatcherService] Successfully notified dispatcher for dataset: ${datasetId}`);
                return true;
            }

            return false;

        } catch (error) {
            console.error('[DispatcherService] Failed to notify download complete:', error);
            return false;
        }
    }
}

// Export singleton
export const dispatcherService = new DispatcherService();
export { DispatcherService };
