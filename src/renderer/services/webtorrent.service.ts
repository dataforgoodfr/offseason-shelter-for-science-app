// src/renderer/services/webtorrent.service.ts
// @ts-ignore
import WebTorrent from 'webtorrent/dist/webtorrent.min.js';

// === TYPES ET INTERFACES ===
export interface TorrentProgress {
  torrents: Array<{
    torrentKey: string;
    ready: boolean;
    progress: number;
    downloaded: number;
    downloadSpeed: number;
    uploadSpeed: number;
    numPeers: number;
    length: number;
    bitfield?: any;
    files?: Array<{
      startPiece: number;
      endPiece: number;
      numPieces: number;
      numPiecesPresent: number;
    }>;
  }>;
  progress: number;
  hasActiveTorrents: boolean;
}

export interface TorrentInfo {
  infoHash: string;
  magnetURI: string;
  name: string;
  path?: string;
  files: Array<{
    name: string;
    length: number;
    path: string;
  }>;
  bytesReceived: number;
}

export class WebTorrentService {
  private client!: WebTorrent.Instance;
  private progressUpdateInterval: NodeJS.Timeout | null = null;
  private prevProgress: TorrentProgress | null = null;

  constructor() {
    this.initializeClient();
    this.startProgressUpdates();
  }

  // === INITIALISATION ===
  private initializeClient(): void {
    // Génération simple d'un peer ID de 20 bytes
    const peerId = new Uint8Array(20);
    window.crypto.getRandomValues(peerId);
    
    // Préfixe simple pour identifier notre client
    const prefix = new TextEncoder().encode('-SCIENCE-');
    peerId.set(prefix.slice(0, 9));

    this.client = new WebTorrent({
      peerId,
      maxConns: 25,
      dht: true,
      tracker: true,
      webSeeds: true,
      utp: false, // Désactiver uTP pour éviter les problèmes
    });

    this.client.on('error', (err: string | Error) => {
      const message = typeof err === 'string' ? err : err.message;
      console.error('WebTorrent error:', message);
    });
  }

  private startProgressUpdates(): void {
    this.progressUpdateInterval = setInterval(() => {
      this.updateTorrentProgress();
    }, 1000);
  }

  // === TÉLÉCHARGEMENT DE TORRENTS ===
  public startTorrenting(
    torrentKey: string,
    torrentID: string,
  ): void {
    console.log('Starting torrent:', torrentKey, torrentID);

    try {
      const torrent = this.client.add(torrentID, {});
      (torrent as any).key = torrentKey;

      this.setupTorrentEvents(torrent);
    } catch (error) {
      console.error('Erreur lors du démarrage du torrent:', error);
      this.emitEvent('torrent-error', {
        torrentKey,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  public stopTorrenting(infoHash: string): void {
    console.log('Stopping torrent:', infoHash);
    const torrent = this.client.get(infoHash);
    if (torrent) torrent.destroy();
  }

  // === CRÉATION ET SEEDING DE TORRENTS ===
  public async createMagnetLinkFromFile(filePath: string, fileName?: string): Promise<{ magnetURI: string; torrent: WebTorrent.Torrent; error?: string }> {
    return new Promise((resolve) => {
      try {
        window.App.getFileForTorrent(filePath).then((fileResult: any) => {
          if (!fileResult.success) {
            resolve({ magnetURI: '', torrent: null as any, error: fileResult.error });
            return;
          }

          const { fileData, originalFileName } = fileResult;
          const torrentName = fileName || originalFileName;
          const file = new File([fileData], torrentName);
          
          const options = {
            name: torrentName,
            comment: 'Created by Science Data Sharing App',
            createdBy: 'Science Data Sharing App v1.0.0',
            private: false,
            announceList: [
              ['wss://tracker.btorrent.xyz'],
              ['wss://tracker.openwebtorrent.com'],
              ['wss://tracker.fastcast.nz']
            ]
          };

          const torrent = this.client.seed([file], options);
          const torrentKey = `seeded-${Date.now()}`;
          (torrent as any).key = torrentKey;

          this.setupTorrentEvents(torrent);

          torrent.on('ready', () => {
            console.log('Torrent créé et seeding démarré:', torrent.name);
            
            this.emitEvent('torrent-seeding-started', {
              torrentKey,
              magnetURI: torrent.magnetURI,
              name: torrent.name,
              filePath
            });

            resolve({ magnetURI: torrent.magnetURI, torrent });
          });

          torrent.on('error', (error: any) => {
            console.error('Erreur lors de la création du torrent:', error);
            resolve({
              magnetURI: '',
              torrent: null as any,
              error: error.message || 'Erreur lors de la création du torrent'
            });
          });

        }).catch((error: any) => {
          resolve({
            magnetURI: '',
            torrent: null as any,
            error: error.message || 'Erreur lors de la lecture du fichier'
          });
        });

      } catch (error: any) {
        console.error('Erreur lors de la création du torrent:', error);
        resolve({
          magnetURI: '',
          torrent: null as any,
          error: error.message || 'Erreur lors de la création du torrent'
        });
      }
    });
  }

  public stopSeeding(torrentKey: string): void {
    const torrent = this.client.torrents.find((t: any) => (t as any).key === torrentKey);
    if (torrent) {
      console.log('Arrêt du seeding pour:', torrent.name);
      torrent.destroy();
      
      this.emitEvent('torrent-seeding-stopped', {
        torrentKey,
        name: torrent.name
      });
    }
  }

  public getSeedingTorrents(): Array<{ key: string; name: string; magnetURI: string; uploaded: number; ratio: number }> {
    return this.client.torrents
      .filter((torrent: any) => torrent.ready)
      .map((torrent: any) => ({
        key: (torrent as any).key || 'unknown',
        name: torrent.name,
        magnetURI: torrent.magnetURI,
        uploaded: torrent.uploaded,
        ratio: torrent.ratio
      }));
  }

  // === GESTION DES ÉVÉNEMENTS ===
  private setupTorrentEvents(torrent: WebTorrent.Torrent): void {
    const torrentKey = (torrent as any).key;

    torrent.on('error', (err: string | Error) => {
      const message = typeof err === 'string' ? err : err.message;
      console.error('Torrent error:', message);
      this.emitEvent('torrent-error', { torrentKey, error: message });
    });

    torrent.on('ready', () => {
      const info = this.getTorrentInfo(torrent);
      console.log('Torrent ready:', torrentKey, info.name);
      
      this.emitEvent('torrent-ready', { torrentKey, info });
      this.prepareFilesForDownload(torrent, torrentKey);
      this.updateTorrentProgress();
    });

    torrent.on('done', () => {
      const info = this.getTorrentInfo(torrent);
      console.log('Torrent done:', torrentKey, info.name);
      
      this.emitEvent('torrent-done', { torrentKey, info });
      this.updateTorrentProgress();
    });
  }

  private emitEvent(eventName: string, detail: any): void {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  // === STREAMING DE FICHIERS ===
  private prepareFilesForDownload(torrent: WebTorrent.Torrent, torrentKey: string): void {
    console.log(`Streaming ${torrent.files.length} fichier(s)`);
    
    for (const file of torrent.files) {
      this.createFileStream(file, torrentKey);
    }
  }

  private createFileStream(file: any, torrentKey: string): void {
    console.log(`Streaming: ${file.name}`);
    
    window.App.createTorrentStream(file.name).then((result: any) => {
      if (!result.success) {
        this.emitFileError(torrentKey, file.name, result.error);
        return;
      }

      const { streamId, filePath } = result;
      this.streamFileToSafer(file, torrentKey, streamId, filePath);
    }).catch(error => {
      this.emitFileError(torrentKey, file.name, error.message);
    });
  }

  private streamFileToSafer(file: any, torrentKey: string, streamId: string, filePath: string): void {
    this.emitEvent('torrent-file-streaming', {
      torrentKey,
      fileName: file.name,
      filePath,
      streamId
    });

    let bytesWritten = 0;
    const stream = file.createReadStream();
    
    stream.on('data', (chunk: Uint8Array) => {
      const arrayBuffer = new ArrayBuffer(chunk.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(chunk);
      
      window.App.writeTorrentChunk(streamId, arrayBuffer, bytesWritten).then((result: any) => {
        if (result.success) {
          bytesWritten += chunk.length;
          const progress = Math.round((bytesWritten / file.length) * 100);
          
          this.emitEvent('torrent-file-progress', {
            torrentKey,
            fileName: file.name,
            bytesWritten,
            totalSize: file.length,
            progress
          });
        } else {
          stream.destroy();
          window.App.closeTorrentStream(streamId, file.name);
        }
      }).catch(() => {
        stream.destroy();
        window.App.closeTorrentStream(streamId, file.name);
      });
    });

    stream.on('end', () => {
      window.App.closeTorrentStream(streamId, file.name).then(() => {
        this.emitEvent('torrent-file-saved', {
          torrentKey,
          fileName: file.name,
          filePath
        });
      });
    });

    stream.on('error', (error: Error) => {
      window.App.closeTorrentStream(streamId, file.name);
      this.emitFileError(torrentKey, file.name, error.message);
    });
  }

  private emitFileError(torrentKey: string, fileName: string, error: string): void {
    this.emitEvent('torrent-file-save-error', {
      torrentKey,
      fileName,
      error
    });
  }

  // === SUIVI DU PROGRÈS ===
  private updateTorrentProgress(): void {
    const progress = this.getTorrentProgress();
    
    // Ne pas envoyer l'objet si rien n'a changé
    if (this.prevProgress && JSON.stringify(progress) === JSON.stringify(this.prevProgress)) {
      return;
    }
    
    this.emitEvent('torrent-progress', progress);
    this.prevProgress = progress;
  }

  private getTorrentProgress(): TorrentProgress {
    const progress = this.client.progress;
    const hasActiveTorrents = this.client.torrents.some((torrent: any) => torrent.progress !== 1);

    const torrentProg = this.client.torrents.map((torrent: any) => {
      const fileProg = torrent.files?.map((file: any) => {
        const fileAny = file as any;
        const numPieces = fileAny._endPiece - fileAny._startPiece + 1;
        let numPiecesPresent = 0;
        for (let piece = fileAny._startPiece; piece <= fileAny._endPiece; piece++) {
          if ((torrent as any).bitfield?.get(piece)) numPiecesPresent++;
        }
        return {
          startPiece: fileAny._startPiece,
          endPiece: fileAny._endPiece,
          numPieces,
          numPiecesPresent
        };
      });

      return {
        torrentKey: (torrent as any).key,
        ready: torrent.ready,
        progress: torrent.progress,
        downloaded: torrent.downloaded,
        downloadSpeed: torrent.downloadSpeed,
        uploadSpeed: torrent.uploadSpeed,
        numPeers: torrent.numPeers,
        length: torrent.length,
        bitfield: (torrent as any).bitfield,
        files: fileProg
      };
    });

    return {
      torrents: torrentProg,
      progress,
      hasActiveTorrents
    };
  }

  // === UTILITAIRES ===
  private getTorrentInfo(torrent: WebTorrent.Torrent): TorrentInfo {
    return {
      infoHash: torrent.infoHash,
      magnetURI: torrent.magnetURI,
      name: torrent.name,
      path: torrent.path,
      files: torrent.files.map((file: WebTorrent.TorrentFile) => ({
        name: file.name,
        length: file.length,
        path: file.path
      })),
      bytesReceived: torrent.received
    };
  }

  // === CLEANUP ===
  public destroy(): void {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
      this.progressUpdateInterval = null;
    }
    
    this.client.destroy();
  }
}

// Initialize and make globally available
const webTorrentService = new WebTorrentService();
export default webTorrentService;
