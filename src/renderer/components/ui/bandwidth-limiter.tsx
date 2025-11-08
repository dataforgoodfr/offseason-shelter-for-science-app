import { useCallback, useState } from "react";
import { selectOptionVariants } from "renderer/tailwind-pattern";

interface BandwidthLimiterProps {
    onBandwidthSelected: (bandwidthGB?: number, bandwidthUnit?: BandwidthUnit) => void;
    defaultValue?: number;
    defaultUnit?: string;
}

export type BandwidthUnit = 'KB/s' | 'MB/s' | undefined;

const DEFAULT_VALUE = 1;

/**
 * Bandwidth limiter component
 * 
 * Modes :
 * - None : No limit
 * - Limit : Limit the bandwidth
 */
export function BandwidthLimiter({ onBandwidthSelected, defaultValue, defaultUnit }: BandwidthLimiterProps) {
    const [value, setValue] = useState<number | undefined>(defaultValue || DEFAULT_VALUE);
    const [unit, setUnit] = useState<BandwidthUnit>(defaultUnit as BandwidthUnit || undefined);
  
    const isLimited = unit !== undefined;

    const handleValueSelected = useCallback((bandwidth?: number) => {
        setValue(bandwidth || DEFAULT_VALUE);
        onBandwidthSelected(bandwidth, unit);
    }, [onBandwidthSelected, unit]);

    const handleUnitSelected = useCallback((unit?: BandwidthUnit) => {
        setUnit(unit);
        onBandwidthSelected(value, unit);
    }, [onBandwidthSelected, value]);
  
    return (
      <div className="flex flex-col items-center gap-3 w-full p-6 bg-[hsla(154,29%,32%,1)] rounded-2xl border border-white/30">
        {/* Title */}
        <span
          className="text-white text-center text-lg font-medium leading-none tracking-tight"
          style={{
            fontFamily: 'Akzidenz-Grotesk Pro',
            letterSpacing: '-1%'
          }}
        >
          Bandwidth Limit
        </span>

        {/* Inputs */}
        <div className="flex items-center gap-2 w-full max-w-full">
          <div className="flex-1 relative">
            <input
              type="number"
              value={!isLimited ? '∞' : value}
              onChange={(e) => handleValueSelected(e.target.valueAsNumber || DEFAULT_VALUE)}
              placeholder={isLimited ? '?' : '∞'}
              className={`w-full h-8 px-3 py-1 rounded-md border text-xs bg-transparent
                ${isLimited
                  ? 'border-white/30 text-white placeholder-white/40 focus:border-white/50 focus:outline-none'
                  : 'border-white/20 text-white/40 placeholder-white/30 cursor-not-allowed'}`}
              style={{ fontFamily: 'Akzidenz-Grotesk Pro' }}
              min="0.1"
              step="0.1"
              disabled={!isLimited}
            />
          </div>
  
          {/* Unit selector */}
          <div className="flex items-center gap-1">
            <select
              value={unit}
              onChange={(e) => handleUnitSelected(e.target.value !== 'None' ? e.target.value as BandwidthUnit : undefined)}
              className={`h-8 px-2 py-0.5 rounded-md border text-[10px] transition-all duration-200
                ${isLimited ? 'border-white bg-white/10 text-white' : 'border-white/30 text-white/80 hover:border-white/50 hover:bg-white/5'}
              `}
            >
              <option className={selectOptionVariants.option} value="None">None</option>
              <option className={selectOptionVariants.option} value="KB/s">KB/s</option>
              <option className={selectOptionVariants.option} value="MB/s">MB/s</option>
            </select>
          </div>
        </div>
      </div>
    );
}