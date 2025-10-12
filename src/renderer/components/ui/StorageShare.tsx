import type React from "react";
import { useSelectFolder } from "renderer/hooks/useSelectFolder";

interface StorageShareProps {
    className?: string;
}

export const StorageShare: React.FC<StorageShareProps> = ({
    className = ""
}) => {
    return (
        <div className={className}>
            <div className="flex flex-col gap-[12px]">
                <div className="flex justify-between items-center">
                    <p className="capitalize font-semibold">Storage share</p>
                    <div className="bg-[#F1F3F2] px-[8px] py-[6px] rounded-sm">50 GO</div>
                </div>
                <div
                    className={`w-full bg-[#F1F3F2] hover:bg-[#E1E3E2] transition duration-200 rounded-md px-[8px] py-[11px] cursor-pointer ${className}`}
                >
                    <div className="">

                    </div>
                </div>
            </div>
        </div>
    );
};
