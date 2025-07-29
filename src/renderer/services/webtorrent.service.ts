// src/renderer/services/WebTorrentService.ts
// Ajout pour corriger l'erreur de type sur l'import WebTorrent browser
// @ts-ignore
import WebTorrent from 'webtorrent/dist/webtorrent.min.js';

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

export interface CreateTorrentOptions {
  files: Array<{ path: string }>;
  name?: string;
  comment?: string;
  announceList?: string[][];
  private?: boolean;
}

export interface ServerInfo {
  torrentKey: string;
  localURL: string;
  networkURL: string;
  networkAddress: string;
}

export class WebTorrentService {
  private client!: WebTorrent.Instance;
  private server: any = null;
  private progressUpdateInterval: NodeJS.Timeout | null = null;
  private prevProgress: TorrentProgress | null = null;

  constructor() {
    console.time('WebTorrent init');
    
    this.initializeClient();
    this.init();
    
    console.timeEnd('WebTorrent init');
  }

  private randomBytes = (size: number) => {
    const array = new Uint8Array(size);
    window.crypto.getRandomValues(array);
    return array;
  };

  private generatePeerId(): Uint8Array {
    // WebTorrent requires peerId to be exactly 20 bytes
    // Using Azureus-style encoding: '-SD' + version + '-' + random bytes
    const VERSION = '1.0.0';
    const VERSION_STR = VERSION
      .replace(/\d*\./g, (v: string) => `0${Number.parseInt(v.slice(0, -1)) % 100}`.slice(-2))
      .slice(0, 4);
    
    // Create a 20-byte peer ID
    const peerId = new Uint8Array(20);
    
    // Fill with random bytes
    window.crypto.getRandomValues(peerId);
    
    // Set the prefix for our client (first 8 bytes)
    const prefix = `-SD${VERSION_STR}-`;
    const encoder = new TextEncoder();
    const prefixBytes = encoder.encode(prefix);
    
    // Copy prefix to the beginning
    for (let i = 0; i < Math.min(prefixBytes.length, 8); i++) {
      peerId[i] = prefixBytes[i];
    }
    
    return peerId;
  };

  private initializeClient(): void {
    // Generate a proper 20-byte peer ID
    const PEER_ID = this.generatePeerId();

    // Connect to the WebTorrent and BitTorrent networks. This is a hybrid client
    this.client = new WebTorrent({ 
      peerId: PEER_ID,
      // Configuration pour éviter les erreurs Node.js dans le navigateur
      maxConns: 25, // Réduire le nombre de connexions
      dht: true,
      tracker: true,
      webSeeds: true,
      utp: false, // Désactiver uTP qui peut causer des problèmes
    });
    
    // Make client globally accessible for debugging
    (window as any).client = this.client;
  }

  private init(): void {
    this.listenToClientEvents();
    this.setupIpcHandlers();
    this.startProgressUpdates();
    
    // Notify main process that WebTorrent is ready
    // ipcRenderer.send('ipcReadyWebTorrent'); // This line is removed
    (window.App as any).sayHelloFromBridge(); // This line is added

    // Handle uncaught errors
    window.addEventListener('error', (e) => {
      // ipcRenderer.send('wt-uncaught-error', { 
      //   message: e.error.message, 
      //   stack: e.error.stack 
      // }); // This line is removed
      console.error('WebTorrent uncaught error:', e.error);
    }, true);
  }

  private listenToClientEvents(): void {


    this.client.on('error', (err: string | Error) => {
      const message = typeof err === 'string' ? err : err.message;
      console.error('WebTorrent error:', message);
      // Utiliser une méthode alternative pour envoyer les erreurs
      console.error('WebTorrent error to main process:', message);
    });
  }

  private setupIpcHandlers(): void {
    // Note: Les handlers IPC devront être gérés différemment
    // car ipcRenderer n'est pas directement accessible dans le renderer
    console.log('Setting up WebTorrent IPC handlers...');
  }

  private startProgressUpdates(): void {
    this.progressUpdateInterval = setInterval(() => {
      this.updateTorrentProgress();
    }, 1000);
  }

  // Sets the default trackers
  public setGlobalTrackers(globalTrackers: string[]): void {
    (globalThis as any).WEBTORRENT_ANNOUNCE = globalTrackers;
  }

  // Starts a given TorrentID, which can be an infohash, magnet URI, etc.
  public startTorrenting(
    torrentKey: string,
    torrentID: string,
    downloadPath?: string,
    fileModtimes?: { [path: string]: number },
    selections?: boolean[]
  ): void {
    console.log('starting torrent %s: %s', torrentKey, torrentID);

    // Ne pas utiliser de downloadPath ou fileModtimes dans le navigateur
    // car ces options utilisent des APIs Node.js non disponibles
    const options: any = {};
    // Supprimer les options qui causent des erreurs dans le navigateur
    // if (downloadPath) options.path = downloadPath;
    // if (fileModtimes) options.fileModtimes = fileModtimes;

    try {
      const torrent = this.client.add(torrentID, options);
      (torrent as any).key = torrentKey;

      // Listen for ready event, progress notifications, etc
      this.addTorrentEvents(torrent);

      // Only download the files the user wants, not necessarily all files
      torrent.once('ready', () => this.selectFiles(torrent, selections));
    } catch (error) {
      console.error('Erreur lors du démarrage du torrent:', error);
      
      // Émettre un événement d'erreur
      window.dispatchEvent(new CustomEvent('torrent-error', { 
        detail: { 
          torrentKey, 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        } 
      }));
    }
  }

  public stopTorrenting(infoHash: string): void {
    console.log('--- STOP TORRENTING: ', infoHash);
    const torrent = this.client.get(infoHash);
    if (torrent) torrent.destroy();
  }

  // Create a new torrent, start seeding
  public createTorrent(torrentKey: string, options: CreateTorrentOptions): void {
    console.log('creating torrent', torrentKey, options);
    const paths = options.files.map((f) => f.path);
    const torrent = this.client.seed(paths, options);
    (torrent as any).key = torrentKey;
    this.addTorrentEvents(torrent);
    // ipcRenderer.send('wt-new-torrent'); // This line is removed
    (window.App as any).sayHelloFromBridge(); // This line is added
  }

  private addTorrentEvents(torrent: WebTorrent.Torrent): void {
    const torrentKey = (torrent as any).key;

    torrent.on('warning', (err: string | Error) => {
      const message = typeof err === 'string' ? err : err.message;
      // ipcRenderer.send('wt-warning', torrentKey, message); // This line is removed
      console.warn('WebTorrent warning:', message);
    });

    torrent.on('error', (err: string | Error) => {
      const message = typeof err === 'string' ? err : err.message;
      // ipcRenderer.send('wt-error', torrentKey, message); // This line is removed
      console.error('WebTorrent error:', message);
      
      // Émettre un événement d'erreur pour l'interface
      window.dispatchEvent(new CustomEvent('torrent-error', { 
        detail: { torrentKey, error: message } 
      }));
    });

    torrent.on('infoHash', () => {
      // ipcRenderer.send('wt-parsed', torrentKey, torrent.infoHash, torrent.magnetURI); // This line is removed
      console.log('WebTorrent infoHash:', torrentKey, torrent.infoHash, torrent.magnetURI);
    });

    torrent.on('metadata', () => {
      const info = this.getTorrentInfo(torrent);
      // ipcRenderer.send('wt-metadata', torrentKey, info); // This line is removed
      console.log('WebTorrent metadata:', torrentKey, info);
      
      // Émettre un événement de métadonnées pour l'interface
      window.dispatchEvent(new CustomEvent('torrent-metadata', { 
        detail: { torrentKey, info } 
      }));
      
      this.updateTorrentProgress();
    });

    torrent.on('ready', () => {
      const info = this.getTorrentInfo(torrent);
      // ipcRenderer.send('wt-ready', torrentKey, info); // This line is removed
      console.log('WebTorrent ready:', torrentKey, info);
      // ipcRenderer.send(`wt-ready-${torrent.infoHash}`, torrentKey, info); // This line is removed
      
      // Émettre un événement de prêt pour l'interface
      window.dispatchEvent(new CustomEvent('torrent-ready', { 
        detail: { torrentKey, info } 
      }));
      
      this.updateTorrentProgress();
    });

    torrent.on('done', () => {
      const info = this.getTorrentInfo(torrent);
      // ipcRenderer.send('wt-done', torrentKey, info); // This line is removed
      console.log('WebTorrent done:', torrentKey, info);
      
      // Émettre un événement de fin pour l'interface
      window.dispatchEvent(new CustomEvent('torrent-done', { 
        detail: { torrentKey, info } 
      }));
      
      // Préparer les fichiers pour téléchargement
      this.prepareFilesForDownload(torrent, torrentKey);
      
      this.updateTorrentProgress();

      // Ne pas utiliser getFileModtimes dans le navigateur
      // car cela utilise des APIs Node.js (fs.stat) non disponibles
      // Get file modification times
      // (torrent as any).getFileModtimes((err: Error | null, fileModtimes: any) => {
      //   if (err) return this.onError(err);
      //   // ipcRenderer.send('wt-file-modtimes', torrentKey, fileModtimes); // This line is removed
      //   console.log('WebTorrent file modtimes:', torrentKey, fileModtimes);
      // });
    });
  }

  // Produces a JSON saveable summary of a torrent
  private getTorrentInfo(torrent: WebTorrent.Torrent): TorrentInfo {
    return {
      infoHash: torrent.infoHash,
      magnetURI: torrent.magnetURI,
      name: torrent.name,
      path: torrent.path,
      files: torrent.files.map(this.getTorrentFileInfo),
      bytesReceived: torrent.received
    };
  }

  // Produces a JSON saveable summary of a file in a torrent
  private getTorrentFileInfo(file: WebTorrent.TorrentFile): { name: string; length: number; path: string } {
    return {
      name: file.name,
      length: file.length,
      path: file.path
    };
  }

  // Every time we resolve a magnet URI, save the torrent file
  public saveTorrentFile(torrentKey: string): void {
    try {
      const torrent = this.getTorrent(torrentKey);
      const fileName = `${torrent.infoHash}.torrent`;
      
      // In renderer process, we send the torrent file data to main process for saving
      if ((torrent as any).torrentFile) {
        // ipcRenderer.send('wt-save-torrent-file-data', torrentKey, fileName, (torrent as any).torrentFile); // This line is removed
        console.log('WebTorrent saving torrent file data:', torrentKey, fileName, (torrent as any).torrentFile);
      } else {
        console.warn('Torrent file not available for', torrentKey);
      }
    } catch (error) {
      console.error('Error saving torrent file:', error);
    }
  }

  private updateTorrentProgress(): void {
    const progress = this.getTorrentProgress();
    
    // Don't send heavy object if it hasn't changed
    if (this.prevProgress && JSON.stringify(progress) === JSON.stringify(this.prevProgress)) {
      return;
    }
    
    // Émettre un événement pour l'interface
    window.dispatchEvent(new CustomEvent('torrent-progress', { detail: progress }));
    
    // Utiliser une méthode alternative pour envoyer le progrès
    console.log('Torrent progress:', progress);
    this.prevProgress = progress;
  }

  private getTorrentProgress(): TorrentProgress {
    // First, track overall progress
    const progress = this.client.progress;
    const hasActiveTorrents = this.client.torrents.some((torrent: any) => torrent.progress !== 1);

    // Track progress for every file in each torrent
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

  public startServer(infoHash: string): void {
    const torrent = this.client.get(infoHash);
    if (!torrent) return;

    if (torrent.ready) {
      this.startServerFromReadyTorrent(torrent);
    } else {
      torrent.once('ready', () => this.startServerFromReadyTorrent(torrent));
    }
  }

  private startServerFromReadyTorrent(torrent: WebTorrent.Torrent): void {
    if (this.server) return;

    // Start the streaming torrent-to-http server
    this.server = torrent.createServer();
    this.server.listen(0, () => {
      const port = this.server.address().port;
      const urlSuffix = `:${port}`;
      const networkAddr = this.getNetworkAddress();
      
      const info: ServerInfo = {
        torrentKey: (torrent as any).key,
        localURL: `http://localhost${urlSuffix}`,
        networkURL: `http://${networkAddr}${urlSuffix}`,
        networkAddress: networkAddr
      };

      // ipcRenderer.send('wt-server-running', info); // This line is removed
      console.log('WebTorrent server running:', info);
      // ipcRenderer.send(`wt-server-${torrent.infoHash}`, info); // This line is removed
      console.log(`WebTorrent server ${torrent.infoHash} running:`, info);
    });
  }

  public stopServer(): void {
    if (!this.server) return;
    this.server.destroy();
    this.server = null;
  }

  private selectFiles(torrentOrInfoHash: WebTorrent.Torrent | string, selections?: boolean[]): void {
    // Get the torrent object
    let torrent: WebTorrent.Torrent;
    if (typeof torrentOrInfoHash === 'string') {
      const foundTorrent = this.client.get(torrentOrInfoHash);
      if (!foundTorrent) {
        throw new Error(`selectFiles: missing torrent ${torrentOrInfoHash}`);
      }
      torrent = foundTorrent;
    } else {
      torrent = torrentOrInfoHash;
    }

    // Selections not specified?
    // Load all files. We still need to replace the default whole-torrent
    // selection with individual selections for each file, so we can
    // select/deselect files later on
    let selectionsToUse = selections;
    if (!selectionsToUse) {
      selectionsToUse = new Array(torrent.files.length).fill(true);
    }

    // Selections specified incorrectly?
    if (selectionsToUse.length !== torrent.files.length) {
      throw new Error(`got ${selectionsToUse.length} file selections, but the torrent contains ${torrent.files.length} files`);
    }

    // Remove default selection (whole torrent)
    torrent.deselect(0, torrent.pieces.length - 1, 0);

    // Add selections (individual files)
    selectionsToUse.forEach((selection, i) => {
      const file = torrent.files[i];
      if (selection) {
        file.select();
      } else {
        console.log(`deselecting file ${i} of torrent ${torrent.name}`);
        file.deselect();
      }
    });
  }

  // Gets a WebTorrent handle by torrentKey
  private getTorrent(torrentKey: string): any {
    const ret = this.client.torrents.find((x: any) => (x as any).key === torrentKey);
    if (!ret) {
      throw new Error(`Torrent with key ${torrentKey} not found`);
    }
    return ret;
  }

  // Get network address (simplified version for renderer)
  private getNetworkAddress(): string {
    // In renderer process, we might need to get this from main process
    // For now, return localhost as fallback
    return 'localhost';
  }

  private onError(err: Error): void {
    console.error('WebTorrent error:', err);
  }

  // Test offline mode (for debugging)
  public testOfflineMode(): void {
    console.log('Test, going OFFLINE');
    
    // Generate a proper 20-byte peer ID
    const PEER_ID = this.generatePeerId();
    
    this.client = new WebTorrent({
      peerId: PEER_ID,
      tracker: false,
      dht: false,
      webSeeds: false
    });
    this.listenToClientEvents();
    (window as any).client = this.client;
  }

  // Public methods for external access
  public getClient(): WebTorrent.Instance {
    return this.client;
  }

  public getAllTorrents(): WebTorrent.Torrent[] {
    return this.client.torrents;
  }

  // Cleanup method
  public destroy(): void {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
      this.progressUpdateInterval = null;
    }
    
    if (this.server) {
      this.server.destroy();
      this.server = null;
    }
    
    this.client.destroy();
  }

  // Prépare les fichiers du torrent pour téléchargement automatique avec streaming
  private prepareFilesForDownload(torrent: WebTorrent.Torrent, torrentKey: string): void {
    console.log(`Préparation du streaming automatique pour ${torrent.files.length} fichier(s)`);
    
    // Créer un stream pour chaque fichier
    torrent.files.forEach((file: any, index: number) => {
      this.createFileStream(file, torrentKey, index);
    });
  }

  // Crée un stream pour un fichier et configure les listeners
  private createFileStream(file: any, torrentKey: string, fileIndex: number): void {
    console.log(`Création du stream pour: ${file.name}`);
    
    // Créer le stream via IPC
    window.App.createTorrentStream(file.name).then((result: any) => {
      if (!result.success) {
        console.error(`Erreur création stream pour ${file.name}:`, result.error);
        window.dispatchEvent(new CustomEvent('torrent-file-save-error', { 
          detail: { torrentKey, fileName: file.name, error: result.error } 
        }));
        return;
      }

      const { streamId, filePath } = result;
      console.log(`Stream créé pour ${file.name}: ${streamId}`);

      // Notifier que le fichier commence à être sauvegardé
      window.dispatchEvent(new CustomEvent('torrent-file-streaming', { 
        detail: { torrentKey, fileName: file.name, filePath, streamId } 
      }));

      // Variables pour suivre le progrès
      let bytesWritten = 0;
      const totalSize = file.length;

      // Créer un stream pour lire le fichier par chunks
      const stream = file.createReadStream();
      
      stream.on('data', (chunk: Uint8Array) => {
        // Convertir le chunk en ArrayBuffer
        const arrayBuffer = new ArrayBuffer(chunk.length);
        const view = new Uint8Array(arrayBuffer);
        view.set(chunk);
        
        // Écrire le chunk via IPC
        window.App.writeTorrentChunk(streamId, arrayBuffer, bytesWritten).then((writeResult: any) => {
          if (writeResult.success) {
            bytesWritten += chunk.length;
            
            // Émettre le progrès de ce fichier
            const progress = Math.round((bytesWritten / totalSize) * 100);
            window.dispatchEvent(new CustomEvent('torrent-file-progress', { 
              detail: { 
                torrentKey, 
                fileName: file.name, 
                bytesWritten, 
                totalSize, 
                progress 
              } 
            }));
          } else {
            console.error(`Erreur écriture chunk pour ${file.name}:`, writeResult.error);
            stream.destroy();
            window.App.closeTorrentStream(streamId, file.name);
          }
        }).catch(error => {
          console.error(`Erreur lors de l'écriture du chunk:`, error);
          stream.destroy();
          window.App.closeTorrentStream(streamId, file.name);
        });
      });

      stream.on('end', () => {
        console.log(`Stream terminé pour ${file.name}`);
        // Fermer le stream
        window.App.closeTorrentStream(streamId, file.name).then((closeResult: any) => {
          if (closeResult.success) {
            console.log(`Fichier sauvegardé avec succès: ${file.name}`);
            window.dispatchEvent(new CustomEvent('torrent-file-saved', { 
              detail: { torrentKey, fileName: file.name, filePath } 
            }));
          }
        });
      });

      stream.on('error', (error: Error) => {
        console.error(`Erreur stream pour ${file.name}:`, error);
        window.App.closeTorrentStream(streamId, file.name);
        window.dispatchEvent(new CustomEvent('torrent-file-save-error', { 
          detail: { torrentKey, fileName: file.name, error: error.message } 
        }));
      });

    }).catch(error => {
      console.error(`Erreur lors de la création du stream pour ${file.name}:`, error);
      window.dispatchEvent(new CustomEvent('torrent-file-save-error', { 
        detail: { torrentKey, fileName: file.name, error: error.message } 
      }));
    });
  }

  // Supprimer l'ancienne méthode saveFileToDownloadPath
  // private saveFileToDownloadPath(file: any, torrentKey: string, fileIndex: number): void {
  //   // Cette méthode est remplacée par createFileStream qui fait du streaming
  // }

  // Supprimer les anciennes méthodes de téléchargement manuel
  // public downloadFile(torrent: WebTorrent.Torrent, fileIndex: number): void {
  //   // Cette méthode n'est plus nécessaire car les fichiers sont sauvegardés automatiquement
  // }

  // public downloadAllFiles(torrent: WebTorrent.Torrent): void {
  //   // Cette méthode n'est plus nécessaire car les fichiers sont sauvegardés automatiquement
  // }
}

// Initialize and make globally available
const webTorrentService = new WebTorrentService();
(window as any).webTorrentService = webTorrentService;

export default webTorrentService;
