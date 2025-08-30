import { useEffect, useState, useCallback } from "react";
import WelcomeComponent from "renderer/components/WelcomeComponent";
import ShelterInitialization from "renderer/components/initializing";
import { logger } from "renderer/lib/logger";
import AboutPopup from "renderer/components/about-popup";
import { GIGA_BYTES } from "../../lib/electron-app/utils/units";

// broija 2025/08/25 : dissociated download logic from graphic features
import LoadingBars from "renderer/components/LoadingBarsDisplay";
import { useDownloadManager, DownloadManager } from "renderer/hooks/useDownloadManager";
import StorageSelector from "renderer/components/storage-selector";

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
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [displayedPath, setDisplayedPath] = useState<string | null>(null);
  const [isAboutPopupOpen, setIsAboutPopupOpen] = useState(false);
  const [freeSpace, setFreeSpace] = useState<number>(0);
  const [allocatedStorage, setAllocatedStorage] = useState<number>(10); // Default 10GB
  const [showStorageSelector, setShowStorageSelector] = useState(false);
  const downloadManager = useDownloadManager();

  const handleInitializationComplete = useCallback((freeBytes: number) => {
    setFreeSpace(freeBytes);

    if (!selectedPath) {
      return;
    }
    
    setIsRunning(true);
    
    downloadManager.startDownload(selectedPath, freeBytes);
  }, [selectedPath, downloadManager, allocatedStorage]);

  const handleStorageSelected = useCallback((storageGB: number) => {
    setAllocatedStorage(storageGB);
  }, []);

  const toggleStorageSelector = useCallback(() => {
    const newState = !showStorageSelector;
    setShowStorageSelector(newState);
    
    // Resize window based on storage selector state
    window.App.expandMainWindowHeight(newState);
  }, [showStorageSelector]);

  // Setup IPC event listeners for init state management
  useEffect(() => {
    const cleanupStateChange = window.App.onInitializationStateChange((data) => {
      if (data.state === 'initializing') {
        setIsInitializing(data.value);
      } else if (data.state === 'running') {
        setIsRunning(data.value);
      }
    });

    const cleanupComplete = window.App.onInitializationComplete((data) => {
      handleInitializationComplete(data.freeBytes);
    });

    const cleanupError = window.App.onInitializationError((data) => {
      logger.error('Received initialization error', { data });

      setIsHosting(false);
      setIsInitializing(false);
      setIsRunning(false);
    });

    return () => {
      cleanupStateChange();
      cleanupComplete();
      cleanupError();
    };
  }, [handleInitializationComplete]);
  
  const handleSelectFolder = async () => {
    try {
      const folder = await App.openFolderDialog();
      if (folder) {
        setSelectedPath(folder);
        setDisplayedPath(shortenPathForDisplay(folder));
        await window.App.setDownloadPath(folder);
        
        logger.info('Download folder selected', { 
          data: {
            path: folder
          }
        });
      }
    } catch (error: any) {
      logger.error('Error selecting folder', { 
        data: { 
          error: error.message 
        }
      });
    }
  };

  useEffect(() => {
    // check the console on dev tools
    App.sayHelloFromBridge();
  }, []);

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


  const handleStartHosting = async () => {
    if (!selectedPath) {
      logger.error('Cannot start hosting: no path selected');
      return;
    }

    setIsHosting(true);
    setIsInitializing(true);

    // Hide storage selector and resize window
    setShowStorageSelector(false);
    window.App.expandMainWindowHeight(false);

    try {
      const result = await App.startInitialization(selectedPath);
      if (!result.success) {
        logger.error('Initialization failed', { error: result.error });
        // Error handling will be done via IPC events
      }
    } catch (error: any) {
      logger.error('Failed to start initialization', { error: error.message });
      setIsHosting(false);
      setIsInitializing(false);
    }
  };

  const handleStopHosting = () => {
    setIsHosting(false);
    setIsInitializing(false);
    setIsRunning(false);
    downloadManager.cancelDownload();
    downloadManager.resetDownload();

    if (selectedPath) {
      window.App.cleanupDownloadedFiles(selectedPath);
    }
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
    <div className="s4s-container relative flex w-[220px] h-screen p-4 flex-col items-start gap-0 box-border rounded-xl border border-white bg-gradient-to-t from-transparent via-transparent to-black/30 backdrop-blur-[17px] overflow-visible"
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
            handleStopHosting();
            setIsAboutPopupOpen(false);
          }}
          onContactUs={() => {
            setIsAboutPopupOpen(false);
          }}
          onGoToWebsite={() => {
            setIsAboutPopupOpen(false);
          }}
        />
      )}
      
      <div className="s4s-content flex pt-[38px] flex-col items-center gap-0 self-stretch rounded-md flex-1">
  
        {!isInitializing ? (
          <>
            {!isRunning ? (
              <>
                {!showStorageSelector ? (
                  <WelcomeComponent />
                ) : (
                  <StorageSelector
                    onStorageSelected={handleStorageSelected}
                    defaultSelection={allocatedStorage}
                  />
                )}
              </>
            ) : (
                <LoadingBars 
                  progress={downloadManager.progress}
                  currentStatus={downloadManager.currentStatus}
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
                
                <div className="w-full flex items-center gap-2 flex-1 min-w-0">
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


            {/* Storage configuration and start hosting buttons */}
            {!isRunning && !isHosting && (
              <div className="flex flex-col gap-3 w-full items-center">
                {/* Storage configuration button */}
                <div 
                  className="w-[188px] h-10 flex items-center justify-between 
                           px-4 py-2 rounded-[20px] border border-white/30 
                           hover:border-white/50 hover:bg-white/5 
                           transition-all duration-200 cursor-pointer"
                  onClick={toggleStorageSelector}
                >
                  <span className="text-akz-gro text-xs text-white/80">
                    Storage: {allocatedStorage} GB
                  </span>
                  <span className="text-akz-gro text-xs text-white/60">
                    {showStorageSelector ? "Close" : "Configure"}
                  </span>
                </div>

                {/* Start hosting button */}
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
              </div>
            )}
            

            {/* Dummy downloader 
            <DummyDownloader downloadPath={selectedPath || ""} />*/}
          </>
        ) : (
          <ShelterInitialization />
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
