import { leadingVariants } from "renderer/tailwind-pattern";
import { SelectPath } from "./SelectPath";

interface ShelterSetupProps {
    text: string;
    icon?: string;
    onClick: () => void;
}

export const ShelterSetup: React.FC<ShelterSetupProps> = ({ text, icon, onClick }) => {
    return (
        <div className="py-[24px] px-[12px] rounded-sm gap-[20px] bg-white shadow-md">
            <div className={`${leadingVariants.textBlack} gap-[12px]`}>
                <p>Shelter path</p>
            </div>
            <SelectPath displayedPath="/user/username/shelter" selectedPath="" handleSelectFolder={onClick} />

        </div>
    );
};
