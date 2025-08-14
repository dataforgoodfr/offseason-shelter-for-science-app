import { useState, useEffect } from 'react';

export default function LoadingBars() {
  const [progress, setProgress] = useState(0);
  const totalBars = 10;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= totalBars) {
          return 0; // Reset pour boucler
        }
        return prev + 1;
      });
    }, 200); // Change toutes les 200ms

    return () => clearInterval(interval);
  }, []);

  return (

    <div
        className="w-[188px] h-[96px] flex flex-col items-center gap-[24px] pt-[16px] pb-[16px] opacity-100 "
        style={{ transform: "rotate(0deg)" }}
    >
        
        <div
            className="w-[166px] h-[32px] flex justify-center items-center opacity-100 uppercase text-white font-normal text-[46px] leading-[100%] tracking-[-0.1em]"
            style={{ 
            transform: "rotate(0deg)",
            fontFamily: "LT Railway",
            fontStyle: "normal" 
            }}
        >
            <span>
            Running
            </span>
        </div>

        <div
            className="w-[188px] h-[8px] flex items-center justify-between opacity-100"
            style={{ transform: "rotate(0deg)" }}
            >
                <span
                className="w-[133px] h-[8px] uppercase text-white font-normal text-[11px] font-normal uppercase tracking-[0.1em] leading-[100%] text-center text-white"
                style={{ fontFamily: "Akzidenz-Grotesk Pro" }}
                >
                Downloading now
                </span>



            <div 
            className="flex opacity-100 w-[50px] h-[7px] gap-[2px] items-center justify-between" >
            {Array.from({ length: totalBars }).map((_, index) => (
                <div
                key={index}
                className="h-[7px] transition-colors duration-200"
                style={{
                    width: '0px',
                    borderWidth: '1px',
                    border: index < progress ? '1px solid #FFFFFF' : '1px solid #FFFFFF66',
                    opacity: 1
                }}
                />
            ))}
            </div>

        </div>
    </div>


  );
}