import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

// import LoadingBars from "renderer/components/LoadingBars";
import WelcomeComponent from "renderer/components/WelcomeComponent";
import ShelterInitialization from "renderer/components/initializing";
import { logger } from "renderer/lib/logger";

// import { DummyDownloader } from "renderer/components/dummy-downloader";

import AboutPopup from "renderer/components/about-popup";
import LoadingBars from "renderer/components/LoadingBars";

// Header
const s4sLogoUrl = new URL('../assets/brand/logo.svg', import.meta.url).href;
const gearSixUrl = new URL('../assets/icons/gear_six.svg', import.meta.url).href;

const folderIconUrl = new URL('../assets/icons/path.svg', import.meta.url).href;
const hostingIconUrl = new URL('../assets/icons/hosting.svg', import.meta.url).href;



// The "App" comes from the context bridge in preload/index.ts
const { App } = window;

export function MainScreen() {
  const [isHosting, setIsHosting] = useState(false);

  const [isInitializing, setIsInitializing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedStoragePercentage, setSelectedStoragePercentage] = useState(50);
  const [selectedBandwidthPercentage, setSelectedBandwidthPercentage] = useState(10);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [displayedPath, setDisplayedPath] = useState<string | null>(null);
  
  const [isAboutPopupOpen, setIsAboutPopupOpen] = useState(false);

  const handleSelectFolder = async () => {
    try {
      const folder = await App.openFolderDialog();
      if (folder) {
        setSelectedPath(folder);
        setDisplayedPath(shortenPathForDisplay(folder));
        await window.App.setDownloadPath(folder); // <-- Sauvegarde dans SQLite via IPC !
        
        logger.info('Download folder selected', { 
          data: {
            path: folder
          }
        });
      }
    } catch (error) {
      logger.error('Error selecting folder', { error: error.message });
    }
  };
            

  useEffect(() => {
    // check the console on dev tools
    App.sayHelloFromBridge();
  }, []);

    useEffect(() => {
    // check the console on dev tools
   console.log("is running passe a ", isRunning)
  }, [isRunning]);

  useEffect(() => {
    window.App.getDownloadedFiles().then((downloadedFiles: any) => {
      if (downloadedFiles.length > 0) {
        console.log("Downloaded files this far:", downloadedFiles);
      } else {
        console.log("No downloaded files yet");
      }
    });
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


  const handleStartHosting = () => {
    setIsHosting(true);
    setIsInitializing(true);
    logger.info('Hosting started', { 
      downloadPath: selectedPath,
      timestamp: new Date().toISOString()
    });
  };

  const toggleAboutPopup = () => {
    setIsAboutPopupOpen(!isAboutPopupOpen);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isAboutPopupOpen && !target.closest('.about-popup') && !target.closest('.gear-icon')) {
        setIsAboutPopupOpen(false);
      }
    };

    if (isAboutPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAboutPopupOpen]);

  return (
    <div className="s4s-container relative flex w-[220px] p-4 flex-col items-start gap-0 box-border rounded-xl border border-white bg-gradient-to-t from-transparent via-transparent to-black/30 backdrop-blur-[17px] overflow-visible"
        style={{ 
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.00) 50%, rgba(0, 0, 0, 0.30) 100%), rgba(69, 126, 101, 0.75)'
        }}
    >
      {/* Header */}
      <div className="s4s-header flex justify-between items-center self-stretch">
        <img
              src={s4sLogoUrl}
              alt="S4S Logo"
              className="w-[188px] h-[20px]"
        />
        <img
          src={gearSixUrl}
          alt="Gear Six"
          className="gear-icon w-[16px] h-[16px] cursor-pointer hover:opacity-80 transition-opacity"
          onClick={toggleAboutPopup}
        />
      </div>

      {/* About Popup */}
      {isAboutPopupOpen && (
        <AboutPopup 
          onStopHosting={() => {
            setIsHosting(false);
            setIsInitializing(false);
            setIsAboutPopupOpen(false);
            setIsRunning(false);

            if (selectedPath) {
              window.App.cleanupDownloadedFiles(selectedPath);
            }
          }}
          onContactUs={() => {
            setIsAboutPopupOpen(false);
          }}
          onGoToWebsite={() => {
            setIsAboutPopupOpen(false);
          }}
        />
      )}
      
      <div className="s4s-content flex pt-[38px] flex-col items-center gap-0 self-stretch rounded-md">
  

        {!isInitializing ? (
          <>
            
            {!isRunning ? (
              <WelcomeComponent />
            ) : (
                <LoadingBars
                  downloadPath={selectedPath}
                />
            )}

            {/* Path */}
            <div 
              className="s4s-path flex justify-between items-center self-stretch px-3 py-2 rounded-full border border-white/30 opacity-100 cursor-pointer mb-[16px]"
              onClick={handleSelectFolder} 
              title={selectedPath || undefined}
              style={{
                background: "linear-gradient(0deg, #457E65, #457E65), linear-gradient(360deg, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.3) 100%)",
                width: '188px',
                height: '35px',
                color: 'rgba(0, 0, 0, 0.15)'
              }}
            >
              <div className="flex w-full">
                
                <div className=" w-full flex items-center w-full gap-2 flex-1 min-w-0">
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


            {/* Start hosting button */}
            {!isRunning && (
              <div 
                className="group w-[188px] h-12 flex items-center
                  justify-between opacity-100 rounded-[40px] px-5 py-4
                  bg-black shadow-lg relative
                  hover:bg-gradient-to-t from-[#C4FFEA] to-[#FBDF9C]
                  transition-all duration-300
                  cursor-pointer"
                style={{
                  boxShadow: '0px 6px 8px 0px #00000040'
                }}
                onClick={selectedPath ? handleStartHosting : undefined}
              >
                {selectedPath && (
                <div 
                  className="absolute inset-0 rounded-[40px] p-1"
                >
                  <div className="w-full h-full bg-black rounded-[36px]"></div>
                </div>
                )}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <span className="text-akz-gro text-sm text-white">
                    {selectedPath ? "Start hosting" : "Select path first"}
                  </span>
                  <img
                    src={hostingIconUrl}
                    alt="Download"
                    className="w-[16px] h-[16px] aspect-square"
                  />
                </div>
              </div>
            )}
            

            {/* Dummy downloader 
            <DummyDownloader downloadPath={selectedPath || ""} />*/}
          </>
        ) : (
          <ShelterInitialization 
            selectedPath={selectedPath}
            setIsRunning={setIsRunning}
            setIsInitializing={setIsInitializing}
          />
          
        )}

        
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
