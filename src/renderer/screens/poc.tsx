import { useEffect, useState, useCallback } from "react";
import WelcomeComponent from "renderer/components/WelcomeComponent";
import ShelterInitialization from "renderer/components/initializing";
import Cleanup from "renderer/components/Cleanup";
import FreeSpaceExhausted from "renderer/components/ui/FreeSpaceExhausted";
import { logger } from "renderer/lib/logger";
import AboutPopup from "renderer/components/about-popup";

// broija 2025/08/25 : dissociated download logic from graphic features
import LoadingBars from "renderer/components/ui/loading-bars/LoadingBarsDisplay";
import { useDownloadManager } from "renderer/hooks/useDownloadManager";
import StorageSelector from "renderer/components/storage-selector";
import { BandwidthLimiter, BandwidthUnit } from "renderer/components/ui/bandwidth-limiter";
import { buttonVariants } from "renderer/tailwind-pattern";
import { WINDOW_DIMENSIONS } from "shared/constants";
import { KILO_BYTES, MEGA_BYTES, GIGA_BYTES } from "lib/electron-app/utils/units";

// Header
const s4sLogoUrl = new URL('../assets/brand/logo.svg', import.meta.url).href;
const gearSixUrl = new URL('../assets/icons/gear_six.svg', import.meta.url).href;
const folderIconUrl = new URL('../assets/icons/path.svg', import.meta.url).href;
const hostingIconUrl = new URL('../assets/icons/hosting.svg', import.meta.url).href;
const heartIconUrl = new URL('../assets/icons/heart.svg', import.meta.url).href;
// The "App" comes from the context bridge in preload/index.ts
const { App } = window;

function getBandwidthLimitBps(bandwidthBps: number | undefined, unit: BandwidthUnit) {
  if (bandwidthBps === undefined || unit === undefined) {
    return undefined;
  }

  return Math.floor(bandwidthBps * (unit === 'KB/s' ? KILO_BYTES : MEGA_BYTES));
}

export function MainScreen() {
  const [isHosting, setIsHosting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [displayedPath, setDisplayedPath] = useState<string | null>(null);
  const [isAboutPopupOpen, setIsAboutPopupOpen] = useState(false);
  
  const [diskFreeSpace, setDiskFreeSpace] = useState<number>(0);
  const [allocatedStorage, setAllocatedStorage] = useState<number>(10); // Default 10GB
  const [showStorageSelector, setShowStorageSelector] = useState(false);
  
  const [allocatedBandwidth, setAllocatedBandwidth] = useState<number | undefined>(undefined);
  const [bandwidthUnit, setBandwidthUnit] = useState<BandwidthUnit | undefined>(undefined);
  const [showBandwidthLimiter, setShowBandwidthLimiter] = useState(false);

  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isFreeSpaceExhausted, setIsFreeSpaceExhausted] = useState(false);
  const downloadManager = useDownloadManager();

  const handleInitializationComplete = useCallback(async (freeBytes: number) => {
    setDiskFreeSpace(freeBytes);

    if (!selectedPath) {
      return;
    }

    setIsRunning(true);

    downloadManager.startDownload(
      selectedPath,
      await window.App.getRemainingFreeSpace()
    );
  }, [selectedPath, downloadManager, allocatedStorage]);

  const handleStorageSelected = useCallback((storageGB: number) => {
    setAllocatedStorage(storageGB);
  }, []);

  const toggleStorageSelector = useCallback(() => {
    const newState = !showStorageSelector;
    setShowStorageSelector(newState);
    if (newState) {
      setShowBandwidthLimiter(false);
    }
  }, [showStorageSelector]);

  const handleBandwidthLimiterSelected = useCallback((bandwidth?: number, bandwidthUnit?: BandwidthUnit) => {
    setAllocatedBandwidth(bandwidth);
    setBandwidthUnit(bandwidthUnit);
    window.App.setBandwidthAllocation(getBandwidthLimitBps(bandwidth, bandwidthUnit));
  }, []);

  const toggleBandwidthLimiter = useCallback(() => {
    const newState = !showBandwidthLimiter;
    setShowBandwidthLimiter(newState);

    if (newState) {
      setShowStorageSelector(false);
    }
  }, [showBandwidthLimiter]);

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

    const freeSpaceExhausted = window.App.onFreeSpaceExhausted(() => {
      setIsHosting(false);
      setIsInitializing(false);
      setIsRunning(false);
      setIsFreeSpaceExhausted(true);
    });

    return () => {
      cleanupStateChange();
      cleanupComplete();
      cleanupError();
      freeSpaceExhausted();
    };
  }, [handleInitializationComplete]);

  const handleAllocateMoreSpace = () => {
    setIsFreeSpaceExhausted(false);

    toggleStorageSelector();
  };

  const handleSelectNewPath = () => {
    setIsFreeSpaceExhausted(false);

    handleSelectFolder();
  };

  // Resize window
  useEffect(() => {
    let expansionLevel = 0;
    if (showBandwidthLimiter) {
      expansionLevel = 1;
    } else if (showStorageSelector) {
      expansionLevel = 2;
    }

    window.App.expandMainWindowHeight(expansionLevel)
  }, [showStorageSelector, showBandwidthLimiter]);

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

    if (process.platform === 'win32') {
      // Fix window sizing issue on Windows
      window.App.expandMainWindowHeight(0);
    }
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
    if (process.platform === 'win32') {
      return '...\\' + path.split('\\').slice(-1)[0];
    }
    return '.../' + path.split('/').slice(-1)[0];
  }

  // Download path init
  useEffect(() => {
    window.App.getDownloadPath().then((path) => {
      if (path) {
        setSelectedPath(path);
        setDisplayedPath(shortenPathForDisplay(path));
      }
    });
  }, []);

  useEffect(() => {
    // Load settings
    window.App.getStorageAllocation().then((storageAllocation) => {
      setAllocatedStorage(storageAllocation / GIGA_BYTES);
    });

    window.App.getBandwidthAllocation().then((bandwidthAllocation) => {
      // Compute display value and unit
      if (bandwidthAllocation) {
        if (bandwidthAllocation > MEGA_BYTES) {
          setBandwidthUnit('MB/s');
          setAllocatedBandwidth(bandwidthAllocation / MEGA_BYTES);
        } else {
          setBandwidthUnit('KB/s');
          setAllocatedBandwidth(bandwidthAllocation / KILO_BYTES);
        }
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
    downloadManager.cancelDownload();
    downloadManager.resetDownload();

    if (selectedPath) {
      setIsCleaningUp(true);
      window.App.cleanupDownloadedFiles(selectedPath);
    }
  };

  const handleCleanupComplete = () => {
    setIsHosting(false);
    setIsInitializing(false);
    setIsRunning(false);
    setIsCleaningUp(false);
    setIsFreeSpaceExhausted(false);
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
    <div className="s4s-container relative w-full bg-[hsla(154,29%,38%,1)] p-4 rounded-2xl border-2 border-[#457E65] leading-light flex flex-col"
      style={{
        minHeight: WINDOW_DIMENSIONS.MAIN.HEIGHT.COLLAPSED,
        backgroundPosition: "top left, 0 0",
        backgroundRepeat: "no-repeat, repeat",
        backgroundSize: `100% ${WINDOW_DIMENSIONS.MAIN.HEIGHT.COLLAPSED}px, 100% 100%`
      }}>

      {/* Header avec zone de déplacement */}
      <div className="s4s-header flex-shrink-0">
        {/* Zone de déplacement - toute la largeur du header */}
        <div className="flex justify-between items-rigth">
        </div>
        <div className="flex justify-between items-center">
          <div
            className="flex-1 h-full cursor-move flex items-center"
            onMouseDown={(e) => {
              if (e.button === 0) { // Clic gauche seulement
                // Déplacer la fenêtre directement
                e.preventDefault();
                const startX = e.clientX;
                const startY = e.clientY;

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const deltaX = moveEvent.clientX - startX;
                  const deltaY = moveEvent.clientY - startY;
                  window.App.moveWindow(deltaX, deltaY);
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }
            }}
          >
            <img
              src={s4sLogoUrl}
              alt="S4S Logo"
              className="w-full h-[20px] pointer-events-none"
            />
          </div>

          {/* Contrôles à droite */}
          <div className="flex items-center gap-2">
            {/* Bouton settings */}
            <button
              className="gear-icon w-[16px] h-[16px] cursor-pointer hover:opacity-80 transition-opacity"
              onClick={toggleAboutPopup}
            >
              <img
                src={gearSixUrl}
                alt="Gear Six"
                className="w-full h-full"
              />
            </button>
            {/* Bouton minimize */}
            <button
              className="w-4 h-4 rounded-full bg-transparent hover:bg-white/10 transition-colors flex items-center justify-center"
              onClick={() => window.App.minimize()}
            >
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 14H4v-2h16v2z" />
              </svg>
            </button>
            {/* Bouton fermer */}
            <button
              className="w-4 h-4 rounded-full bg-transparent hover:bg-white/10 transition-colors flex items-center justify-center"
              onClick={() => window.App.close()}
            >
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
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

      {/* Contenu principal - prend tout l'espace disponible */}
      <div className="flex-grow flex flex-col space-y-4 pt-4">
        {isCleaningUp ? (
          <Cleanup onCleanupComplete={handleCleanupComplete} />
        ) : isFreeSpaceExhausted ? (
          <FreeSpaceExhausted
            onAllocateMoreSpace={handleAllocateMoreSpace}
            onSelectNewPath={handleSelectNewPath}
          />
        ) : !isInitializing ? (
          <>
            <div>
              {!isRunning ? (
                <WelcomeComponent />
              ) : (
                <LoadingBars
                  progress={downloadManager.progress}
                  currentStatus={downloadManager.currentStatus}
                />
              )}
            </div>

            {/* Path */}
            <button
              className={buttonVariants.primary}
              onClick={handleSelectFolder}
              title={selectedPath || undefined}
            >
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
                <div className="h-[19px] flex items-center justify-center rounded-full py-1.5 px-1.5 bg-[#737372] flex-shrink-0 ml-2">
                  <span className="text-akz-gro text-[10px] font-medium text-white">
                    Change
                  </span>
                </div>
              )}
            </button>

            {/* Storage config button */}
            <button
              className={`${buttonVariants.primary} ${showStorageSelector && 'border-white/50 bg-white/5'}`}
              onClick={toggleStorageSelector}
            >
              <span className="text-akz-gro text-xs text-white/80">
                Storage: {allocatedStorage} GB
              </span>
              <div className="h-[19px] flex items-center justify-center rounded-full py-1.5 px-1.5 bg-[#737372] flex-shrink-0 ml-2">
                <span className="text-akz-gro text-[10px] font-medium text-white">
                  {showStorageSelector ? "Close" : "..."}
                </span>
              </div>
            </button>
            {showStorageSelector && (
              <StorageSelector
                onStorageSelected={handleStorageSelected}
                defaultSelection={allocatedStorage}
              />
            )}
            {/* Bandwidth config button */}
            <button
              className={`${buttonVariants.primary} ${showBandwidthLimiter && 'border-white/50 bg-white/5'}`}
              onClick={toggleBandwidthLimiter}
            >
              <span className="text-akz-gro text-xs text-white/80">
                Bandwidth: {bandwidthUnit ? `${allocatedBandwidth} ${bandwidthUnit}` : '∞'}
              </span>
              <div className="h-[19px] flex items-center justify-center rounded-full py-1.5 px-1.5 bg-[#737372] flex-shrink-0 ml-2">
                <span className="text-akz-gro text-[10px] font-medium text-white">
                  {showBandwidthLimiter ? "Close" : "..."}
                </span>
              </div>
            </button>
            {showBandwidthLimiter && (
              <BandwidthLimiter
                onBandwidthSelected={handleBandwidthLimiterSelected}
                defaultValue={allocatedBandwidth}
                defaultUnit={bandwidthUnit}
              />
            )}

            {/* Storage configuration and start hosting buttons */}
            {!isRunning && !isHosting && (
              <>
                {/* Start hosting button */}
                <button
                  className="group w-full h-12 flex items-center
                  justify-between opacity-100 rounded-[40px] px-5 py-4
                  bg-black shadow-lg relative
                  hover:bg-gradient-to-t from-[#C4FFEA] to-[#FBDF9C]
                  transition-all duration-300
                  cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    boxShadow: '0px 6px 8px 0px #00000040'
                  }}
                  onClick={selectedPath ? handleStartHosting : undefined}
                  disabled={!selectedPath}
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
                </button>
              </>
            )}
          </>
        ) : (
          <ShelterInitialization />
        )}
      </div>

      {/* Footer - toujours en bas */}
      <div
        className="w-full h-[32px] flex items-center text-center gap-2 pt-2 opacity-80 justify-center flex-shrink-0 mt-auto"
        style={{ transform: "rotate(0deg)" }}
      >
        <span
          className="text-[9px] text-white font-normal uppercase tracking-[0.1em] leading-[100%] align-middle"
          style={{ fontFamily: "Akzidenz-Grotesk Pro, sans-serif", whiteSpace: "normal" }}
        >
          made with <img src={heartIconUrl} alt="coeur" className="w-4 h-4 inline-block align-middle -translate-y-[1px]" /> by the data for good community
        </span>
      </div>
    </div>
  );
}
