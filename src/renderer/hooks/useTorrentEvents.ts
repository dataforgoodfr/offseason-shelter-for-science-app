import { useEffect } from 'react';

interface TorrentDownloadState {
  isDownloading: boolean;
  progress: number;
  speed: string;
  eta: string;
  error: string | null;
  torrentName: string | null;
  downloaded: string;
  peers: number;
  savedFiles: Array<{
    name: string;
    filePath: string;
    saved: boolean;
    error?: string;
    streaming?: boolean;
    progress?: number;
    bytesWritten?: number;
    totalSize?: number;
  }>;
}

type SetTorrentState = React.Dispatch<React.SetStateAction<TorrentDownloadState>>;

/**
 * Hook personnalisé pour gérer les événements de téléchargement de torrents
 * @param setDownloadState - Fonction de mise à jour de l'état du téléchargement
 */
export const useTorrentEvents = (setDownloadState: SetTorrentState) => {
  useEffect(() => {
    const eventHandlers = {
      'torrent-progress': (event: CustomEvent) => {
        const progress = event.detail;
        if (progress.torrents && progress.torrents.length > 0) {
          const torrent = progress.torrents[0];
          setDownloadState((prev) => ({
            ...prev,
            progress: Math.round(torrent.progress * 100),
            speed: `${(torrent.downloadSpeed / 1024 / 1024).toFixed(1)} MB/s`,
            downloaded: `${(torrent.downloaded / 1024 / 1024).toFixed(1)} MB`,
            peers: torrent.numPeers,
            eta: torrent.progress > 0 && torrent.downloadSpeed > 0 ? 
              `${Math.round((torrent.length - torrent.downloaded) / torrent.downloadSpeed)}s` : 
              "--",
          }));
        }
      },

      'torrent-ready': (event: CustomEvent) => {
        const { info } = event.detail;
        setDownloadState((prev) => ({
          ...prev,
          torrentName: info.name,
          isDownloading: true,
          error: null,
        }));
      },

      'torrent-done': (event: CustomEvent) => {
        setDownloadState((prev) => ({
          ...prev,
          progress: 100,
          isDownloading: false,
        }));
      },

      'torrent-error': (event: CustomEvent) => {
        const { error } = event.detail;
        setDownloadState((prev) => ({
          ...prev,
          isDownloading: false,
          error: error,
        }));
      },

      'torrent-file-streaming': (event: CustomEvent) => {
        const { fileName, filePath } = event.detail;
        setDownloadState((prev) => ({
          ...prev,
          savedFiles: [
            ...prev.savedFiles.filter(f => f.name !== fileName),
            { 
              name: fileName, 
              filePath, 
              saved: false, 
              streaming: true,
              progress: 0,
              bytesWritten: 0,
              totalSize: 0
            }
          ]
        }));
      },

      'torrent-file-progress': (event: CustomEvent) => {
        const { fileName, bytesWritten, totalSize, progress } = event.detail;
        setDownloadState((prev) => ({
          ...prev,
          savedFiles: prev.savedFiles.map(file => 
            file.name === fileName 
              ? { ...file, progress, bytesWritten, totalSize, streaming: true }
              : file
          )
        }));
      },

      'torrent-file-saved': (event: CustomEvent) => {
        const { fileName } = event.detail;
        setDownloadState((prev) => ({
          ...prev,
          savedFiles: prev.savedFiles.map(file => 
            file.name === fileName 
              ? { ...file, saved: true, streaming: false, progress: 100 }
              : file
          )
        }));
      },

      'torrent-file-save-error': (event: CustomEvent) => {
        const { fileName, error } = event.detail;
        setDownloadState((prev) => ({
          ...prev,
          savedFiles: prev.savedFiles.map(file => 
            file.name === fileName 
              ? { ...file, saved: false, streaming: false, error }
              : file
          )
        }));
      },
    };

    // Ajouter tous les listeners
    for (const [event, handler] of Object.entries(eventHandlers)) {
      window.addEventListener(event, handler as EventListener);
    }

    // Cleanup
    return () => {
      for (const [event, handler] of Object.entries(eventHandlers)) {
        window.removeEventListener(event, handler as EventListener);
      }
    };
  }, [setDownloadState]);
};

export type { TorrentDownloadState }; 