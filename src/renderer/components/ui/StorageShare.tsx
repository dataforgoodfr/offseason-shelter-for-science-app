// renderer/components/StorageShare.tsx
import type React from "react";
import { useEffect } from "react";

interface StorageShareProps {
    className?: string;
    onStoragePercentageChange?: (percentage: number) => void;
    selectedPath: string | null;
    diskSize: number | null;
    allocatedSize: number | null;
    sliderValue: number;
    onSliderChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isReady: boolean;
    storagePercentage: number;
}

export const StorageShare: React.FC<StorageShareProps> = ({
    className = "",
    onStoragePercentageChange,
    selectedPath,
    diskSize,
    allocatedSize,
    sliderValue,
    onSliderChange,
    isReady,
    storagePercentage,
}) => {
    // Notifier le parent du changement de pourcentage
    useEffect(() => {
        if (onStoragePercentageChange) {
            onStoragePercentageChange(storagePercentage);
        }
    }, [storagePercentage, onStoragePercentageChange]);

    return (
        <div className={className}>
            <div className="flex flex-col gap-[4px]">
                <div className="flex justify-between items-center">
                    <p className="capitalize font-semibold">Storage share</p>
                    <div className="bg-[#F1F3F2] min-w-[54px] text-center px-[8px] py-[6px] rounded-sm">
                        {diskSize ? `${allocatedSize} Go` : "-"}
                    </div>
                </div>
                <div
                    className="w-full bg-[#F1F3F2] h-[32px] flex items-center transition duration-200 rounded-md px-[8px] py-[11px] cursor-pointer"
                >
                    {/* Slider simple comme dans l'image */}
                    <div className="flex flex-1">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            disabled={!isReady}
                            value={sliderValue}
                            onChange={onSliderChange}
                            className="flex-1 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer storage-slider"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
