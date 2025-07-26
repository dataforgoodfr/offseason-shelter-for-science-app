import React, { useState } from 'react'

interface TorrentProgress {
  progress: number
  downloadSpeed: string
  uploadSpeed: string
  numPeers: number
  timeRemaining: string
  downloaded: number
  total: number
}

export function TorrentDownloader() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState<TorrentProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<string>('Prêt')

  // Magnet link de test (Ubuntu 22.04 LTS)
  const testMagnetLink =
    'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fbig-buck-bunny.torrent'

  const handleTestDownload = async () => {
    setIsDownloading(true)
    setError(null)
    setSuccess(null)
    setProgress(null)
    setDownloadStatus('Initialisation du téléchargement...')

    try {
      // Écouter les événements de progression
      window.electronAPI.onTorrentProgress(
        (datasetId: string, progressData: TorrentProgress) => {
          setProgress(progressData)
          setDownloadStatus(
            `Téléchargement en cours... ${progressData.progress}%`
          )
        }
      )

      // Lancer le téléchargement
      const result = await window.electronAPI.downloadTorrent(
        testMagnetLink,
        'test-dataset'
      )

      if (result.success) {
        setDownloadStatus('Téléchargement terminé ! ✅')
        setSuccess(
          `Téléchargement terminé ! Fichier sauvegardé: ${result.filePath}`
        )
      } else {
        setDownloadStatus('Erreur lors du téléchargement ❌')
        setError(`Erreur lors du téléchargement: ${result.error}`)
      }
    } catch (err) {
      setDownloadStatus('Erreur lors du téléchargement ❌')
      setError(
        `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      )
    } finally {
      setIsDownloading(false)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Téléchargement Torrent</h2>

      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Testez le téléchargement de torrent avec un magnet link Ubuntu 22.04
          LTS
        </p>
        <div className="bg-gray-100 p-3 rounded text-sm font-mono break-all">
          {testMagnetLink}
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={handleTestDownload}
          disabled={isDownloading}
          className={`px-4 py-2 rounded font-medium ${
            isDownloading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isDownloading
            ? 'Téléchargement en cours...'
            : 'Lancer le téléchargement de test'}
        </button>

        {isDownloading && (
          <div className="mt-2 text-sm text-gray-600">
            <p className="font-medium">{downloadStatus}</p>
            {!progress && (
              <div className="mt-2 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Connexion aux pairs...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {progress && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Progression du téléchargement</h3>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex items-center justify-center"
              style={{ width: `${progress.progress}%` }}
            >
              <span className="text-white text-xs font-bold">
                {progress.progress}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Progression:</span>{' '}
              {progress.progress}%
            </div>
            <div>
              <span className="font-medium">Vitesse de téléchargement:</span>{' '}
              {progress.downloadSpeed}
            </div>
            <div>
              <span className="font-medium">Vitesse d'upload:</span>{' '}
              {progress.uploadSpeed}
            </div>
            <div>
              <span className="font-medium">Pairs connectés:</span>{' '}
              {progress.numPeers}
            </div>
            <div>
              <span className="font-medium">Téléchargé:</span>{' '}
              {formatBytes(progress.downloaded)}
            </div>
            <div>
              <span className="font-medium">Temps restant:</span>{' '}
              {progress.timeRemaining}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{success}</p>
        </div>
      )}
    </div>
  )
}
