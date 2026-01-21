import React, { useState, useEffect } from 'react';
import { logger } from 'renderer/lib/logger';
import debugService from 'renderer/services/debug/webTorrentDebug.service';
import { getWebTorrentService } from 'renderer/services/webtorrent.service';

/**
 * Debug panel component with keyboard shortcuts.
 * Usage in dev/debug mode to test WebTorrent and other features.
 *
 * Shortcuts:
 * - Shift+D: Dump torrent
 * - Shift+I: Init WebTorrent
 * - Shift+T: Show torrents
 * - Shift+M: Add test magnet (copy to clipboard first)
 * - Shift+B: Download Big Buck Bunny torrent
 */

export const WebTorrentDebugPanel: React.FC = () => {
  const [magnetInput, setMagnetInput] = useState('');
  const [torrentsList, setTorrentsList] = useState<any[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.shiftKey) return;

      switch (e.key.toUpperCase()) {
        case 'D':
          e.preventDefault();
          window.App.getSeedingData().then((seedingData) => {
            const list = [];
            for (const [_, info] of Object.entries(seedingData)) {
              list.push(info.magnetURI);
            }
            logger.debug(JSON.stringify(list, null, 2));
          });
          break;

        case 'I': {
          e.preventDefault();
          initWebtorrent();
          break;
        }

        case 'M': {
          e.preventDefault();
          downloadMagnet();
          break;
        }

        case 'S': { // Seed items from file store
          e.preventDefault();
          window.App.clearDownloadStore();
          window.App.sendMessageToWindow('hidden', 'torrent:seed-directory-content')
          break;
        }

        case 'T': { // Get torrents from torrent service
          e.preventDefault();
          listTorrents();
          break;
        }

        case 'B': {
          e.preventDefault();
          debugService.downloadBigBuckBunny().then((result) => {
            addLog('Download Big Buck Bunny', result);
          });
          break;
        }

        case 'C': {
          e.preventDefault();
          if (e.ctrlKey) { // CTRL + SHIFT + C
            // Clear download store and seeding info
            window.App.sendMessageToWindow('hidden', 'torrent:cleanup');
            window.App.clearDownloadStore();
          } else {
            // Just log current torrent count
            addLog('Current torrent count', getWebTorrentService().getTorrentCount().toString());
          }
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [magnetInput]);

  const initWebtorrent = () => {
    debugService.initWebtorrent().then((result) => {
      addLog('Init WebTorrent', result);
    });
  };

  const downloadMagnet = () => {
    const magInput = magnetInput.trim();
    if (magInput) {
      debugService.startTorrenting('foo-' + Date.now(), magInput).then(() => {
        addLog('Magnet download started', magInput);
      });
      // debugService.addMagnet(magInput).then((result) => {
      //   addLog('Add Magnet', result);
      // });
    } else {
      addLog('Add Magnet', 'Please enter a magnet link');
    }
  }

  const listTorrents = () => {
    setTorrentsList(getWebTorrentService().getSeedingTorrents() || []);
    addLog('Get Torrents', torrentsList);
  };

  const addLog = (action: string, result: any) => {
    logger.debug(`[DEBUG PANEL] ${action}:`, result);
  };

  const handleDestroyAll = () => {
    debugService.destroyAllTorrents().then((result) => {
      addLog('Destroy All Torrents', result);
      setTorrentsList([]);
    });
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-screen flex flex-col bg-gray-900 text-gray-100 rounded border border-gray-700 shadow-xl overflow-hidden z-50">
      {/* Controls */}
      <div className="px-4 py-3 border-b border-gray-700 space-y-2 bg-gray-800">
        <div className="text-xs space-y-1">
          <p className="font-semibold">Shortcuts:</p>
          <p>Shift+I: Init WebTorrent</p>
          <p>Shift+T: Show torrents</p>
          <p>Shift+C: Current torrent count</p>
          <p>Shift+M: Add magnet</p>
          <p>Shift+B: Download Big Buck Bunny</p>
        </div>

        {/* Magnet input */}
        <div className="space-y-1">
          <input
            type="text"
            placeholder="magnet:?xt=urn:btih:..."
            value={magnetInput}
            onChange={(e) => setMagnetInput(e.target.value)}
            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
          />
          <button
            onClick={downloadMagnet}
            className="w-full px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded"
          >
            Download Magnet (Shift+M)
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={initWebtorrent}
            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 rounded"
          >
            Init WebTorrent
          </button>
          <button
            onClick={listTorrents}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded"
          >
            List Torrents
          </button>
          <button
            onClick={handleDestroyAll}
            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 rounded"
          >
            Destroy All
          </button>
        </div>
      </div>

      {/* Torrents list */}
      {torrentsList.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-700 bg-gray-800 max-h-24 overflow-y-auto">
          <p className="text-xs font-semibold mb-1">Active Torrents ({torrentsList.length})</p>
          {torrentsList.map((t, i) => (
            <div key={i} className="text-xs text-gray-300 truncate mb-1">
              <span className="font-mono">{t.name || t.infoHash.slice(0, 8)}</span>
              <span className="text-gray-500 ml-1">
                {(t.progress * 100).toFixed(0)}% | {t.numPeers} peers
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
