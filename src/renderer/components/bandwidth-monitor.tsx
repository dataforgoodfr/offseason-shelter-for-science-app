import { useEffect, useState } from 'react'

interface BandwidthMonitorProps {
  onBandwidthAllocationChange?: (percentage: number) => void
}

export function BandwidthMonitor({ onBandwidthAllocationChange }: BandwidthMonitorProps) {
  const [downloadSpeed, setDownloadSpeed] = useState<number>(0)
  const [uploadSpeed, setUploadSpeed] = useState<number>(0)
  const [selectedPercentage, setSelectedPercentage] = useState<number>(10)
  const [isDetecting, setIsDetecting] = useState<boolean>(true)

  useEffect(() => {
    // Détection de la bande passante réseau réelle
    const detectBandwidth = async () => {
      try {
        setIsDetecting(true)
        const bandwidth = await window.App.detectBandwidth()
        if (bandwidth) {
          setDownloadSpeed(bandwidth.download)
          setUploadSpeed(bandwidth.upload)
        }
      } catch (error) {
        console.warn('Impossible de détecter la bande passante:', error)
      } finally {
        setIsDetecting(false)
      }
    }

    detectBandwidth()
  }, [])

  const handlePercentageSelect = (percentage: number) => {
    setSelectedPercentage(percentage)
    onBandwidthAllocationChange?.(percentage)
  }

  const formatSpeed = (gbps: number): string => {
    if (gbps >= 1) {
      return `${gbps.toFixed(1)}Gbps`
    }
    return `${(gbps * 1000).toFixed(0)}Mbps`
  }

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide">
        Max Bandwidth Allowed
      </h2>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
        {isDetecting ? (
          <div className="text-center py-4">
            <div className="animate-pulse text-sm text-white/80">
              Detecting network speed...
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="text-lg">↓</div>
                <span className="text-sm">{formatSpeed(downloadSpeed)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-lg">↑</div>
                <span className="text-sm">{formatSpeed(uploadSpeed)}</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {[10, 25, 50, 75, 100].map((percentage) => (
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
              Download limit: {formatSpeed(downloadSpeed * (selectedPercentage / 100))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}