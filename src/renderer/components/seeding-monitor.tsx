import type React from 'react'
import { useSeedingEvents, type SeedingInfo } from 'renderer/hooks'
import webTorrentService from 'renderer/services/webtorrent.service'

export const SeedingMonitor: React.FC = () => {
  const { seedingTorrents } = useSeedingEvents()

  const handleStopSeeding = (torrentKey: string) => {
    webTorrentService.stopSeeding(torrentKey)
  }

  const copyMagnetLink = async (magnetURI: string) => {
    try {
      await navigator.clipboard.writeText(magnetURI)
    } catch (error) {
      console.error('Erreur lors de la copie:', error)
    }
  }

  if (seedingTorrents.length === 0) {
    return null
  }

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide">
        Seeding Actif ({seedingTorrents.length})
      </h2>

      <div className="space-y-3">
        {seedingTorrents.map(torrent => (
          <div
            key={torrent.key}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm font-medium text-white mb-1">
                  🌱 {torrent.name}
                </div>
                <div className="text-xs text-white/70">
                  📁 {torrent.filePath}
                </div>
              </div>
              <button
                onClick={() => handleStopSeeding(torrent.key)}
                className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-colors duration-200"
              >
                🛑 Arrêter
              </button>
            </div>

            <div className="bg-white/5 rounded p-2 mb-2">
              <div className="text-xs text-white/90 break-all font-mono">
                {torrent.magnetURI}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyMagnetLink(torrent.magnetURI)}
                className="flex-1 text-xs py-2 px-3 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 transition-colors duration-200"
              >
                📋 Copier le magnet link
              </button>
            </div>

            {/* Statistiques de seeding (si disponibles) */}
            {(torrent.uploaded > 0 || torrent.ratio > 0) && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4 text-xs text-white/70">
                  <div>
                    <span className="block">Uploadé:</span>
                    <span className="font-medium">
                      {(torrent.uploaded / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <div>
                    <span className="block">Ratio:</span>
                    <span className="font-medium">
                      {torrent.ratio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
