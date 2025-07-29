// src/renderer/components/TorrentDownloader.tsx
import type React from 'react'
import { useState, useEffect } from 'react'
import {
  ArrowDownIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
import webTorrentService from 'renderer/services/webtorrent.service'

interface TorrentDownloadState {
  isDownloading: boolean
  progress: number
  speed: string
  eta: string
  error: string | null
  torrentName: string | null
  downloaded: string
  peers: number
  savedFiles: Array<{
    name: string
    filePath: string
    saved: boolean
    error?: string
    streaming?: boolean
    progress?: number
    bytesWritten?: number
    totalSize?: number
  }>
}

export const TorrentDownloader: React.FC = () => {
  const [magnetLink, setMagnetLink] = useState<string>('')
  const [downloadState, setDownloadState] = useState<TorrentDownloadState>({
    isDownloading: false,
    progress: 0,
    speed: '0 KB/s',
    eta: '--',
    error: null,
    torrentName: null,
    downloaded: '0 MB',
    peers: 0,
    savedFiles: [],
  })

  useEffect(() => {
    // Écouter les mises à jour de progression des torrents
    const handleTorrentProgress = (event: CustomEvent) => {
      const progress = event.detail
      if (progress.torrents && progress.torrents.length > 0) {
        const torrent = progress.torrents[0] // Prendre le premier torrent
        setDownloadState(prev => ({
          ...prev,
          progress: Math.round(torrent.progress * 100),
          speed: `${(torrent.downloadSpeed / 1024 / 1024).toFixed(1)} MB/s`,
          downloaded: `${(torrent.downloaded / 1024 / 1024).toFixed(1)} MB`,
          peers: torrent.numPeers,
          eta:
            torrent.progress > 0 && torrent.downloadSpeed > 0
              ? `${Math.round((torrent.length - torrent.downloaded) / torrent.downloadSpeed)}s`
              : '--',
        }))
      }
    }

    // Écouter les événements WebTorrent
    const handleTorrentReady = (event: CustomEvent) => {
      const { torrentKey, info } = event.detail
      setDownloadState(prev => ({
        ...prev,
        torrentName: info.name,
        isDownloading: true,
        error: null,
      }))
    }

    const handleTorrentMetadata = (event: CustomEvent) => {
      const { torrentKey, info } = event.detail
      setDownloadState(prev => ({
        ...prev,
        torrentName: info.name,
      }))
    }

    const handleTorrentDone = (event: CustomEvent) => {
      const { torrentKey, info } = event.detail
      setDownloadState(prev => ({
        ...prev,
        progress: 100,
        isDownloading: false,
      }))
    }

    const handleTorrentError = (event: CustomEvent) => {
      const { torrentKey, error } = event.detail
      setDownloadState(prev => ({
        ...prev,
        isDownloading: false,
        error: error,
      }))
    }

    const handleTorrentFilesReady = (event: CustomEvent) => {
      const { torrentKey, files, torrent } = event.detail
      setDownloadState(prev => ({
        ...prev,
        files: files,
        currentTorrent: torrent,
      }))
    }

    const handleTorrentFileStreaming = (event: CustomEvent) => {
      const { torrentKey, fileName, filePath, streamId } = event.detail
      setDownloadState(prev => ({
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
            totalSize: 0,
          },
        ],
      }))
    }

    const handleTorrentFileProgress = (event: CustomEvent) => {
      const { torrentKey, fileName, bytesWritten, totalSize, progress } =
        event.detail
      setDownloadState(prev => ({
        ...prev,
        savedFiles: prev.savedFiles.map(file =>
          file.name === fileName
            ? {
                ...file,
                progress,
                bytesWritten,
                totalSize,
                streaming: true,
              }
            : file
        ),
      }))
    }

    const handleTorrentFileSaved = (event: CustomEvent) => {
      const { torrentKey, fileName, filePath } = event.detail
      setDownloadState(prev => ({
        ...prev,
        savedFiles: prev.savedFiles.map(file =>
          file.name === fileName
            ? { ...file, saved: true, streaming: false, progress: 100 }
            : file
        ),
      }))
    }

    const handleTorrentFileSaveError = (event: CustomEvent) => {
      const { torrentKey, fileName, error } = event.detail
      setDownloadState(prev => ({
        ...prev,
        savedFiles: prev.savedFiles.map(file =>
          file.name === fileName
            ? { ...file, saved: false, streaming: false, error }
            : file
        ),
      }))
    }

    // Ajouter les listeners pour les événements CustomEvent
    window.addEventListener(
      'torrent-progress',
      handleTorrentProgress as EventListener
    )
    window.addEventListener(
      'torrent-ready',
      handleTorrentReady as EventListener
    )
    window.addEventListener(
      'torrent-metadata',
      handleTorrentMetadata as EventListener
    )
    window.addEventListener('torrent-done', handleTorrentDone as EventListener)
    window.addEventListener(
      'torrent-error',
      handleTorrentError as EventListener
    )
    window.addEventListener(
      'torrent-file-streaming',
      handleTorrentFileStreaming as EventListener
    )
    window.addEventListener(
      'torrent-file-progress',
      handleTorrentFileProgress as EventListener
    )
    window.addEventListener(
      'torrent-file-saved',
      handleTorrentFileSaved as EventListener
    )
    window.addEventListener(
      'torrent-file-save-error',
      handleTorrentFileSaveError as EventListener
    )

    return () => {
      window.removeEventListener(
        'torrent-progress',
        handleTorrentProgress as EventListener
      )
      window.removeEventListener(
        'torrent-ready',
        handleTorrentReady as EventListener
      )
      window.removeEventListener(
        'torrent-metadata',
        handleTorrentMetadata as EventListener
      )
      window.removeEventListener(
        'torrent-done',
        handleTorrentDone as EventListener
      )
      window.removeEventListener(
        'torrent-error',
        handleTorrentError as EventListener
      )
      window.removeEventListener(
        'torrent-file-streaming',
        handleTorrentFileStreaming as EventListener
      )
      window.removeEventListener(
        'torrent-file-progress',
        handleTorrentFileProgress as EventListener
      )
      window.removeEventListener(
        'torrent-file-saved',
        handleTorrentFileSaved as EventListener
      )
      window.removeEventListener(
        'torrent-file-save-error',
        handleTorrentFileSaveError as EventListener
      )
    }
  }, [])

  const handleStartDownload = async () => {
    if (!magnetLink.trim()) {
      setDownloadState(prev => ({
        ...prev,
        error: 'Veuillez entrer un magnet link valide',
      }))
      return
    }

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

    try {
      const torrentKey = `torrent-${Date.now()}`
      webTorrentService.startTorrenting(torrentKey, magnetLink)
    } catch (error: any) {
      setDownloadState(prev => ({
        ...prev,
        isDownloading: false,
        error: error?.message || error || 'Échec du téléchargement',
      }))
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`
  }

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide">
        Torrent Downloader
      </h2>

      {/* Magnet Link Input */}
      <div className="mb-4">
        <input
          type="text"
          value={magnetLink}
          onChange={e => setMagnetLink(e.target.value)}
          placeholder="Entrez un magnet link..."
          disabled={downloadState.isDownloading}
          className={`w-full text-sm bg-white/10 backdrop-blur-sm rounded-lg p-3 text-white placeholder-white/50 border transition-colors duration-200 ${
            downloadState.isDownloading
              ? 'border-white/20 cursor-not-allowed'
              : 'border-white/30 hover:border-white/50 focus:border-white/70'
          }`}
        />

        {/* Bouton de test */}
        <button
          onClick={() =>
            setMagnetLink(
              'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fbig-buck-bunny.torrent'
            )
          }
          disabled={downloadState.isDownloading}
          className="mt-2 text-xs bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-1 rounded transition-colors duration-200"
        >
          📺 Utiliser Big Buck Bunny (test)
        </button>
      </div>

      {/* Download Button */}
      <button
        onClick={handleStartDownload}
        disabled={downloadState.isDownloading || !magnetLink.trim()}
        className={`w-full text-sm font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 ${
          downloadState.isDownloading || !magnetLink.trim()
            ? 'bg-white/10 text-white/60 cursor-not-allowed'
            : 'bg-white/20 hover:bg-white/30 text-white'
        }`}
      >
        <PlayIcon className="w-4 h-4" />
        <span>
          {downloadState.isDownloading
            ? 'Téléchargement...'
            : 'Démarrer le téléchargement'}
        </span>
      </button>

      {/* Progress Section */}
      {downloadState.isDownloading && (
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
          {/* Torrent Name */}
          {downloadState.torrentName && (
            <div className="mb-3">
              <span className="text-sm font-medium text-white/90">
                {downloadState.torrentName}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Progression: {downloadState.progress}%
            </span>
            <span className="text-xs text-white/70">
              {downloadState.peers} peers
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${downloadState.progress}%` }}
            />
          </div>

          {/* Download Info */}
          <div className="grid grid-cols-2 gap-4 text-xs text-white/70">
            <div>
              <span className="block">Vitesse:</span>
              <span className="font-medium">{downloadState.speed}</span>
            </div>
            <div>
              <span className="block">Téléchargé:</span>
              <span className="font-medium">{downloadState.downloaded}</span>
            </div>
            <div>
              <span className="block">ETA:</span>
              <span className="font-medium">{downloadState.eta}</span>
            </div>
            <div>
              <span className="block">Peers:</span>
              <span className="font-medium">{downloadState.peers}</span>
            </div>
          </div>
        </div>
      )}

      {/* Files Status - shown when files are being saved */}
      {downloadState.savedFiles.length > 0 && (
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">
            Fichiers ({downloadState.savedFiles.filter(f => f.saved).length}/
            {downloadState.savedFiles.length} sauvegardés)
          </h3>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {downloadState.savedFiles.map((file, index) => (
              <div key={index} className="bg-white/5 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-white truncate flex-1">
                    {file.name}
                  </div>
                  <div className="ml-2">
                    {file.saved ? (
                      <span className="text-green-400">✅</span>
                    ) : file.streaming ? (
                      <span className="text-blue-400">🔄</span>
                    ) : file.error ? (
                      <span className="text-red-400">❌</span>
                    ) : (
                      <span className="text-gray-400">⏳</span>
                    )}
                  </div>
                </div>

                {file.streaming && file.progress !== undefined && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                      <span>Sauvegarde: {file.progress}%</span>
                      <span>
                        {file.bytesWritten
                          ? formatBytes(file.bytesWritten)
                          : '0 B'}{' '}
                        / {file.totalSize ? formatBytes(file.totalSize) : '0 B'}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 transition-all duration-300 ease-out"
                        style={{ width: `${file.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {file.saved && (
                  <div className="text-xs text-green-400 truncate mt-1">
                    ✅ Sauvegardé : {file.filePath}
                  </div>
                )}

                {!file.saved && file.error && (
                  <div className="text-xs text-red-400 mt-1">
                    ❌ Erreur : {file.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {downloadState.error && (
        <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-start space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-red-300">Erreur:</div>
            <div className="text-sm text-red-200">{downloadState.error}</div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {downloadState.progress === 100 &&
        !downloadState.isDownloading &&
        downloadState.savedFiles.length > 0 && (
          <div className="mt-4 bg-green-500/20 border border-green-500/30 rounded-lg p-3 flex items-start space-x-2">
            <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-green-300">
                Téléchargement terminé!
              </div>
              <div className="text-xs text-green-200 mt-1">
                {downloadState.savedFiles.filter(f => f.saved).length}{' '}
                fichier(s) sauvegardé(s) dans le dossier sélectionné
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
