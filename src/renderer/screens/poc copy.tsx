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
    <div 
      id="main-frame"
      style={{ overflow: 'hidden' }}
    >
      {/* Header */}
      <div id="header" className="mb-0">
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
      
      
      <div id="content-frame"  >

          {/* Welcome message */}
          <div id="welcome-frame">
            <span id="welcome-span">
              Thanks for joining the rescue network!
            </span>
            <span id="choose-path-span">
              Choose where you'll host the data:
            </span>
          </div>

          {/* Path */}
          <div
            id="path-selection-frame"
            className="path-option-layout path-option-style" 
            onClick={handleSelectFolder}
            title={selectedPath || undefined}
          >
            <div id="path-frame">
              <img
                src={folderIconUrl}
                alt="Path selection"
                className="w-[16px] h-[16px] aspect-square"
              />
              <span className="text-akz-gro font-size-12">
                {selectedPath ? displayedPath : "Choose path..."}
              </span>
            </div>

            {/* Only visible is path is already set */}
            <div className="change-path-indicator">
              <span
                className="text-akz-gro text-align-rightfont-size-10 font-weight-500"
                style={{ display: selectedPath ? "flex" : "none" }}
                >
                Change
              </span>
            </div>
          </div>

          <div id="start-hosting" className="start-hosting-layout start-hosting-style">
            <span className="text-akz-gro font-size-14">
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
  );
}
