import { leadingVariants } from "renderer/tailwind-pattern";
import { ShelterPath } from "./ShelterPath";
import { StorageShare } from "./StorageShare";
import { useSelectFolder } from "renderer/hooks/useSelectFolder";
import { useStorageShare } from "renderer/hooks/useStorageShare";

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
            </div>
        </div>
    );
};
