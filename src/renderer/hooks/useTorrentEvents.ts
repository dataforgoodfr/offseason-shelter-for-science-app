import { useEffect, useRef } from 'react';
import webTorrentService from '../services/webtorrent.service';
import type { TorrentCallbacks, TorrentProgress } from '../services/webtorrent.service';

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
 * Utilise maintenant les callbacks directs du WebTorrentService au lieu des événements globaux
 * @param setDownloadState - Fonction de mise à jour de l'état du téléchargement
 */
export const useTorrentEvents = (setDownloadState: SetTorrentState) => {
  const currentTorrentKey = useRef<string | null>(null);

  useEffect(() => {
    // Callback pour le progrès global
    const handleProgress = (progress: TorrentProgress) => {
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
    };

    // S'abonner au progrès global
    webTorrentService.subscribeToProgress(handleProgress);

    // Cleanup
    return () => {
      webTorrentService.unsubscribeFromProgress(handleProgress);
    };
  }, [setDownloadState]);

  /**
   * Fonction pour démarrer un téléchargement avec les callbacks appropriés
   * @param torrentKey - Clé unique du torrent
   * @param torrentID - ID du torrent (magnet URI, etc.)
   */
  const startTorrentDownload = (torrentKey: string, torrentID: string) => {
    currentTorrentKey.current = torrentKey;

    setDownloadState({
      isDownloading: true,
      progress: 0,
      speed: '0 KB/s',
      eta: '--',
      error: null,
      torrentName: null,
      downloaded: '0 MB',
      peers: 0,
      savedFiles: [],
    })

    const callbacks: TorrentCallbacks = {
      onReady: ({ torrentKey: key, info }) => {
        if (key === currentTorrentKey.current) {
          setDownloadState((prev) => ({
            ...prev,
            torrentName: info.name,
            isDownloading: true,
            error: null,
          }));
        }
      },

      onDone: ({ torrentKey: key }) => {
        if (key === currentTorrentKey.current) {
          setDownloadState((prev) => ({
            ...prev,
            progress: 100,
            isDownloading: false,
          }));
        }
      },

      onError: ({ torrentKey: key, error }) => {
        if (key === currentTorrentKey.current) {
          setDownloadState((prev) => ({
            ...prev,
            isDownloading: false,
            error: error,
          }));
        }
      },

      onFileStreaming: ({ torrentKey: key, fileName, filePath }) => {
        if (key === currentTorrentKey.current) {
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
        }
      },

      onFileProgress: ({ torrentKey: key, fileName, bytesWritten, totalSize, progress }) => {
        if (key === currentTorrentKey.current) {
          setDownloadState((prev) => ({
            ...prev,
            savedFiles: prev.savedFiles.map(file => 
              file.name === fileName 
                ? { ...file, progress, bytesWritten, totalSize, streaming: true }
                : file
            )
          }));
        }
      },

      onFileSaved: ({ torrentKey: key, fileName }) => {
        if (key === currentTorrentKey.current) {
          setDownloadState((prev) => ({
            ...prev,
            savedFiles: prev.savedFiles.map(file => 
              file.name === fileName 
                ? { ...file, saved: true, streaming: false, progress: 100 }
                : file
            )
          }));
        }
      },

      onFileSaveError: ({ torrentKey: key, fileName, error }) => {
        if (key === currentTorrentKey.current) {
          setDownloadState((prev) => ({
            ...prev,
            savedFiles: prev.savedFiles.map(file => 
              file.name === fileName 
                ? { ...file, saved: false, streaming: false, error }
                : file
            )
          }));
        }
      },
    } satisfies TorrentCallbacks;

    // Démarrer le téléchargement avec les callbacks
    webTorrentService.startTorrenting(torrentKey, torrentID, callbacks);
  };

  /**
   * Fonction pour arrêter un téléchargement
   * @param infoHash - Hash du torrent à arrêter
   */
  const stopTorrentDownload = (infoHash: string) => {
    webTorrentService.stopTorrenting(infoHash);
    currentTorrentKey.current = null;
  };

  return {
    startTorrentDownload,
    stopTorrentDownload,
  };
};

export type { TorrentDownloadState }; 