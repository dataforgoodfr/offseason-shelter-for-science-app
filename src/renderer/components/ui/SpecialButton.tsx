interface SpecialButtonProps {
    text: string;
    icon?: string;
    onClick: () => void;
}

export const SpecialButton: React.FC<SpecialButtonProps> = ({ text, icon, onClick }) => {
    return (
        <div
            className="rounded-[40px] p-1 bg-gradient-to-r from-[#C4FFEA] to-[#FBDF9C]"
            style={{
                boxShadow: "0px 6px 8px 0px #00000040",
            }}
        >
            <button
                className="h-full w-full rounded-[36px] bg-black flex items-center justify-between px-4 py-[13px] pl-5 text-white cursor-pointer"
                onClick={onClick}
            >
                <span style={{ fontFamily: "Akzidenz-Grotesk Pro", fontWeight: 400, fontSize: '14px' }}>
                    {text}
                </span>
                {/* Icon can be added here if needed */}
                {icon && <img src={icon} alt="icon" className="w-[16px] h-[16px]" />}
            </button>
        </div>
    );
};
