import WebTorrent from 'webtorrent/dist/webtorrent.min.js';

import { getWebTorrentService, TorrentInfo } from '../webtorrent.service';

import { logger } from 'renderer/lib/logger';

/**
 * Debug IPC handlers for testing WebTorrent and other features.
 * Triggered via keyboard shortcuts from the renderer.
 */

let debugTorrentClient: WebTorrent.Instance | null = null;

let selectedPath: string = '';

window.App.getDownloadPath().then((path) => {
  selectedPath = path || '';
});

export class DebugService {
  async initWebtorrent() {
    try {
      if (!debugTorrentClient) {
        debugTorrentClient = new WebTorrent();
        console.log('[DEBUG] WebTorrent client initialized');
      }
      return { success: true, message: 'WebTorrent client ready' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  }

  async addMagnet(magnetLink: string) {
    try {
      if (!debugTorrentClient) {
        await this.initWebtorrent();
      }
      return new Promise((resolve) => {
        const torrent = debugTorrentClient!.add(magnetLink, { path: selectedPath }, (torrent) => {
          resolve({
            success: true,
            data: {
              name: torrent.name,
              magnetURI: torrent.magnetURI,
              infoHash: torrent.infoHash,
              numPeers: torrent.numPeers,
              progress: torrent.progress,
              files: torrent.files.length,
            },
          });
        });
        torrent.on('error', (err) => {
          resolve({ success: false, message: err.message });
        });
        // Timeout after 10s if torrent doesn't load
        setTimeout(() => {
          if (torrent.name === undefined) {
            resolve({ success: false, message: 'Torrent load timeout' });
          }
        }, 10000);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  }

  async startTorrenting(torrentKey: string, magnetLink: string) {
    getWebTorrentService().startTorrenting( torrentKey, magnetLink, {
      onReady: (data: {torrentKey: string, info: TorrentInfo}) => {
        logger.debug(`Torrent ${data.torrentKey} is ready`);
      },
      onDone: (data: {torrentKey: string, info: TorrentInfo}) => {
        logger.debug(`Torrent ${data.torrentKey} is done`);
      },
      onError: (data: {torrentKey: string, error: string}) => {
        logger.error(`Torrent ${data.torrentKey} error: ${data.error}`);
      },
      onFileStreaming: (data: { torrentKey: string; fileName: string; filePath: string; streamId: string }) => {
        logger.debug(`Torrent ${data.torrentKey} file streaming: ${data.fileName} at ${data.filePath}`);
      },
      onFileProgress: (data: { torrentKey: string; fileName: string; bytesWritten: number; totalSize: number; progress: number }) => {
        logger.debug(`Torrent ${data.torrentKey} file progress: ${data.fileName} - ${data.progress.toFixed(2)}%`);
      },
      onFileSaved: (data: { torrentKey: string; fileName: string; filePath: string }) => {
        logger.debug(`Torrent ${data.torrentKey} file saved: ${data.fileName} at ${data.filePath}`);
      }
/*
  
  onFileSaveError?: (data: { torrentKey: string; fileName: string; error: string }) => void;
  onProgress?: (progress: TorrentProgress) => void;
*/
    });
  }

  async downloadBigBuckBunny() {
    try {
      logger.debug('Starting Big Buck Bunny download via WebTorrent debug service');
      const bigBuckMagnet = 'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fbig-buck-bunny.torrent';
      await this.startTorrenting('big-buck-bunny', bigBuckMagnet);
      // this.addMagnet();
      return { success: true, message: 'Big Buck Bunny download started' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  }

  async getTorrents() {
    try {
      if (!debugTorrentClient) {
        return { torrents: [] };
      }
      const torrents = debugTorrentClient.torrents.map((t: any) => ({
        name: t.name,
        magnetURI: t.magnetURI,
        infoHash: t.infoHash,
        numPeers: t.numPeers,
        progress: t.progress,
        downloadSpeed: t.downloadSpeed,
        uploadSpeed: t.uploadSpeed,
        downloaded: t.downloaded,
        uploaded: t.uploaded,
        files: t.files.length,
      }));
      return { torrents, count: torrents.length };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  }

  async destroyTorrent(infoHash: string) {
    try {
      if (!debugTorrentClient) {
        return { success: false, message: 'WebTorrent client not initialized' };
      }
      debugTorrentClient.remove(infoHash);
      return { success: true, message: `Torrent ${infoHash} removed` };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  }

  async destroyAllTorrents() {
    try {
      if (!debugTorrentClient) {
        return { success: false, message: 'WebTorrent client not initialized' };
      }
      const count = debugTorrentClient.torrents.length;
      debugTorrentClient.destroy();
      debugTorrentClient = null;
      return { success: true, message: `All ${count} torrents destroyed` };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  }
}

const debugService = new DebugService();
export default debugService;
