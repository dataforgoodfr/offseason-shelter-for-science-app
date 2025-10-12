import type React from "react";
import { useSelectFolder } from "renderer/hooks/useSelectFolder";

interface ShelterPathProps {
    displayedPath?: string;
    onPathSelected?: (path: string) => void;
    className?: string;
}

const folderIconUrl = new URL('../../assets/icons/path.svg', import.meta.url).href;

export const ShelterPath: React.FC<ShelterPathProps> = ({
    displayedPath: propDisplayedPath,
    onPathSelected,
    className = ""
}) => {
    const hook = useSelectFolder();

    // Utilise les props si fournies, sinon utilise le hook
    const selectedPath = hook.selectedPath;
    const displayedPath = propDisplayedPath ?? hook.displayedPath;

    const handleSelectFolder = async () => {
        await hook.selectFolder();
        if (hook.selectedPath && onPathSelected) {
            onPathSelected(hook.selectedPath);
        }
    };

    return (
        <div className={className}>
            <div className="flex flex-col gap-[12px]">
                <p className="capitalize font-semibold">Shelter path</p>
                <button
                    className={`w-full bg-[#F1F3F2] hover:bg-[#E1E3E2] transition duration-200 rounded-md px-[8px] py-[11px] cursor-pointer ${className}`}
                    onClick={handleSelectFolder}
                    title={selectedPath || undefined}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                            src={folderIconUrl}
                            alt="Path selection"
                            className="w-[16px] h-[16px] aspect-square flex-shrink-0 text-black"
                        />
                        <span className="text-xs truncate text-black">
                            {selectedPath ? displayedPath : <span className="opacity-60">Select path</span>}
                        </span>
                    </div>
                </button>
            </div>
        </div >
    );
};
