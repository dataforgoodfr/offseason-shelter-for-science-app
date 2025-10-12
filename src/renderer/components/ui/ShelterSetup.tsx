import { leadingVariants } from "renderer/tailwind-pattern";
import { ShelterPath } from "./ShelterPath";
import { StorageShare } from "./StorageShare";
import { useSelectFolder } from "renderer/hooks/useSelectFolder";
import { useEffect } from "react";

interface ShelterSetupProps {

}

export const ShelterSetup: React.FC<ShelterSetupProps> = () => {
    const { selectedPath, displayedPath, selectFolder } = useSelectFolder();

    useEffect(() => {
        console.log("ShelterSetup selectedPath:", selectedPath);
    }, [selectedPath]);
    return (
        <div className="py-[24px] px-[12px] rounded-sm gap-[20px] bg-white shadow-md">
            <div className={`${leadingVariants.textBlack} flex flex-col gap-[20px]`}>
                <ShelterPath
                    selectedPath={selectedPath}
                    displayedPath={displayedPath}
                    onSelectFolder={selectFolder}
                />

                <StorageShare selectedPath={selectedPath} />
            </div>
        </div>
    );
};
