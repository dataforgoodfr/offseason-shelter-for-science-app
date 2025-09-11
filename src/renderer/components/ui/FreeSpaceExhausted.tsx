import { leadingVariants } from "renderer/tailwind-pattern";

const stopIconUrl = new URL('../../assets/icons/stop.svg', import.meta.url).href;

interface FreeSpaceExhaustedProps {
  onRetry?: () => void;
  onSelectNewPath?: () => void;
}

const FreeSpaceExhausted = (/*{ onRetry, onSelectNewPath }: FreeSpaceExhaustedProps*/) => {
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
          <span className="text-red-400">
            Storage space
            <br />
            exhausted
          </span>
        </span>
      </div>

      {/* Error icon */}
      <div className="flex items-center justify-center mb-4">
        <img
          src={stopIconUrl}
          alt="Stop"
          className="w-[32px] h-[32px] opacity-80"
        />
      </div>

      {/* Error message */}
      <div className="w-full max-w-[280px] text-center mb-6">
        <p
          className="text-[11px] font-normal text-white/80 leading-relaxed"
          style={{ fontFamily: "Akzidenz-Grotesk Pro" }}
        >
          The allocated storage space has been fully used.
        </p>
      </div>
    </div>
  );
};

export default FreeSpaceExhausted;