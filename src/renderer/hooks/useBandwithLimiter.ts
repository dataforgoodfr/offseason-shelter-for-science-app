// renderer/hooks/useBandwidthLimiter.ts
import { useState, useEffect, useCallback } from "react";
import { logger } from "renderer/lib/logger";
import { KILO_BYTES, MEGA_BYTES } from "lib/electron-app/utils/units";

export type BandwidthUnit = "KB/s" | "MB/s";

export interface UseBandwidthLimiterReturn {
  allocatedBandwidth: number | undefined;
  bandwidthUnit: BandwidthUnit | undefined;
  isEnabled: boolean;
  isReady: boolean;
  handleBandwidthChange: (bandwidth?: number, unit?: BandwidthUnit) => void;
  toggleBandwidth: () => void;
}

export const useBandwidthLimiter = (): UseBandwidthLimiterReturn => {
  const [allocatedBandwidth, setAllocatedBandwidth] = useState<
    number | undefined
  >(undefined);
  const [bandwidthUnit, setBandwidthUnit] = useState<BandwidthUnit | undefined>(
    undefined
  );
  const [isEnabled, setIsEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Charger les paramètres au montage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        logger.info("[useBandwidthLimiter] Loading bandwidth settings...");
        const bandwidthAllocation = await window.App.getBandwidthAllocation();

        if (bandwidthAllocation) {
          logger.info(
            "[useBandwidthLimiter] Loaded bandwidth allocation:",
            bandwidthAllocation
          );
          setIsEnabled(true);
          console.log("bandwidthAllocation", bandwidthAllocation);
          if (bandwidthAllocation >= MEGA_BYTES) {
            setBandwidthUnit("MB/s");
            setAllocatedBandwidth(bandwidthAllocation / MEGA_BYTES);
          } else {
            setBandwidthUnit("KB/s");
            setAllocatedBandwidth(bandwidthAllocation / KILO_BYTES);
          }
        } else {
          logger.info("[useBandwidthLimiter] No bandwidth limit configured");
          setIsEnabled(false);
        }

        setIsReady(true);
      } catch (error) {
        logger.error(
          "[useBandwidthLimiter] Failed to load bandwidth settings:",
          error
        );
        setIsReady(true);
      }
    };

    loadSettings();
  }, []);

  // Convertir bandwidth + unité en Bps et sauvegarder
  const handleBandwidthChange = useCallback(
    async (bandwidth?: number, unit?: BandwidthUnit) => {
      console.log("handleBandwidthChange", bandwidth, unit);
      try {
        if (bandwidth === undefined || unit === undefined) {
          logger.info("[useBandwidthLimiter] Clearing bandwidth limit");
          await window.App.setBandwidthAllocation(undefined);
          setAllocatedBandwidth(undefined);
          setBandwidthUnit(undefined);
          setIsEnabled(false);
          return;
        }

        const bandwidthBps = Math.floor(
          bandwidth * (unit === "KB/s" ? KILO_BYTES : MEGA_BYTES)
        );

        logger.info("[useBandwidthLimiter] Setting bandwidth limit:", {
          bandwidth,
          unit,
          bandwidthBps,
        });

        await window.App.setBandwidthAllocation(bandwidthBps);
        setAllocatedBandwidth(bandwidth);
        setBandwidthUnit(unit);
        setIsEnabled(true);
      } catch (error) {
        logger.error(
          "[useBandwidthLimiter] Failed to save bandwidth allocation:",
          error
        );
      }
    },
    []
  );

  // Toggle l'activation de la limitation
  const toggleBandwidth = useCallback(() => {
    if (isEnabled) {
      logger.info("[useBandwidthLimiter] Disabling bandwidth limit");
      handleBandwidthChange(undefined, undefined);
    } else {
      logger.info(
        "[useBandwidthLimiter] Enabling bandwidth limit with default value"
      );
      // Activer avec une valeur par défaut
      const defaultValue = 200;
      const defaultUnit: BandwidthUnit = "MB/s";
      handleBandwidthChange(defaultValue, defaultUnit);
    }
  }, [isEnabled, handleBandwidthChange]);

  return {
    allocatedBandwidth,
    bandwidthUnit,
    isEnabled,
    isReady,
    handleBandwidthChange,
    toggleBandwidth,
  };
};
