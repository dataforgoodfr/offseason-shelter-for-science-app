import { buttonVariants, leadingVariants } from "renderer/tailwind-pattern";
import { ShelterPath } from "./ShelterPath";
import { StorageShare } from "./StorageShare";
import { useSelectFolder } from "renderer/hooks/useSelectFolder";
import { useStorageShare } from "renderer/hooks/useStorageShare";
import { useCallback, useEffect, useState } from "react";
import { BandwidthLimiter, BandwidthUnit } from "./bandwidth-limiter";
import { KILO_BYTES, MEGA_BYTES, GIGA_BYTES } from "lib/electron-app/utils/units";
import { useBandwidthLimiter } from "renderer/hooks/useBandwithLimiter";

interface ShelterSetupProps {

}

export const ShelterSetup: React.FC<ShelterSetupProps> = () => {
    // ✅ Une seule instance de useSelectFolder ici
    const {
        selectedPath,
        displayedPath,
        selectFolder
    } = useSelectFolder();

    // ✅ useStorageShare utilise le selectedPath du parent
    const {
        diskSize,
        allocatedSize,
        sliderValue,
        handleSliderChange,
        isReady,
        storagePercentage,
    } = useStorageShare(selectedPath);

    const {
        allocatedBandwidth,
        bandwidthUnit,
        isEnabled,              // ✅ C'est isEnabled, pas showBandwidthLimiter
        handleBandwidthChange,   // ✅ C'est handleBandwidthChange, pas onBandwidthSelected
        toggleBandwidth,         // ✅ C'est toggleBandwidth, pas onToggle
    } = useBandwidthLimiter();


    return (
        <div className="py-[24px] px-[12px] rounded-sm gap-[20px] bg-white shadow-md">
            <div className={`${leadingVariants.textBlack} flex flex-col gap-[20px]`}>
                {/* ✅ Passer les props à ShelterPath */}
                <ShelterPath
                    selectedPath={selectedPath}
                    displayedPath={displayedPath}
                    onSelectFolder={selectFolder}
                />

                {/* ✅ Passer toutes les props nécessaires à StorageShare */}
                <StorageShare
                    selectedPath={selectedPath}
                    diskSize={diskSize}
                    allocatedSize={allocatedSize}
                    sliderValue={sliderValue}
                    onSliderChange={handleSliderChange}
                    isReady={isReady}
                    storagePercentage={storagePercentage}
                />


                {/* ✅ Bandwidth Limiter */}
                <BandwidthLimiter
                    allocatedBandwidth={allocatedBandwidth}
                    bandwidthUnit={bandwidthUnit}
                    isEnabled={isEnabled}                    // ✅ Pas showBandwidthLimiter
                    onBandwidthChange={handleBandwidthChange} // ✅ Pas onBandwidthSelected
                    onToggle={toggleBandwidth}                // ✅ Pas onToggle direct du hook
                />

            </div>
        </div>
    );
};
