interface LoadingBarsProps {
  progress: number;
  currentStatus: 'downloading now' | 'uploading';
  totalBars?: number;
}

export default function LoadingBars({ 
  progress,
  currentStatus,
  totalBars = 10,
}: LoadingBarsProps) {
  return (
    <div className="w-[188px] h-[96px] flex flex-col items-center gap-6 py-4 mb-[39px]">
      <div className="w-[166px] h-8 flex justify-center items-center">
        <span
          className="uppercase text-white font-normal text-[46px] leading-none tracking-[-0.1em]"
          style={{
            fontFamily: "LT Railway",
            fontStyle: "normal",
          }}
        >
          Running
        </span>
      </div>

      <div className="w-[188px] h-2 flex items-center justify-center gap-2">
        <span
          className="h-2 uppercase text-white font-normal text-[11px] tracking-[0.1em] leading-none flex items-center justify-center whitespace-nowrap"
          style={{
            fontFamily: "Akzidenz-Grotesk Pro",
          }}
        >
          {currentStatus}
        </span>

        <div className="flex w-[55px] h-[7px] gap-[2px] items-center justify-between">
          {Array.from({ length: totalBars }).map((_, index) => (
            <div
              key={index}
              className="h-[7px] transition-colors duration-200 border"
              style={{
                borderColor: index < progress ? "#FFFFFF" : "#FFFFFF66",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
