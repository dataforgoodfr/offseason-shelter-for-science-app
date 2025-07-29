import { useEffect, useState } from 'react';

interface SeedingInfo {
  key: string;
  name: string;
  magnetURI: string;
  filePath: string;
  uploaded: number;
  ratio: number;
}

/**
 * Hook personnalisé pour gérer les événements de seeding
 */
export const useSeedingEvents = () => {
  const [seedingTorrents, setSeedingTorrents] = useState<SeedingInfo[]>([]);

  useEffect(() => {
    const handleSeedingStarted = (event: CustomEvent) => {
      const { torrentKey, magnetURI, name, filePath } = event.detail;
      
      setSeedingTorrents(prev => [
        ...prev.filter(t => t.key !== torrentKey),
        {
          key: torrentKey,
          name,
          magnetURI,
          filePath,
          uploaded: 0,
          ratio: 0
        }
      ]);
    };

    const handleSeedingStopped = (event: CustomEvent) => {
      const { torrentKey } = event.detail;
      
      setSeedingTorrents(prev => 
        prev.filter(t => t.key !== torrentKey)
      );
    };

    // Écouter les événements
    window.addEventListener('torrent-seeding-started', handleSeedingStarted as EventListener);
    window.addEventListener('torrent-seeding-stopped', handleSeedingStopped as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('torrent-seeding-started', handleSeedingStarted as EventListener);
      window.removeEventListener('torrent-seeding-stopped', handleSeedingStopped as EventListener);
    };
  }, []);

  return {
    seedingTorrents,
    setSeedingTorrents
  };
};

export type { SeedingInfo }; 