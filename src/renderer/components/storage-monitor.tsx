import { useEffect, useState } from 'react'

interface StorageMonitorProps {
  selectedPath: string | null
  onStorageAllocationChange?: (percentage: number) => void
}

export function StorageMonitor({ selectedPath, onStorageAllocationChange }: StorageMonitorProps) {
  const [usedPercentage, setUsedPercentage] = useState<number>(0)
  const [freeStorage, setFreeStorage] = useState<number>(0)
  const [selectedPercentage, setSelectedPercentage] = useState<number>(50)

  useEffect(() => {
    if (selectedPath) {
      // Appel IPC pour obtenir l'espace libre disponible
      window.App.getFreeSpace(selectedPath).then((freeBytes: number) => {
        if (freeBytes) {
          setFreeStorage(freeBytes)
        }
      }).catch(() => {
        console.error('Failed to get free space for path:', selectedPath)
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
    setUsedPercentage(percentage)
    onStorageAllocationChange?.(percentage)
  }

  if (!selectedPath) return null


  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide">
        Storage Shared
      </h2>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
        <div className="text-xs text-white/80 mb-2">
          {formatStorage(freeStorage)} of free space available
        </div>
        
        <div className="relative w-full h-2 bg-white/20 rounded-full mb-4">
          <div 
            className="absolute h-full bg-white/60 rounded-full"
            style={{ width: `${usedPercentage}%` }}
          ></div>
        </div>
        
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