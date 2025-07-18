import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  PauseIcon,
  FolderIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";

// The "App" comes from the context bridge in preload/index.ts
const { App } = window;

export function MainScreen() {
  useEffect(() => {
    // check the console on dev tools
    App.sayHelloFromBridge();
  }, []);

  useEffect(() => {
    window.App.getDownloadPath().then((path) => {
      if (path) setSelectedPath(path);
    });
  }, []);

  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedStoragePercentage, setSelectedStoragePercentage] =
    useState(50);
  const [selectedBandwidthPercentage, setSelectedBandwidthPercentage] =
    useState(10);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const handleSelectFolder = async () => {
    const folder = await App.openFolderDialog();
    if (folder) {
      setSelectedPath(folder);
      await window.App.setDownloadPath(folder); // <-- Sauvegarde dans SQLite via IPC !
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 min-h-screen text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-500 rounded-xs"></div>
          </div>
          <h1 className="text-sm font-semibold uppercase tracking-wide">
            Shelter for Science
          </h1>
        </div>
        <EllipsisHorizontalIcon className="w-5 h-5" />
      </div>

      {/* Usage Stats */}
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-0" : "-rotate-90"
              }`}
              onClick={() => setIsExpanded(!isExpanded)}
            />
            <span className="text-sm font-medium">USING NOW : 230MO/S</span>
          </div>
          <PauseIcon className="w-5 h-5" />
        </div>
      </div>

      {/* Path */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide">
          Path
        </h2>
        <button
          onClick={handleSelectFolder}
          className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 w-full text-left"
          title="Sélectionnez le dossier de téléchargement"
        >
          <FolderIcon className="w-5 h-5" />
          <span className="text-sm truncate">
            {selectedPath || "Cliquez pour choisir un dossier"}
          </span>
        </button>
      </div>

      {/* Storage Shared */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide">
          Storage Shared
        </h2>
        <p className="text-xs text-white/80 mb-4">1 To of storage detected</p>

        <div className="flex items-center space-x-2 mb-4">
          <button
            onClick={() => setSelectedStoragePercentage(25)}
            className={`px-3 py-1 rounded text-sm ${
              selectedStoragePercentage === 25
                ? "bg-white text-purple-600 font-medium"
                : "bg-white/20 text-white"
            }`}
          >
            25%
          </button>
          <button
            onClick={() => setSelectedStoragePercentage(50)}
            className={`px-3 py-1 rounded text-sm ${
              selectedStoragePercentage === 50
                ? "bg-white text-purple-600 font-medium"
                : "bg-white/20 text-white"
            }`}
          >
            50%
          </button>
          <button
            onClick={() => setSelectedStoragePercentage(75)}
            className={`px-3 py-1 rounded text-sm ${
              selectedStoragePercentage === 75
                ? "bg-white text-purple-600 font-medium"
                : "bg-white/20 text-white"
            }`}
          >
            75%
          </button>
          <button className="px-2 py-1 rounded text-sm bg-white/20 text-white">
            <EllipsisHorizontalIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Max Bandwidth */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide">
          Max Bandwidth Allowed
        </h2>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ArrowDownIcon className="w-4 h-4" />
            <span className="text-sm">2.3Gbps</span>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowUpIcon className="w-4 h-4" />
            <span className="text-sm">1.4Gbps</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <button
            onClick={() => setSelectedBandwidthPercentage(5)}
            className={`px-3 py-1 rounded text-sm ${
              selectedBandwidthPercentage === 5
                ? "bg-white text-purple-600 font-medium"
                : "bg-white/20 text-white"
            }`}
          >
            5%
          </button>
          <button
            onClick={() => setSelectedBandwidthPercentage(10)}
            className={`px-3 py-1 rounded text-sm ${
              selectedBandwidthPercentage === 10
                ? "bg-white text-purple-600 font-medium"
                : "bg-white/20 text-white"
            }`}
          >
            10%
          </button>
          <button
            onClick={() => setSelectedBandwidthPercentage(15)}
            className={`px-3 py-1 rounded text-sm ${
              selectedBandwidthPercentage === 15
                ? "bg-white text-purple-600 font-medium"
                : "bg-white/20 text-white"
            }`}
          >
            15%
          </button>
          <button className="px-2 py-1 rounded text-sm bg-white/20 text-white">
            <EllipsisHorizontalIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stop Button */}
      <button className="w-full bg-black/50 hover:bg-black/70 transition-colors duration-200 text-red-400 py-3 rounded-lg text-sm font-medium">
        Stop sharing storage
      </button>
    </div>
  );
}
