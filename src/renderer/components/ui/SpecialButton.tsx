interface SpecialButtonProps {
    text: string;
    disabled?: boolean;
    icon?: string;
    iconDisabled?: string;
    onClick: () => void;
}

export const SpecialButton: React.FC<SpecialButtonProps> = ({
    text,
    icon,
    iconDisabled,
    onClick,
    disabled,
}) => {
    disabled = disabled ?? false;
    iconDisabled = iconDisabled ?? icon;
    return !disabled ? (
        <div
            className="rounded-[40px] p-1 bg-[#4C4C4C] hover:bg-gradient-to-r hover:from-[#C4FFEA] hover:to-[#FBDF9C] transition-all duration-300"
            style={{
                boxShadow: "0px 6px 8px 0px #00000040",
            }}
        >

            <button
                className="h-full w-full rounded-[36px] bg-black flex items-center justify-between px-4 py-[13px] pl-5 text-white cursor-pointer"
                onClick={onClick}
            >
                <span
                    style={{
                        fontFamily: "Akzidenz-Grotesk Pro",
                        fontWeight: 400,
                        fontSize: "14px",
                    }}
                >
                    {text}
                </span>
                {/* Icon can be added here if needed */}
                {icon && <img src={icon} alt="icon" className="w-[16px] h-[16px]" />}
            </button>
        </div>
    ) : (
        <div className="rounded-[40px] p-1 border-2 border-[#315A48] text-black">
            <div className="h-full w-full rounded-[36px] flex iatems-center justify-between px-4 py-[13px] pl-5 cursor-pointer">
                <span
                    style={{
                        fontFamily: "Akzidenz-Grotesk Pro",
                        fontWeight: 400,
                        fontSize: "14px",
                    }}
                >

                    {text}
                </span>
                {iconDisabled && <img src={iconDisabled} alt="icon" className="w-[16px] h-[16px]" />}
            </div>
        </div>
    );
};
