import type React from 'react'
import { useSeedingEvents } from 'renderer/hooks'
import webTorrentService from 'renderer/services/webtorrent.service'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export const SeedingMonitor: React.FC = () => {
  const { seedingTorrents, refreshSeedingData } = useSeedingEvents()

  const handleStopSeeding = async (torrentKey: string) => {
    console.log('🛑 Arrêt du seeding pour:', torrentKey)

    try {
      // Vérifier les données avant suppression
      const seedingDataBefore = await window.App.getSeedingData()
      console.log(
        '📊 Données avant suppression:',
        Object.keys(seedingDataBefore)
      )

      // Arrêter le seeding côté WebTorrent
      webTorrentService.stopSeeding(torrentKey)

      // Supprimer les données du store en utilisant filePath comme clé
      await window.App.removeSeedingInfo(torrentKey)
      console.log('🗑️ Données supprimées du store pour:', torrentKey)

      // Vérifier les données après suppression
      const seedingDataAfter = await window.App.getSeedingData()
      console.log(
        '📊 Données après suppression:',
        Object.keys(seedingDataAfter)
      )

      // Rafraîchir la liste immédiatement
      refreshSeedingData()
    } catch (error) {
      console.error("❌ Erreur lors de l'arrêt du seeding:", error)
    }
  }

  const copyMagnetLink = async (magnetURI: string) => {
    try {
      await navigator.clipboard.writeText(magnetURI)
    } catch (error) {
      console.error('Erreur lors de la copie:', error)
    }
  }

  const handleRefresh = () => {
    refreshSeedingData()
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Torrents Seeding ({seedingTorrents.length})
        </h2>
        <button
          onClick={handleRefresh}
          className="p-1 hover:bg-white/10 rounded transition-colors duration-200"
          title="Rafraîchir la liste"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      </div>

      {seedingTorrents.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-sm text-white/70">
            Aucun torrent en cours de seeding
          </div>
          <div className="text-xs text-white/50 mt-1">
            Les torrents apparaîtront ici automatiquement
          </div>
        </div>
      ) : (
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
      )}
    </div>
  )
}
