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
  })

  useEffect(() => {
    // Écouter les mises à jour de progression des torrents
    const handleTorrentProgress = (progress: any) => {
      if (progress.torrents && progress.torrents.length > 0) {
        const torrent = progress.torrents[0] // Prendre le premier torrent
        setDownloadState(prev => ({
          ...prev,
          progress: Math.round(torrent.progress * 100),
          speed: `${(torrent.downloadSpeed / 1024 / 1024).toFixed(1)} MB/s`,
          downloaded: `${(torrent.downloaded / 1024 / 1024).toFixed(1)} MB`,
          peers: torrent.numPeers,
          eta:
            torrent.progress > 0
              ? `${Math.round((torrent.length - torrent.downloaded) / (torrent.downloadSpeed || 1))}s`
              : '--',
        }))
      }
    }

    // Écouter les événements WebTorrent
    const handleTorrentReady = (torrentKey: string, info: any) => {
      setDownloadState(prev => ({
        ...prev,
        torrentName: info.name,
        isDownloading: true,
      }))
    }

    const handleTorrentDone = (torrentKey: string, info: any) => {
      setDownloadState(prev => ({
        ...prev,
        progress: 100,
        isDownloading: false,
      }))
    }

    const handleTorrentError = (torrentKey: string, error: string) => {
      setDownloadState(prev => ({
        ...prev,
        isDownloading: false,
        error: error,
      }))
    }

    // Ajouter les listeners (ces événements devront être exposés via le preload)
    ;(window as any).addEventListener('torrent-progress', handleTorrentProgress)
    ;(window as any).addEventListener('torrent-ready', handleTorrentReady)
    ;(window as any).addEventListener('torrent-done', handleTorrentDone)
    ;(window as any).addEventListener('torrent-error', handleTorrentError)

    return () => {
      ;(window as any).removeEventListener(
        'torrent-progress',
        handleTorrentProgress
      )
      ;(window as any).removeEventListener('torrent-ready', handleTorrentReady)
      ;(window as any).removeEventListener('torrent-done', handleTorrentDone)
      ;(window as any).removeEventListener('torrent-error', handleTorrentError)
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
    })

    try {
      // Utiliser le service WebTorrent pour démarrer le téléchargement
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
      {downloadState.progress === 100 && !downloadState.isDownloading && (
        <div className="mt-4 bg-green-500/20 border border-green-500/30 rounded-lg p-3 flex items-start space-x-2">
          <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-green-300">
              Téléchargement terminé!
            </div>
            <div className="text-xs text-green-200 mt-1">
              {downloadState.torrentName}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
