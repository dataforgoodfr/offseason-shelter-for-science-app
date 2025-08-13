import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

// Header
const s4sLogoUrl = new URL('../assets/brand/logo.svg', import.meta.url).href;
const gearSixUrl = new URL('../assets/icons/gear_six.svg', import.meta.url).href;

const folderIconUrl = new URL('../assets/icons/path.svg', import.meta.url).href;
const hostingIconUrl = new URL('../assets/icons/hosting.svg', import.meta.url).href;

// The "App" comes from the context bridge in preload/index.ts
const { App } = window;

export function MainScreen() {
  useEffect(() => {
    // check the console on dev tools
    App.sayHelloFromBridge();
  }, []);

  function shortenPathForDisplay(path: string) {
    return '.../' + path.split('/').slice(-1)[0];
  }

  useEffect(() => {
    window.App.getDownloadPath().then((path) => {
    if (path) {
      setSelectedPath(path);
      setDisplayedPath(shortenPathForDisplay(path));
    }
    });
  }, []);

  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedStoragePercentage, setSelectedStoragePercentage] =
    useState(50);
  const [selectedBandwidthPercentage, setSelectedBandwidthPercentage] =
    useState(10);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Shortened path for display
  const [displayedPath, setDisplayedPath] = useState<string | null>(null);

  // const [isPaused, setIsPaused] = useState(false);

  const handleSelectFolder = async () => {
    const folder = await App.openFolderDialog();
    if (folder) {
      setSelectedPath(folder);
      setDisplayedPath(shortenPathForDisplay(folder));
      await window.App.setDownloadPath(folder); // <-- Sauvegarde dans SQLite via IPC !
    }
  };

  return (
    <div className="flex w-[220px] p-4 flex-col items-start gap-0 box-border rounded-xl border border-white bg-gradient-to-t from-transparent via-transparent to-black/30 backdrop-blur-[17px] overflow-hidden"
        style={{ 
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.00) 50%, rgba(0, 0, 0, 0.30) 100%), rgba(69, 126, 101, 0.75)'
        }}
    >
      {/* Header */}
      <div className="flex justify-between items-center self-stretch">
        <img
              src={s4sLogoUrl}
              alt="S4S Logo"
              className="w-[188px] h-[20px]"
        />
        <img
          src={gearSixUrl}
          alt="Gear Six"
          className="w-[16px] h-[16px]"
        />
      </div>
      
      <div className="flex pt-[38px] flex-col items-center gap-0 self-stretch rounded-md">
  

        {/* le composant de Bienvenu, je vais le mettre dans un composant partageabe pourqu'il soit appelle de facons dynamique avec le composant de RUNNING */}
        <div className="flex pt-0 flex-col items-center gap-0 self-stretch">
          <span className="w-[166px] h-9 opacity-100 font-medium text-lg leading-none text-center text-white tracking-tight"
            style={{ 
              fontFamily: 'Akzidenz-Grotesk Pro',
              letterSpacing: '-1%'
            }}
          >
            Thanks for joining the rescue network!
          </span>
          <span className="mt-4 mb-4 text-white text-center text-xs font-normal leading-normal"
            style={{ 
              fontFamily: 'Akzidenz-Grotesk Pro',
              letterSpacing: '-0.12px'
            }}
          >
            Choose where you'll host the data:
          </span>
        </div>


      {/* REPRESENTE LE COMPOSANT RUNNING , IL SERA MIS DANS UN AUTRE COMPONENT ET APPELLE LORSQUE LE RUNNING SERA ACTIVE  */}
     
        {/* <div
              className="w-[188px] h-[89px] flex flex-col gap-6 pt-4 pb-4 opacity-100"
              style={{ transform: "rotate(0deg)" }}
            >
              
              
              <div
                className="w-[166px] h-[32px] flex items-center opacity-100"
                style={{ transform: "rotate(0deg)" }}
              >
              <span
                className="uppercase text-white font-normal  leading-[100%] tracking-[-0.1em]"
                style={{
                  fontFamily: "LT Railway",
                  fontSize: "46px",
                }}
              >
                Running
              </span>
          </div>



        <div
          className="w-[188px] h-[8px] flex justify-between opacity-100"
          style={{ transform: "rotate(0deg)" }}
        >
          <div
          className="w-[132px] h-[8px] flex items-center justify-center opacity-100"
          style={{ transform: "rotate(0deg)" }}
        >
          <span
            className="text-[11px] font-normal uppercase tracking-[0.1em] leading-[100%] text-center text-white"
            style={{ fontFamily: "Akzidenz-Grotesk Pro" }}
          >
            Downloading now
          </span>
        </div>
        </div>


        </div> */}


        {/* Path */}
        <div 
          // id="path-selection-frame" 
          className="flex justify-between items-center self-stretch px-3 py-2 rounded-full border border-white/30 opacity-100 cursor-pointer mb-[16px]"
          onClick={handleSelectFolder} 
          title={selectedPath || undefined}
          style={{
            background: "linear-gradient(0deg, #457E65, #457E65), linear-gradient(360deg, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.3) 100%)",
            width: '188px',
            height: '35px',
            color: 'rgba(0, 0, 0, 0.15)'
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img
                src={folderIconUrl}
                alt="Path selection"
                className="w-[16px] h-[16px] aspect-square flex-shrink-0"
              />
              <span className="text-akz-gro text-xs truncate">
                {selectedPath ? displayedPath : "Choose path..."}
              </span>
            </div>
            
            {/* Only visible if path is already set */}
            {selectedPath && (
              <div 
                className="w-[43px] h-[19px] flex items-center justify-center rounded-full py-1.5 px-1 bg-[#737372] flex-shrink-0"
              >
                <span className="text-akz-gro text-[10px] font-medium text-white">
                  Change
                </span>
              </div>
            )}

          </div>     
        </div>

        <div 
          className="w-[188px] h-12 flex items-center justify-between opacity-100 rounded-[40px] px-5 py-4 bg-black shadow-lg relative"
          style={{
            boxShadow: '0px 6px 8px 0px #00000040'
          }}
        >
          <div 
            className="absolute inset-0 rounded-[40px] p-1"
            style={{
              background: 'linear-gradient(89.51deg, #C4FFEA 26.3%, #FBDF9C 62.27%)'
            }}
          >
            <div className="w-full h-full bg-black rounded-[36px]"></div>
          </div>
          <div className="relative z-10 flex items-center justify-between w-full">
            <span className="text-akz-gro text-sm text-white">
              Start hosting
            </span>
            <img
              src={hostingIconUrl}
              alt="Download"
              className="w-[16px] h-[16px] aspect-square"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="w-[188px] h-[32px] flex items-center gap-2 pt-2 opacity-80 justify-center"
        style={{ transform: "rotate(0deg)" }}
      >
        <span
          className="text-[9px] text-white font-normal uppercase tracking-[0.1em] leading-[100%] text-center align-middle"
          style={{ fontFamily: "Akzidenz-Grotesk Pro" }}
        >
          made with ♡ by the data for good community
        </span>
      </div>

    </div>
  );
}
