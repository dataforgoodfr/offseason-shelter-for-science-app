import { GIGA_BYTES } from "lib/electron-app/utils/units";
import { useState, useCallback } from "react";
import { logger } from "renderer/lib/logger";

interface StorageSelectorProps {
  onStorageSelected: (storageAmount: number) => void;
  defaultSelection?: number; // in GB
}

const STORAGE_OPTIONS = [
  { label: "1 GB", value: 1 },
  { label: "5 GB", value: 5 },
  { label: "10 GB", value: 10 },
  { label: "25 GB", value: 25 },
  { label: "50 GB", value: 50 },
  { label: "100 GB", value: 100 },
];

export default function StorageSelector({
  onStorageSelected,
  defaultSelection = 10
}: StorageSelectorProps) {
  const [selectedStorage, setSelectedStorage] = useState<number>(defaultSelection);
  const [customValue, setCustomValue] = useState<string>("");

  const updateStorageValue = useCallback((storageGB: number) => {
    setSelectedStorage(storageGB);
    onStorageSelected(storageGB);

    // Send value to main process
    window.App.setStorageAllocation(storageGB * GIGA_BYTES);
  }, [onStorageSelected]);

  const handleStorageSelection = useCallback((storageGB: number) => {
    updateStorageValue(storageGB);
    setCustomValue("");
  }, [updateStorageValue]);

  const handleCustomSubmit = useCallback(() => {
    const customGB = parseFloat(customValue);
    if (isNaN(customGB) || customGB <= 0) {
      logger.error('Invalid custom storage value', {
        data: { customValue }
      });
      return;
    }

    updateStorageValue(customGB);
  }, [customValue, updateStorageValue]);

  return (
    <div className="flex flex-col items-center gap-4 w-full p-6 bg-[hsla(154,29%,32%,1)] rounded-2xl border border-white/30">
      {/* Title */}
      <span
        className="text-white text-center text-lg font-medium leading-none tracking-tight"
        style={{
          fontFamily: 'Akzidenz-Grotesk Pro',
          letterSpacing: '-1%'
        }}
      >
        Select Shelter Size
      </span>

      {/* Storage options grid */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-full">
        {STORAGE_OPTIONS.map((option) => {
          const isDisabled = false;
          const isSelected = selectedStorage === option.value;

          return (
            <button
              key={option.value}
              onClick={() => !isDisabled && handleStorageSelection(option.value)}
              disabled={isDisabled}
              className={`
                h-8 px-3 py-1 rounded-md border transition-all duration-200
                flex items-center justify-center
                text-xs font-normal
                ${isSelected
                  ? 'border-white bg-white/10 text-white'
                  : isDisabled
                    ? 'border-white/20 text-white/30 cursor-not-allowed'
                    : 'border-white/30 text-white/80 hover:border-white/50 hover:bg-white/5 cursor-pointer'
                }
              `}
              style={{
                fontFamily: 'Akzidenz-Grotesk Pro'
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Custom input section */}
      <div className="flex flex-col items-center gap-2 w-full">
        <span className="text-white text-xs font-normal leading-normal text-center mb-0"
          style={{
            fontFamily: 'Akzidenz-Grotesk Pro',
            fontSize: '10px',
          }}
        >
          Custom Size
        </span>
        {(
          <div className="flex items-center gap-2 w-full max-w-full">
            <div className="flex-1 relative">
              <input
                type="number"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="?"
                className="w-full h-8 px-3 py-1 rounded-md border border-white/30 
                         bg-transparent text-white text-xs
                         placeholder-white/40 focus:border-white/50 focus:outline-none"
                style={{
                  fontFamily: 'Akzidenz-Grotesk Pro'
                }}
                min="0.1"
                step="0.1"
                max={100}
              />
            </div>
            <button
              onClick={handleCustomSubmit}
              disabled={!customValue || parseFloat(customValue) <= 0}
              className="h-8 px-2 py-0.5 rounded-md border border-white/30 
                       text-white/80 text-[10px] hover:border-white/50 hover:bg-white/5 
                       transition-all duration-200 cursor-pointer
                       disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                fontFamily: 'Akzidenz-Grotesk Pro'
              }}
            >
              Set
            </button>
            <button
              onClick={() => {
                setCustomValue("");
              }}
              className="h-8 px-2 py-0.5 rounded-md border border-white/30 
                       text-white/60 text-[10px] hover:border-white/50 hover:bg-white/5 
                       transition-all duration-200 cursor-pointer"
              style={{
                fontFamily: 'Akzidenz-Grotesk Pro'
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
