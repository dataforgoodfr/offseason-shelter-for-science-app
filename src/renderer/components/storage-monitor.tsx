import { useEffect, useState } from 'react'

interface StorageMonitorProps {
  selectedPath: string | null
  onStorageAllocationChange?: (percentage: number) => void
}

export function StorageMonitor({ selectedPath, onStorageAllocationChange }: StorageMonitorProps) {
  const [totalStorage, setTotalStorage] = useState<number>(0)
  const [freeStorage, setFreeStorage] = useState<number>(0)
  const [selectedPercentage, setSelectedPercentage] = useState<number>(50)

  useEffect(() => {
    if (selectedPath) {
      // Appel IPC pour obtenir l'espace libre disponible
      window.App.getFreeSpace(selectedPath).then((freeBytes: number) => {
        if (freeBytes) {
          setFreeStorage(freeBytes)
          // On estime l'espace total comme étant au moins l'espace libre + un peu plus
          // ou on peut faire un appel séparé si besoin
          setTotalStorage(freeBytes * 0.2) // Estimation
        }
      }).catch(() => {

        console.error('Failed to get free space for path:', selectedPath)
        // Valeurs par défaut si l'API n'est pas disponible
        // setTotalStorage(1000000000000) // 1TB
        // setFreeStorage(500000000000)   // 500GB
      })
    }
  }, [selectedPath])

  const formatStorage = (bytes: number): string => {
    const gb = bytes / (1024 ** 3)
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)} TB`
    }
    return `${gb.toFixed(0)} GB`
  }

  const handlePercentageSelect = (percentage: number) => {
    setSelectedPercentage(percentage)
    onStorageAllocationChange?.(percentage)
  }

  if (!selectedPath) return null

  const usedPercentage = ((totalStorage - freeStorage) / totalStorage) * 100

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide">
        Storage Shared
      </h2>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
        <div className="text-xs text-white/80 mb-2">
          {formatStorage(freeStorage)} of free space available
        </div>
        
        {/* Barre de progression de l'espace utilisé */}
        <div className="relative w-full h-2 bg-white/20 rounded-full mb-4">
          <div 
            className="absolute h-full bg-white/60 rounded-full"
            style={{ width: `${usedPercentage}%` }}
          ></div>
        </div>
        
        {/* Boutons de pourcentage */}
        <div className="flex space-x-2">
          {[25, 50, 75, 100].map((percentage) => (
            <button
              key={percentage}
              onClick={() => handlePercentageSelect(percentage)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                selectedPercentage === percentage
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {percentage}%
            </button>
          ))}

        </div>
        
        <div className="mt-2 text-xs text-white/80">
          Allocated: {formatStorage(freeStorage * (selectedPercentage / 100))}
        </div>
      </div>
    </div>
  )
}