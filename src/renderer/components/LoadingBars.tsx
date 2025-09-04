import { useState, useEffect } from 'react';
import NoConnexion from './NoConnexion';
import { Asset, DispatchRequestPayload, DownloadProgressCallback } from 'renderer/lib/types';
import climateDataService from 'renderer/services/climateData.service';

interface LoadingBarsProps {
  downloadPath: string | null;
  freeSpaceGb?: number;
}

/** @deprecated 2025/08/27 : this component is not used anymore, it's replaced by the useDownloadManager hook and LoadingBarsDisplay component */
export default function LoadingBars({
  downloadPath,
  freeSpaceGb = 100,
}: LoadingBarsProps) {
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<'downloading now' | 'uploading'>('downloading now');
  const [completedAssets, setCompletedAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const totalBars = 10;

  useEffect(() => {
    if (!downloadPath) return;

    let isCancelled = false;
    let isProcessRunning = false;

    const startDownloadProcess = async () => {
      if (isCancelled || isProcessRunning) {
        return;
      }
      isProcessRunning = true;

      try {
        if (isCancelled) return;
        setError(null);
        setProgress(0);
        setCurrentStatus('downloading now');
        setError("error")
        const payload: DispatchRequestPayload = {
          name: "Climate Rescue Node",
          description: "Automated data rescue system",
          free_space_gb: freeSpaceGb,
          node_id: "1", // "node_" + Date.now()
        };

        const callbacks: DownloadProgressCallback = {
          onProgress: (currentProgress: number, currentIndex: number, total: number) => {
            if (isCancelled) return;

            // Calcul de la progression pour les barres
            if (total > 0) {
              const progressPercent = currentProgress / total;
              const newProgress = Math.floor(progressPercent * totalBars);
              setProgress(Math.min(newProgress, totalBars));
            }
          },

          onStatusChange: (status) => {
            if (isCancelled) return;

            setCurrentStatus(status);
          },

          onFileComplete: (asset: Asset, magnetLink?: string) => {
            if (isCancelled) return;

            console.info(`File completed: ${asset.name}${magnetLink ? ' with magnet' : ''}`);
            setCompletedAssets(prev => [...prev, asset]);
          },

          onComplete: (assets: Asset[]) => {
            if (isCancelled) return;

            setProgress(totalBars);
            setCurrentStatus('uploading');
            setCompletedAssets(assets);

            // Log des résultats
            const successCount = assets.filter(a => a.status === 'SUCCESS').length;
            const abortedCount = assets.filter(a => a.status === 'ABORTED').length;
            console.info(`Success: ${successCount}, Aborted: ${abortedCount}`);
          },

          onError: (errorMessage: string, asset?: Asset) => {
            if (isCancelled) return;

            console.error(`Download error: ${errorMessage}`, asset);
            setError(errorMessage);
          }
        };

        if (isCancelled) return;
        await climateDataService.fetchAndDownload(payload, downloadPath, callbacks);

      } catch (error: any) {
        if (!isCancelled) {
          console.error(' Erreur lors du processus de téléchargement:', error);
          setError(error?.message || 'Erreur inconnue');
        }
      } finally {
        isProcessRunning = false;
      }
    };

    startDownloadProcess();

    return () => {
      console.info(`Cleanup useEffect - Annulation processus`);
      isCancelled = true;
    };

  }, [downloadPath]);

  const handleSubmitError = () => {
    console.info("Error submitted");
  };

  return (
    <>
      {/* le temps de trouve le probleme de ***dupplicate torent added*** */}
      {/* {error ? ( */}
      {false ? (

        <NoConnexion onSubmitError={handleSubmitError} />
      ) : (
        <div className="w-full h-[96px] flex flex-col items-center gap-6 py-4 mb-[39px]">
          <div className="w-[166px] h-8 flex justify-center items-center">
            <span
              className="uppercase text-white font-normal text-[46px] leading-none tracking-[-0.1em]"
              style={{
                fontFamily: "LT Railway",
                fontStyle: "normal",
              }}
            >
              Running
            </span>
          </div>

          <div className="w-full h-2 flex items-center justify-center gap-2">
            <span
              className="h-2 uppercase text-white font-normal text-[11px] tracking-[0.1em] leading-none flex items-center justify-center whitespace-nowrap"
              style={{
                fontFamily: "Akzidenz-Grotesk Pro",
              }}
            >
              {currentStatus}
            </span>

            <div className="flex w-[55px] h-[7px] gap-[2px] items-center justify-between">
              {Array.from({ length: totalBars }).map((_, index) => (
                <div
                  key={index}
                  className="h-[7px] transition-colors duration-200 border"
                  style={{
                    borderColor: index < progress ? "#FFFFFF" : "#FFFFFF66",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

