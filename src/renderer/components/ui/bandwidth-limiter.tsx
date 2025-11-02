// renderer/components/BandwidthLimiter.tsx
import type React from "react";
import { useState, useEffect } from "react";

export type BandwidthUnit = 'KB/s' | 'MB/s';

interface BandwidthLimiterProps {
  allocatedBandwidth: number | undefined;
  bandwidthUnit: BandwidthUnit | undefined;
  isEnabled: boolean;
  onBandwidthChange: (bandwidth?: number, unit?: BandwidthUnit) => void;
  onToggle: () => void;
  className?: string;
}

export const BandwidthLimiter: React.FC<BandwidthLimiterProps> = ({
  allocatedBandwidth,
  bandwidthUnit,
  isEnabled,
  onBandwidthChange,
  onToggle,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<BandwidthUnit>("MB/s");

  // Initialiser les valeurs depuis les props
  useEffect(() => {
    if (allocatedBandwidth !== undefined && bandwidthUnit !== undefined) {
      console.log("Setting initial values:", allocatedBandwidth, bandwidthUnit);
      setInputValue(allocatedBandwidth.toString());
      setSelectedUnit(bandwidthUnit);
    }
  }, [allocatedBandwidth, bandwidthUnit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Accepter uniquement les nombres
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleUnitToggle = () => {
    const newUnit = selectedUnit === "MB/s" ? "KB/s" : "MB/s";
    setSelectedUnit(newUnit);

    // Si une valeur est déjà entrée, notifier le changement
    if (inputValue && isEnabled) {
      onBandwidthChange(parseFloat(inputValue), newUnit);
    }
  };

  const handleConfirm = () => {
    if (isEnabled && inputValue) {
      const bandwidth = parseFloat(inputValue);
      if (!isNaN(bandwidth) && bandwidth > 0) {
        onBandwidthChange(bandwidth, selectedUnit);
      }
    }
  };

  const handleToggle = () => {
    if (isEnabled) {
      // Désactiver : réinitialiser
      onBandwidthChange(undefined, undefined);
      setInputValue("");
    }
    onToggle();
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-[12px]">
        {/* Header avec toggle */}
        <div className="flex justify-between items-center">
          <p className="capitalize font-semibold">Limit Bandwidth Used</p>
          <button
            onClick={handleToggle}
            className={`w-[20px] h-[20px] rounded-sm flex items-center justify-center transition-colors ${isEnabled
              ? "bg-[#EDE8B0]"
              : "bg-gray-100"
              }`}
          >
            {isEnabled && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Input avec unité */}
        {isEnabled && (
          <div className="bg-[#F1F3F2] rounded-md px-[4px] py-[8px] flex items-center gap-1">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleConfirm}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur(); // Déclenche onBlur qui appelle handleConfirm
                }
              }}
              className="w-1/2 bg-transparent text-[12px] outline-none text-right placeholder:opacity-60"
              placeholder="100"
              disabled={!isEnabled}
            />
            <button
              onClick={handleUnitToggle}
              className="w-1/2 text-[11px] text-gray-700 hover:text-gray-900 text-left"
              disabled={!isEnabled}
            >
              {selectedUnit}
            </button>
          </div>

        )}
      </div>
    </div>
  );
};
