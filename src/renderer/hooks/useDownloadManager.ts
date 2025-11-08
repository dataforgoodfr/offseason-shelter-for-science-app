import { useState, useCallback } from 'react';
import { DispatchRequestPayload, DownloadProgressCallback } from 'renderer/lib/types';
import climateDataService from 'renderer/services/climateData.service';
import { logger } from 'renderer/lib/logger';
import { Asset } from 'shared/api'
import { GIGA_BYTES } from 'lib/electron-app/utils/units';

interface DownloadState {
  progress: number;
  currentStatus: 'downloading now' | 'uploading';
  completedAssets: Asset[];
  error: string | null;
  isRunning: boolean;
}

export interface DownloadManager extends DownloadState {
  startDownload: (downloadPath: string, freeSpace: number) => Promise<void>;
  cancelDownload: () => void;
  resetDownload: () => void;
}

export function useDownloadManager() : DownloadManager {
  const [state, setState] = useState<DownloadState>({
    progress: 0,
    currentStatus: 'downloading now',
    completedAssets: [],
    error: null,
    isRunning: false,
  });

  const [concurrentDownloadCount, setConcurrentDownloadCount] = useState(0);

  const nextDownload = useCallback(async (downloadPath: string, freeSpace: number): Promise<boolean> => {
    setConcurrentDownloadCount(prev => prev + 1);
    let result = false;

    try {
      setState(prev => ({
        ...prev,
        error: null,
        progress: 0,
        currentStatus: 'downloading now',
        isRunning: true,
      }));

      const payload: DispatchRequestPayload = {
        name: "Climate Rescue Node",
        description: "Automated data rescue system",
        free_space_gb: freeSpace / GIGA_BYTES,
        node_id: "1" // broija 2025/09/12 : should be a number
      };

      const callbacks: DownloadProgressCallback = {
        onProgress: (currentProgress: number, currentIndex: number, total: number) => {
          if (total > 0) {
            const progressPercent = currentProgress / total;
            const newProgress = Math.floor(progressPercent * 100);
            setState(prev => ({
              ...prev,
              progress: Math.min(newProgress, 100)
            }));
          }
        },

        onStatusChange: (status) => {
          setState(prev => ({
            ...prev,
            currentStatus: status
          }));
        },

        onFileComplete: (asset: Asset, magnetLink?: string) => {          
          logger.info(`File rescued ${magnetLink ? ' with magnet' : ''}`, asset.name);
          setState(prev => ({
            ...prev,
            completedAssets: [...prev.completedAssets, asset]
          }));
        },

        onComplete: (assets: Asset[]) => {          
          setConcurrentDownloadCount(prev => prev - 1);
          setState(prev => ({
            ...prev,
            progress: 100,
            currentStatus: 'uploading',
            completedAssets: assets,
            isRunning: false
          }));
          
          const successCount = assets.filter(a => a.status === 'SUCCESS').length;
          const abortedCount = assets.filter(a => a.status === 'ABORTED').length;
          console.info(`Success: ${successCount}, Aborted: ${abortedCount}`);
        },

        onError: (errorMessage: string, asset?: Asset) => {          
          setConcurrentDownloadCount(prev => prev - 1);
          console.error(`❌ Download error: ${errorMessage}`, asset);
          setState(prev => ({
            ...prev,
            error: errorMessage,
            isRunning: false
          }));
        }
      };

      const remainingFreeSpace = await window.App.checkRemainingFreeSpace();
      if (!remainingFreeSpace) {
        callbacks.onError?.('Free space exhausted');
        return false;
      }

      const { completedAssets, failedAssets } = await climateDataService.fetchAndDownload(payload, downloadPath, callbacks);

      /** @todo broija 2025/09/12 : handle failed assets */

      result = completedAssets?.length !== 0;
    } catch (error: any) {
      logger.error("Error encountered during download process", { error: error.message });
      setState(prev => ({
          ...prev,
          error: error?.message || 'Erreur inconnue',
          isRunning: false
      }));
    } finally {
      return result;
    }
  }, []);

  const startDownload = useCallback(async (downloadPath: string, freeSpace: number) => {
    // While there are assets to download, keep on downloading
    while (await nextDownload(downloadPath, freeSpace)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    logger.info('End of download process !');
  }, [nextDownload]);

  const cancelDownload = useCallback(() => {
    if (concurrentDownloadCount > 0) {
      setConcurrentDownloadCount(prev => prev - 1);
      logger.warn('Download cancelled');
    }
    setState(prev => ({
      ...prev,
      isRunning: false
    }));
  }, []);

  const resetDownload = useCallback(() => {
    setConcurrentDownloadCount(0);
    setState({
      progress: 0,
      currentStatus: 'downloading now',
      completedAssets: [],
      error: null,
      isRunning: false,
    });
  }, []);

  return {
    ...state,
    startDownload,
    cancelDownload,
    resetDownload,
  };
}
