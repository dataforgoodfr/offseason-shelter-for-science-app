import { useCallback, useState, useEffect } from "react";
import { logger } from "renderer/lib/logger";

export interface UseSelectFolderReturn {
  selectedPath: string | null;
  displayedPath: string | null;
  selectFolder: () => Promise<void>;
  setSelectedPath: (path: string | null) => void;
}

export function useSelectFolder(): UseSelectFolderReturn {
  const [selectedPath, setSelectedPathState] = useState<string | null>(null);
  const [displayedPath, setDisplayedPath] = useState<string | null>(null);

  // Charger le chemin sauvegardé au démarrage
  useEffect(() => {
    const loadSavedPath = async () => {
      try {
        const path = await window.App.getDownloadPath();
        if (path) {
          setSelectedPathState(path);
          setDisplayedPath(shortenPathForDisplay(path));
        }
      } catch (error) {
        console.error("Failed to load saved path:", error);
      }
    };

    loadSavedPath();
  }, []);

  const selectFolder = useCallback(async () => {
    try {
      const folder = await window.App.openFolderDialog();
      console.log("selecting folderrrrrrrrrrrr", folder);
      if (folder) {
        setSelectedPathState(folder);
        setDisplayedPath(shortenPathForDisplay(folder));
        await window.App.setDownloadPath(folder);

        logger.info("Download folder selected", {
          data: {
            path: folder,
          },
        });
      }
    } catch (error: any) {
      logger.error("Error selecting folder", {
        data: {
          error: error.message,
        },
      });
    }
  }, []);

  const setSelectedPath = useCallback((path: string | null) => {
    console.log("selected path setSelectedPath", path);
    setSelectedPathState(path);
    if (path) {
      setDisplayedPath(shortenPathForDisplay(path));
    } else {
      setDisplayedPath(null);
    }
  }, []);

  return {
    selectedPath,
    displayedPath,
    selectFolder,
    setSelectedPath,
  };
}

function shortenPathForDisplay(path: string): string {
  if (process.platform === "win32") {
    return `...\\${path.split("\\").slice(-1)[0]}`;
  }
  return `.../${path.split("/").slice(-1)[0]}`;
}
