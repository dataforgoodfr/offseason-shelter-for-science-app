import { useEffect, useState } from 'react'
import { EllipsisHorizontalIcon, FolderIcon } from '@heroicons/react/24/outline'
import { DatasetDownloader } from 'renderer/components/dataset-downloader'
import { TorrentDownloader } from 'renderer/components/torrent-downloader'
import { SeedingMonitor } from 'renderer/components/seeding-monitor'

// The "App" comes from the context bridge in preload/index.ts
const { App } = window

export function MainScreen() {
  useEffect(() => {
    // check the console on dev tools
    App.sayHelloFromBridge()
  }, [])

  useEffect(() => {
    window.App.getDownloadPath().then(path => {
      if (path) setSelectedPath(path)
    })
  }, [])

  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const handleSelectFolder = async () => {
    const folder = await App.openFolderDialog()
    if (folder) {
      setSelectedPath(folder)
      await window.App.setDownloadPath(folder) // <-- Sauvegarde dans SQLite via IPC !
    }
  }

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 min-h-screen text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-500 rounded-xs"></div>
          </div>
          <h1 className="text-sm font-semibold uppercase tracking-wide">
            Shelter for Science
          </h1>
        </div>
        <EllipsisHorizontalIcon className="w-5 h-5" />
      </div>

      {/* Path */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide">
          Path
        </h2>
        <button
          onClick={handleSelectFolder}
          className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-full text-left hover:bg-white/20 transition-colors duration-200"
          title="Sélectionnez le dossier de téléchargement"
        >
          <FolderIcon className="w-5 h-5" />
          <span className="text-sm truncate">
            {selectedPath || 'Cliquez pour choisir un dossier'}
          </span>
        </button>
      </div>

      <div className="border-b border-white/20 mb-6"></div>

      {/* Dataset Downloader */}
      <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide">
        Dataset Downloader
      </h2>
      <div className="mb-6">
        <DatasetDownloader datasetName="climate-data" />
      </div>
      <div className="mb-6">
        <DatasetDownloader datasetName="ocean-temperature-data" />
      </div>

      <div className="border-b border-white/20 mb-6"></div>

      {/* Torrent Downloader */}
      <div className="mb-6">
        <TorrentDownloader />
      </div>

      {/* Seeding Monitor */}
      <div className="mb-6">
        <SeedingMonitor />
      </div>
    </div>
  )
}
