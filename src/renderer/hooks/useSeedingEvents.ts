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

  // Fonction pour charger les données de seeding depuis le main process
  const loadSeedingData = async () => {
    try {
      const seedingData = await window.App.getSeedingData();
      console.log('🔄 Chargement des données de seeding:', Object.keys(seedingData).length, 'fichiers');
      
      // Convertir les données du format main process vers le format du hook
      const formattedSeedingTorrents: SeedingInfo[] = Object.entries(seedingData).map(([filePath, info]: [string, any]) => ({
        key: filePath, // Utiliser le filePath comme clé unique
        name: info.name || filePath.split('/').pop() || 'Fichier inconnu',
        magnetURI: info.magnetURI || '',
        filePath: filePath,
        uploaded: info.uploaded || 0,
        ratio: info.ratio || 0
      }));

      console.log('📋 Torrents formatés:', formattedSeedingTorrents.length);
      setSeedingTorrents(formattedSeedingTorrents);
    } catch (error) {
      console.error('Erreur lors du chargement des données de seeding:', error);
    }
  };

  useEffect(() => {
    // Charger les données initiales
    loadSeedingData();

    // Polling pour les mises à jour automatiques (toutes les 2 secondes)
    const intervalId = setInterval(loadSeedingData, 2000);

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

    // Écouter les événements pour les mises à jour en temps réel
    window.addEventListener('torrent-seeding-started', handleSeedingStarted as EventListener);
    window.addEventListener('torrent-seeding-stopped', handleSeedingStopped as EventListener);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('torrent-seeding-started', handleSeedingStarted as EventListener);
      window.removeEventListener('torrent-seeding-stopped', handleSeedingStopped as EventListener);
    };
  }, []);

  return {
    seedingTorrents,
    setSeedingTorrents,
    refreshSeedingData: loadSeedingData // Exposer la fonction de rafraîchissement
  };
};

export type { SeedingInfo }; 