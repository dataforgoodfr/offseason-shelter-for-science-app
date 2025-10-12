import { leadingVariants } from "renderer/tailwind-pattern";
import { ShelterPath } from "./ShelterPath";
import { StorageShare } from "./StorageShare";

interface ShelterSetupProps {

}

export const ShelterSetup: React.FC<ShelterSetupProps> = () => {
    return (
        <div className="py-[24px] px-[12px] rounded-sm gap-[20px] bg-white shadow-md">
            <div className={`${leadingVariants.textBlack} flex flex-col gap-[20px]`}>
                <ShelterPath />
                <StorageShare />
            </div>
        </div>
    );
};
