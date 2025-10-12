import { leadingVariants } from "renderer/tailwind-pattern";
import { buttonVariants } from "renderer/tailwind-pattern";
import { ShelterPath } from "./ShelterPath";

const checkMarkIconUrl = new URL('../../assets/icons/check_mark.svg', import.meta.url).href;

interface FreeSpaceExhaustedProps {
  onAllocateMoreSpace?: () => void;
  onSelectNewPath: () => void;
}

const FreeSpaceExhausted = ({ onAllocateMoreSpace, onSelectNewPath }: FreeSpaceExhaustedProps) => {
  return (
    <div className="w-full h-[190px] gap-[48px] pt-[16px] flex flex-col items-center">
      {/* Title */}
      <div
        className="w-[200px] h-[36px] flex items-center justify-center opacity-100"
        style={{ transform: "rotate(0deg)" }}
      >
        <span
          className={leadingVariants.title}
          style={{
            fontFamily: "Akzidenz-Grotesk Pro",
            fontSize: "18.57px",
            letterSpacing: '-1%'
          }}
        >
          <span className="text-yellow-400">
            Storage space fully used.
            <br />
            Thank you for your support !
          </span>
        </span>
      </div>

      {/* Icon */}
      <div className="flex items-center justify-center mb-4">
        <img
          src={checkMarkIconUrl}
          alt="Stop"
          className="w-[32px] h-[32px] opacity-80"
        />
      </div>

      <div className="w-full max-w-[280px] text-center mb-6">
        {/* Actions */}
        <div className="flex flex-col gap-2 items-center">
          <button
            onClick={onAllocateMoreSpace}
            className={`${buttonVariants.primary} justify-center`}
          >
            <div className="h-[19px] flex items-center justify-center rounded-full py-1.5 px-1.5 bg-[#737372] flex-shrink-0">
              <span className="text-akz-gro text-[10px] font-medium text-white">
                Share more space
              </span>
            </div>
          </button>

          {/* Utilisation du composant SelectPath */}
          <ShelterPath
            onSelectFolder={onSelectNewPath}
          />
        </div>
      </div>
    </div>
  );
};

export default FreeSpaceExhausted;