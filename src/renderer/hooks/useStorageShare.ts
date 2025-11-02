// renderer/hooks/useStorageShare.ts
import { useState, useEffect, useCallback } from "react";
import { logger } from "renderer/lib/logger";

const GIGA_BYTES = 1024 * 1024 * 1024; // 1 GB en bytes

export interface UseStorageShareReturn {
  diskSize: number | null;
  storagePercentage: number;
  allocatedSize: number | null;
  sliderValue: number;
  setStoragePercentage: (percentage: number) => void;
  handleSliderChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isReady: boolean;
}

export function useStorageShare(
  selectedPath: string | null | undefined
): UseStorageShareReturn {
  const [diskSize, setDiskSize] = useState<number | null>(null);
  const [storagePercentage, setStoragePercentageState] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);

  // Charger les paramètres sauvegardés au démarrage
  useEffect(() => {
    const loadSavedStorage = async () => {
      try {
        const savedAllocation = await window.App.getStorageAllocation();
        if (savedAllocation && savedAllocation > 0) {
          // Convertir bytes en GB
          const savedGB = savedAllocation / GIGA_BYTES;
          // Si on a déjà la taille du disque, calculer le pourcentage
          if (diskSize) {
            const percentage = (savedGB / diskSize) * 100;
            setStoragePercentageState(Math.round(percentage * 10) / 10);
          }
          logger.info("Loaded saved storage allocation", {
            data: { bytes: savedAllocation, gb: savedGB },
          });
        }
      } catch (error) {
        console.error("Failed to load saved storage allocation:", error);
      }
    };

    if (diskSize) {
      loadSavedStorage();
    }
  }, [diskSize]);

  // Récupérer la taille du disque quand un chemin est sélectionné
  useEffect(() => {
    const fetchDiskSize = async () => {
      console.log("selectedPath in useStorageShare", selectedPath);
      if (selectedPath) {
        setIsReady(false);
        try {
          const { totalGB } = await window.App.getDiskInfo(selectedPath);
          logger.info("Disk size retrieved", {
            data: { path: selectedPath, totalGB },
          });
          setDiskSize(totalGB);

          // Définir un pourcentage par défaut si aucune valeur n'est définie
          if (storagePercentage === 0) {
            setStoragePercentageState(2); // 2% par défaut
          }

          setIsReady(true);
        } catch (error: any) {
          logger.error("Error fetching disk size", {
            data: { path: selectedPath, error: error.message },
          });
          setDiskSize(null);
          setIsReady(false);
        }
      } else {
        setDiskSize(null);
        setIsReady(false);
      }
    };

    fetchDiskSize();
  }, [selectedPath]);

  // Sauvegarder l'allocation de stockage quand elle change
  useEffect(() => {
    const saveStorageAllocation = async () => {
      if (diskSize && storagePercentage > 0 && isReady) {
        const allocatedGB = (diskSize * storagePercentage) / 100;
        const allocatedBytes = Math.round(allocatedGB * GIGA_BYTES);

        try {
          await window.App.setStorageAllocation(allocatedBytes);
          logger.info("Storage allocation updated", {
            data: {
              percentage: storagePercentage,
              gb: allocatedGB,
              bytes: allocatedBytes,
            },
          });
        } catch (error: any) {
          logger.error("Error setting storage allocation", {
            data: {
              percentage: storagePercentage,
              error: error.message,
            },
          });
        }
      }
    };

    saveStorageAllocation();
  }, [storagePercentage, diskSize, isReady]);

  // Calculer la taille allouée en fonction du pourcentage
  const allocatedSize = diskSize
    ? Math.round((diskSize * storagePercentage) / 100)
    : null;

  // Convertir la valeur linéaire du slider en pourcentage exponentiel
  const linearToExponential = useCallback((linearValue: number): number => {
    const normalizedValue = linearValue / 100;
    const exponentialValue = normalizedValue ** 2 * 100;
    return Math.round(Math.max(0.1, exponentialValue) * 10) / 10;
  }, []);

  // Convertir le pourcentage exponentiel en valeur linéaire pour le slider
  const exponentialToLinear = useCallback(
    (exponentialValue: number): number => {
      const normalizedValue = exponentialValue / 100;
      const linearValue = Math.sqrt(normalizedValue) * 100;
      return Math.round(linearValue);
    },
    []
  );

  const handleSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const linearValue = Number.parseInt(event.target.value, 10);
      if (
        !Number.isNaN(linearValue) &&
        linearValue >= 0 &&
        linearValue <= 100
      ) {
        const exponentialPercentage = linearToExponential(linearValue);
        setStoragePercentageState(exponentialPercentage);
      }
    },
    [linearToExponential]
  );

  const setStoragePercentage = useCallback((percentage: number) => {
    if (percentage >= 0 && percentage <= 100) {
      setStoragePercentageState(Math.round(percentage * 10) / 10);
    }
  }, []);

  return {
    diskSize,
    storagePercentage,
    allocatedSize,
    sliderValue: exponentialToLinear(storagePercentage),
    setStoragePercentage,
    handleSliderChange,
    isReady,
  };
}
