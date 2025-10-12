// ShelterPath.tsx
import type React from "react";

interface ShelterPathProps {
    selectedPath?: string | null;
    displayedPath?: string | null;
    onSelectFolder: () => void; // Changez le type
    className?: string;
}

const folderIconUrl = new URL('../../assets/icons/path.svg', import.meta.url).href;

function shortenPathForDisplay(path: string): string {
    if (process.platform === "win32") {
        return `...\\${path.split("\\").slice(-1)[0]}`;
    }
    return `.../${path.split("/").slice(-1)[0]}`;
}

export const ShelterPath: React.FC<ShelterPathProps> = ({
    selectedPath,
    displayedPath: propDisplayedPath,
    onSelectFolder,
    className = ""
}) => {
    // ✅ N'utilisez PLUS le hook ici, utilisez uniquement les props
    const displayedPath = propDisplayedPath ?? (selectedPath ? shortenPathForDisplay(selectedPath) : null);

    const handleSelectFolder = async () => {
        if (onSelectFolder) {
            onSelectFolder();
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
        </div>
    );
};
