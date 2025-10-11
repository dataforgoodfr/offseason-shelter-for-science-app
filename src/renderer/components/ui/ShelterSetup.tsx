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
            <div className={`${leadingVariants.textBlack} flex flex-col gap-[12px]`}>
                <p>Shelter path</p>
                <SelectPath />
            </div>

        </div>
    );
};
