import { useEffect } from 'react'

import { logger } from "renderer/lib/logger";
import { getWebTorrentService } from "renderer/services/webtorrent.service";
import { PromisePool } from 'shared/promise-pool';

export function HiddenScreen() {
  useEffect(() => {
    // Startup logic for the hidden window
    console.log('Hidden window mechanics initialized')

    const webTorrentService = getWebTorrentService();

    // Seeding
    const cleanupTorrentRemover = window.App.onCleanupTorrents(() => {
      logger.warn('Torrent cleanup signal received');
      webTorrentService.clearAllTorrents();
    });

    const seedDirectoryContentRemover = window.App.onSeedDirectoryContent(() => {
      logger.warn('Torrent seeding directory content signal received');

      window.App.getDownloadPath().then((path) => {
        webTorrentService.clearAllTorrents().then(() => {
          window.App.scanDirectoryForSeeding(path).then((result) => {
            if (result.success) {
              const promisePool = new PromisePool(
                10,
                () => {
                  logger.info(`Seeding from scanning ${path} done`);
                  window.App.checkRemainingFreeSpace();
                }
              );
              promisePool.setLogger(logger.debug)
              promisePool.load(
                result.files,
                (item) => {
                  return async () => {
                    await window.App.addDownloadedFile(item, false);
                    await webTorrentService.saveFileForSeeding(
                      item,
                      undefined,
                      {
                        onSeedingStarted: ({ magnetURI }) => {
                          console.log(`Seeding démarré pour : ${magnetURI}`)
                        },
                        onError: ({ error }) => {
                          console.error(`Erreur seeding :`, error)
                        },
                      }
                    );
                  }
                }
              );
            }
          });
        });
      });
    });

    return () => {
      // Cleanup on close
      console.log('Hidden window mechanics cleanup')

      cleanupTorrentRemover();
      seedDirectoryContentRemover();
    }
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Hidden Mechanics Window</h1>
      <p>This window handles background processes and mechanics.</p>
      <p>Current status: <span style={{ color: 'green' }}>Running</span></p>

      {/* Debugging elements if necessary */}
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
      </div>
    </div>
  )
}