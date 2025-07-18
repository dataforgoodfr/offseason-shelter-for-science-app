// src/renderer/components/DatasetDownloader.tsx
import type React from "react";
import { useState, useEffect } from "react";
import {
  ArrowDownIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface DownloadState {
  isDownloading: boolean;
  progress: number;
  speed: string;
  eta: string;
  error: string | null;
  filePath: string | null;
}

export const DatasetDownloader: React.FC = () => {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    progress: 0,
    speed: "",
    eta: "",
    error: null,
    filePath: null,
  });

  useEffect(() => {
    // Écouter les mises à jour de progression
    window.App.onDownloadProgress((progress, speed, eta) => {
      setDownloadState((prev) => ({
        ...prev,
        progress,
        speed,
        eta,
      }));
    });

    // Cleanup
    return () => {
      window.App.removeDownloadProgressListener();
    };
  }, []);

  const handleDownload = async () => {
    setDownloadState({
      isDownloading: true,
      progress: 0,
      speed: "",
      eta: "",
      error: null,
      filePath: null,
    });

    try {
      const result = await window.App.downloadDataset("climate-data");

      if (result.success) {
        setDownloadState((prev) => ({
          ...prev,
          isDownloading: false,
          progress: 100,
          filePath: result.filePath || null,
        }));
      } else {
        setDownloadState((prev) => ({
          ...prev,
          isDownloading: false,
          error: result.error || "Unknown error",
        }));
      }
    } catch (error: any) {
      setDownloadState((prev) => ({
        ...prev,
        isDownloading: false,
        error: error?.message || error || "Download failed",
      }));
    }
  };

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide">
        Dataset Downloader
      </h2>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={downloadState.isDownloading}
        className={`w-full text-sm font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 ${
          downloadState.isDownloading
            ? "bg-white/10 text-white/60 cursor-not-allowed"
            : "bg-white/20 hover:bg-white/30 text-white"
        }`}
      >
        <ArrowDownIcon className="w-4 h-4" />
        <span>
          {downloadState.isDownloading ? "Downloading..." : "Download Dataset1"}
        </span>
      </button>

      {/* Progress Section */}
      {downloadState.isDownloading && (
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Progress: {downloadState.progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${downloadState.progress}%` }}
            />
          </div>

          {/* Speed and ETA */}
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Speed: {downloadState.speed}</span>
            <span>ETA: {downloadState.eta}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {downloadState.error && (
        <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-start space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-red-300">Error:</div>
            <div className="text-sm text-red-200">{downloadState.error}</div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {downloadState.filePath && (
        <div className="mt-4 bg-green-500/20 border border-green-500/30 rounded-lg p-3 flex items-start space-x-2">
          <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-green-300">
              Download completed!
            </div>
            <div className="text-xs text-green-200 mt-1">
              File saved to: {downloadState.filePath}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
