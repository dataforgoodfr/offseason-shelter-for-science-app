import { buttonVariants } from "renderer/tailwind-pattern";

interface SelectPathProps {
    displayedPath: string;
    selectedPath: string;
    handleSelectFolder: () => void;
}

const folderIconUrl = new URL('../assets/icons/path.svg', import.meta.url).href;

export const SelectPath: React.FC<SelectPathProps> = ({ displayedPath, selectedPath, handleSelectFolder }) => {
    return (
        < div >
            < button
                className={buttonVariants.primary}
                onClick={handleSelectFolder}
                title={selectedPath || undefined
                }
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img
                        src={folderIconUrl}
                        alt="Path selection"
                        className="w-[16px] h-[16px] aspect-square flex-shrink-0"
                    />
                    <span className="text-akz-gro text-xs truncate">
                        {selectedPath ? displayedPath : "Choose path..."}
                    </span>
                </div>

                {/* Only visible if path is already set */}
                {
                    selectedPath && (
                        <div className="h-[19px] flex items-center justify-center rounded-full py-1.5 px-1.5 bg-[#737372] flex-shrink-0 ml-2">
                            <span className="text-akz-gro text-[10px] font-medium text-white">
                                Change
                            </span>
                        </div>
                    )
                }
            </button >
        </div >
    );
};
