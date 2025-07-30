// src/renderer/components/DatasetDownloader.tsx
import type React from 'react'
import { useState, useEffect } from 'react'
import {
  ArrowDownIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import webTorrentService from 'renderer/services/webtorrent.service'

interface DownloadState {
  isDownloading: boolean
  progress: number
  speed: string
  eta: string
  error: string | null
  filePath: string | null
  // Nouveau état pour le seeding
  magnetLink: string | null
  isCreatingMagnet: boolean
  magnetError: string | null
  isSeeding: boolean
}

export const DatasetDownloader: React.FC<{ datasetName: string }> = ({
  datasetName,
}) => {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    progress: 0,
    speed: '',
    eta: '',
    error: null,
    filePath: null,
    magnetLink: null,
    isCreatingMagnet: false,
    magnetError: null,
    isSeeding: false,
  })

  useEffect(() => {
    // Écouter les mises à jour de progression
    window.App.onDownloadProgress((progress, speed, eta) => {
      setDownloadState(prev => ({
        ...prev,
        progress,
        speed,
        eta,
      }))
    })

    // Cleanup
    return () => {
      window.App.removeDownloadProgressListener()
    }
  }, [])

  const handleDownload = async () => {
    setDownloadState({
      isDownloading: true,
      progress: 0,
      speed: '',
      eta: '',
      error: null,
      filePath: null,
      magnetLink: null,
      isCreatingMagnet: false,
      magnetError: null,
      isSeeding: false,
    })

    try {
      // Phase 1: Téléchargement
      const result = await window.App.downloadDataset(datasetName)

      if (result.success && result.filePath) {
        console.log(
          '📥 Téléchargement terminé, démarrage du seeding automatique pour:',
          result.filePath
        )

        // Phase 2: Transition vers le seeding
        setDownloadState(prev => ({
          ...prev,
          isDownloading: false,
          progress: 100,
          filePath: result.filePath,
          isCreatingMagnet: true,
          magnetError: null,
        }))

        // Phase 3: Seeding automatique
        try {
          const seedingResult = await webTorrentService.saveFileForSeeding(
            result.filePath
          )

          if (seedingResult.error) {
            setDownloadState(prev => ({
              ...prev,
              isCreatingMagnet: false,
              magnetError:
                seedingResult.error || 'Erreur lors du seeding automatique',
            }))
            console.error('❌ Erreur seeding automatique:', seedingResult.error)
          } else {
            setDownloadState(prev => ({
              ...prev,
              isCreatingMagnet: false,
              magnetLink: seedingResult.magnetURI,
              isSeeding: true,
            }))
            console.log(
              '✅ Seeding automatique démarré avec succès:',
              seedingResult.magnetURI
            )
          }
        } catch (seedingError: any) {
          setDownloadState(prev => ({
            ...prev,
            isCreatingMagnet: false,
            magnetError:
              seedingError?.message || 'Erreur lors du seeding automatique',
          }))
          console.error('❌ Erreur seeding automatique:', seedingError)
        }
      } else {
        setDownloadState(prev => ({
          ...prev,
          isDownloading: false,
          error: result.error || 'Unknown error',
        }))
      }
    } catch (error: any) {
      setDownloadState(prev => ({
        ...prev,
        isDownloading: false,
        error: error?.message || error || 'Download failed',
      }))
    }
  }

  // Copier le magnet link dans le presse-papiers
  const copyMagnetLink = async () => {
    if (downloadState.magnetLink) {
      try {
        await navigator.clipboard.writeText(downloadState.magnetLink)
        // Optionnel: ajouter un feedback visuel
      } catch (error) {
        console.error('Erreur lors de la copie:', error)
      }
    }
  }

  // Écouter l'événement de début de seeding
  useEffect(() => {
    const handleSeedingStarted = (event: CustomEvent) => {
      const { magnetURI, name, filePath } = event.detail
      console.log('Seeding démarré pour:', name)
    }

    window.addEventListener(
      'torrent-seeding-started',
      handleSeedingStarted as EventListener
    )

    return () => {
      window.removeEventListener(
        'torrent-seeding-started',
        handleSeedingStarted as EventListener
      )
    }
  }, [])

  return (
    <div>
      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={downloadState.isDownloading}
        className={`w-full text-sm font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 ${
          downloadState.isDownloading
            ? 'bg-white/10 text-white/60 cursor-not-allowed'
            : 'bg-white/20 hover:bg-white/30 text-white'
        }`}
      >
        <ArrowDownIcon className="w-4 h-4" />
        <span>
          {downloadState.isDownloading
            ? 'Downloading...'
            : `Download Dataset '${datasetName}'`}
        </span>
      </button>

      {/* Progress Section */}
      {downloadState.isDownloading && (
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Progress: {downloadState.progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${downloadState.progress}%` }}
            />
          </div>

          {/* Speed and ETA */}
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Speed: {downloadState.speed}</span>
            <span>ETA: {downloadState.eta}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {downloadState.error && (
        <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-start space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-red-300">Error:</div>
            <div className="text-sm text-red-200">{downloadState.error}</div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {downloadState.filePath && (
        <div className="mt-4 bg-green-500/20 border border-green-500/30 rounded-lg p-3 flex items-start space-x-2">
          <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium text-green-300">
              Download completed!
            </div>
            <div className="text-xs text-green-200 mt-1">
              File saved to: {downloadState.filePath}
            </div>

            {/* Seeding Section */}
            <div className="mt-3 pt-3 border-t border-green-500/20">
              {downloadState.isCreatingMagnet && (
                <div className="text-center">
                  <div className="text-sm text-green-200">
                    🔄 Création du magnet link...
                  </div>
                </div>
              )}

              {downloadState.magnetLink && (
                <div>
                  <div className="text-sm font-medium text-green-300 mb-2">
                    🌱 Seeding actif - Magnet Link:
                  </div>
                  <div className="bg-green-900/30 rounded p-2 mb-2">
                    <div className="text-xs text-green-100 break-all font-mono">
                      {downloadState.magnetLink}
                    </div>
                  </div>
                  <button
                    onClick={copyMagnetLink}
                    className="w-full text-xs py-2 px-3 rounded bg-green-600/20 hover:bg-green-600/30 text-green-200 transition-colors duration-200"
                  >
                    📋 Copier le magnet link
                  </button>
                </div>
              )}

              {downloadState.magnetError && (
                <div className="text-xs text-red-300 bg-red-900/20 rounded p-2">
                  ❌ {downloadState.magnetError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
