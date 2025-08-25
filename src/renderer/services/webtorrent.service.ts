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

export interface DownloadCallbacks {
  onProgress?: (progress: number, speed: string, eta: string, peers: number) => void;
  onComplete?: (savedFiles: any[]) => void;
  onError?: (error: string) => void;
}

// === INTERFACES POUR LES CALLBACKS ===
export interface TorrentCallbacks {
  onReady?: (data: { torrentKey: string; info: TorrentInfo }) => void;
  onDone?: (data: { torrentKey: string; info: TorrentInfo }) => void;
  onError?: (data: { torrentKey: string; error: string }) => void;
  onFileStreaming?: (data: { torrentKey: string; fileName: string; filePath: string; streamId: string }) => void;
  onFileProgress?: (data: { torrentKey: string; fileName: string; bytesWritten: number; totalSize: number; progress: number }) => void;
  onFileSaved?: (data: { torrentKey: string; fileName: string; filePath: string }) => void;
  onFileSaveError?: (data: { torrentKey: string; fileName: string; error: string }) => void;
  onProgress?: (progress: TorrentProgress) => void;
}

export interface SeedingCallbacks {
  onSeedingStarted?: (data: { torrentKey: string; magnetURI: string; name: string; filePath: string }) => void;
  onSeedingStopped?: (data: { torrentKey: string; name: string }) => void;
  onError?: (data: { torrentKey?: string; error: string }) => void;
}

export class WebTorrentService {
  public client!: WebTorrent.Instance;
  private progressUpdateInterval: NodeJS.Timeout | null = null;
  private prevProgress: TorrentProgress | null = null;
  private progressCallbacks: Set<(progress: TorrentProgress) => void> = new Set();

  constructor() {
    this.initializeClient();
    this.startProgressUpdates();
    this.resumeSeedingOnStartup();
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

  // === GESTION DES CALLBACKS DE PROGRÈS GLOBAUX ===
  public subscribeToProgress(callback: (progress: TorrentProgress) => void): void {
    this.progressCallbacks.add(callback);
  }

  public unsubscribeFromProgress(callback: (progress: TorrentProgress) => void): void {
    this.progressCallbacks.delete(callback);
  }

public async startTorrenting(
  torrentKey: string,
  torrentID: string,
  callbacks: TorrentCallbacks,
): Promise<void> {
  console.log('Starting torrent:', torrentKey, torrentID);

  try {
    // NETTOYAGE COMPLET ET SÉCURISÉ AVANT CHAQUE AJOUT
    console.log('🧹 Nettoyage complet avant ajout du torrent');
    
    const torrents = [...this.client.torrents]; // Copie pour éviter les modifications pendant l'itération
    torrents.forEach((torrent, index) => {
      if (torrent && typeof torrent.destroy === 'function') {
        console.log(`🗑️ Destruction torrent ${index + 1}/${torrents.length}: ${torrent.name || torrent.infoHash}`);
        torrent.destroy();
      }
    });
    
    // Attendre que le nettoyage soit effectif
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Nettoyage terminé, ajout du nouveau torrent');

    const torrent = this.client.add(torrentID, {});
    (torrent as any).key = torrentKey;

    this.setupTorrentEvents(torrent, callbacks);

  } catch (error) {
    console.error('Erreur lors du démarrage du torrent:', error);
    callbacks.onError?.({
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

  // Nouvelle méthode pour supprimer un torrent par son nom
  public removeTorrentByName(torrentName: string): void {
    console.log('Removing torrent by name:', torrentName);
    const torrent = this.client.torrents.find((t: any) => t.name === torrentName);
    if (torrent) {
      console.log('Found and destroying torrent:', torrent.name);
      torrent.destroy();
    } else {
      console.log('No torrent found with name:', torrentName);
    }
  }

  // === CRÉATION ET SEEDING DE TORRENTS ===
  public async createMagnetLinkFromFile(
    filePath: string, 
    fileName?: string, 
    callbacks: SeedingCallbacks = {}
  ): Promise<{ magnetURI: string; torrent: WebTorrent.Torrent; error?: string }> {
    return new Promise((resolve) => {
      try {
        window.App.getFileForTorrent(filePath).then((fileResult: any) => {
          if (!fileResult.success) {
            const error = fileResult.error;
            callbacks.onError?.({ error });
            resolve({ magnetURI: '', torrent: null as any, error });
            return;
          }

          const { fileData, originalFileName } = fileResult;

          // CRÉER UN NOM UNIQUE
          const baseFileName = fileName || originalFileName;
          const timestamp = Date.now();
          const pathHash = filePath.split('/').pop() || 'unknown';
          const uniqueTorrentName = `${baseFileName}_${pathHash}_${timestamp}`;

          const file = new File([fileData], uniqueTorrentName);
          
          const options = {
            name: uniqueTorrentName,
            comment: `Climate Data: ${filePath} - Created at ${new Date().toISOString()}`,
            createdBy: 'Science Data Sharing App v1.0.0',
            private: false,
            announceList: [
              ['wss://tracker.btorrent.xyz'],
              ['wss://tracker.openwebtorrent.com'],
            ]
          };

          const torrent = this.client.seed([file], options);
          const torrentKey = `seeded-${timestamp}`;
          (torrent as any).key = torrentKey;
          

          this.setupSeedingEvents(torrent, callbacks, filePath);

          torrent.on('ready', () => {
            console.log('Torrent créé et seeding démarré:', torrent.name);
            
            callbacks.onSeedingStarted?.({
              torrentKey,
              magnetURI: torrent.magnetURI,
              name: torrent.name,
              filePath
            });

            resolve({ magnetURI: torrent.magnetURI, torrent });
          });

          torrent.on('error', (error: any) => {
            console.error('Erreur lors de la création du torrent:', error);
            const errorMessage = error.message || 'Erreur lors de la création du torrent';
            callbacks.onError?.({ torrentKey, error: errorMessage });
            resolve({
              magnetURI: '',
              torrent: null as any,
              error: errorMessage
            });
          });

        }).catch((error: any) => {
          const errorMessage = error.message || 'Erreur lors de la lecture du fichier';
          callbacks.onError?.({ error: errorMessage });
          resolve({
            magnetURI: '',
            torrent: null as any,
            error: errorMessage
          });
        });

      } catch (error: any) {
        console.error('Erreur lors de la création du torrent:', error);
        const errorMessage = error.message || 'Erreur lors de la création du torrent';
        callbacks.onError?.({ error: errorMessage });
        resolve({
          magnetURI: '',
          torrent: null as any,
          error: errorMessage
        });
      }
    });
  }

  public async stopSeeding(torrentKey: string, callbacks: SeedingCallbacks = {}): Promise<void> {
    const torrent = this.client.torrents.find((t: any) => (t as any).key === torrentKey);
    if (torrent) {
      console.log('🛑 Arrêt du seeding pour:', torrent.name);
      
      // Essayer de trouver le filePath correspondant dans le store pour le nettoyer
      try {
        const seedingData = await window.App.getSeedingData();
        for (const [filePath, info] of Object.entries(seedingData)) {
          if ((info as any).torrentKey === torrentKey || (info as any).name === torrent.name) {
            await window.App.removeSeedingInfo(filePath);
            console.log('🗑️ Nettoyage du store pour:', filePath);
            break;
          }
        }
      } catch (error) {
        console.error('❌ Erreur nettoyage store:', error);
      }
      
      torrent.destroy();
      
      callbacks.onSeedingStopped?.({
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
  private setupTorrentEvents(torrent: WebTorrent.Torrent, callbacks: TorrentCallbacks): void {
    const torrentKey = (torrent as any).key;

    torrent.on('error', (err: string | Error) => {
      const message = typeof err === 'string' ? err : err.message;
      console.error('Torrent error:', message);
      callbacks.onError?.({ torrentKey, error: message });
    });

    torrent.on('ready', () => {
      const info = this.getTorrentInfo(torrent);
      console.log('Torrent ready:', torrentKey, info.name);
      
      callbacks.onReady?.({ torrentKey, info });
      this.prepareFilesForDownload(torrent, torrentKey, callbacks);
      this.updateTorrentProgress();
    });

    torrent.on('done', () => {
      const info = this.getTorrentInfo(torrent);
      console.log('Torrent done:', torrentKey, info.name);
      
      callbacks.onDone?.({ torrentKey, info });
      this.updateTorrentProgress();
    });
  }

  private setupSeedingEvents(torrent: WebTorrent.Torrent, callbacks: SeedingCallbacks, filePath: string): void {
    const torrentKey = (torrent as any).key;

    torrent.on('error', (err: string | Error) => {
      const message = typeof err === 'string' ? err : err.message;
      console.error('Seeding torrent error:', message);
      callbacks.onError?.({ torrentKey, error: message });
    });
  }

  // === STREAMING DE FICHIERS ===
  private prepareFilesForDownload(torrent: WebTorrent.Torrent, torrentKey: string, callbacks: TorrentCallbacks): void {
    console.log(`Streaming ${torrent.files.length} fichier(s)`);
    
    for (const file of torrent.files) {
      this.createFileStream(file, torrentKey, callbacks);
    }
  }

  private createFileStream(file: any, torrentKey: string, callbacks: TorrentCallbacks): void {
    console.log(`Streaming: ${file.name}`);
    
    window.App.createTorrentStream(file.name).then((result: any) => {
      if (!result.success) {
        callbacks.onFileSaveError?.({
          torrentKey,
          fileName: file.name,
          error: result.error
        });
        return;
      }

      const { streamId, filePath } = result;
      this.streamFileToSafer(file, torrentKey, streamId, filePath, callbacks);
    }).catch(error => {
      callbacks.onFileSaveError?.({
        torrentKey,
        fileName: file.name,
        error: error.message
      });
    });
  }

  private streamFileToSafer(file: any, torrentKey: string, streamId: string, filePath: string, callbacks: TorrentCallbacks): void {
    callbacks.onFileStreaming?.({
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
          
          callbacks.onFileProgress?.({
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
        callbacks.onFileSaved?.({
          torrentKey,
          fileName: file.name,
          filePath
        });
      });
    });

    stream.on('error', (error: Error) => {
      window.App.closeTorrentStream(streamId, file.name);
      callbacks.onFileSaveError?.({
        torrentKey,
        fileName: file.name,
        error: error.message
      });
    });
  }

  // === SUIVI DU PROGRÈS ===
  private updateTorrentProgress(): void {
    const progress = this.getTorrentProgress();
    
    // Ne pas envoyer l'objet si rien n'a changé
    if (this.prevProgress && JSON.stringify(progress) === JSON.stringify(this.prevProgress)) {
      return;
    }
    
    // Notifier tous les callbacks abonnés au progrès global
    for (const callback of this.progressCallbacks) {
      try {
        callback(progress);
      } catch (error) {
        console.error('Erreur dans callback de progrès:', error);
      }
    }
    
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

  // === NOUVELLES MÉTHODES POUR LA PERSISTANCE ===

  // 🌱 Méthode publique pour créer un magnet link et sauvegarder pour seeding
  public async saveFileForSeeding(
    filePath: string, 
    fileName?: string, 
    callbacks: SeedingCallbacks = {}
  ): Promise<{ magnetURI: string; error?: string }> {
    try {
      // Créer un torrent à partir du fichier téléchargé
      const result = await this.createMagnetLinkFromFile(filePath, fileName, callbacks);
      
      if (!result.error) {
        const seedingInfo = {
          magnetURI: result.magnetURI,
          name: result.torrent.name,
          torrentKey: `auto-seed-${Date.now()}`,
          filePath,
          lastSeeded: Date.now()
        };

        await window.App.saveSeedingInfo(filePath, seedingInfo);
        console.log('Fichier sauvegardé pour seeding automatique:', result.torrent.name);
        
        return { magnetURI: result.magnetURI };
      }
      
      return { magnetURI: '', error: result.error };
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde pour seeding:', error);
      const errorMessage = error?.message || 'Erreur lors de la sauvegarde pour seeding';
      callbacks.onError?.({ error: errorMessage });
      return { 
        magnetURI: '', 
        error: errorMessage
      };
    }
  }

  // 🔄 Reprendre le seeding au démarrage de l'application
  private async resumeSeedingOnStartup(): Promise<void> {
    // Attendre un peu que le client soit complètement initialisé
    setTimeout(async () => {
      try {
        const seedingData = await window.App.getSeedingData();
        const filePaths = Object.keys(seedingData);
        
        if (filePaths.length === 0) {
          console.log('🌱 Aucun fichier à seeder au démarrage');
          return;
        }

        console.log('🔄 Reprise du seeding pour', filePaths.length, 'fichiers...');

        for (const filePath of filePaths) {
          const info = seedingData[filePath];
          await this.resumeSeedingForFile(filePath, info);
          
          // Petit délai entre chaque torrent pour éviter de surcharger
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('Reprise du seeding terminée');
      } catch (error) {
        console.error('❌ Erreur lors de la reprise du seeding:', error);
      }
    }, 2000); // Délai de 2 secondes après l'initialisation
  }

  // 🔄 Reprendre le seeding pour un fichier spécifique
  private async resumeSeedingForFile(filePath: string, seedingInfo: any): Promise<void> {
    try {
      // Vérifier que le fichier existe encore
      const fileResult = await window.App.getFileForTorrent(filePath);
      
      if (!fileResult.success) {
        console.log('🗑️ Fichier supprimé, nettoyage:', filePath);
        await window.App.removeSeedingInfo(filePath);
        return;
      }

      console.log('🌱 Reprise du seeding pour:', seedingInfo.name);
      
      // Recréer le torrent avec le même nom pour essayer de garder le même hash
      const result = await this.createMagnetLinkFromFile(filePath, seedingInfo.name);
      
      if (result.error) {
        console.error('❌ Erreur reprise seeding:', result.error);
      } else {
        console.log('Seeding repris:', seedingInfo.name);
      }
    } catch (error) {
      console.error('❌ Erreur reprise seeding pour', filePath, ':', error);
    }
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
    
    this.progressCallbacks.clear();
    this.client.destroy();
  }

// Dans webTorrentService

/**
 * Récupère un torrent existant par son magnetURI (SYNCHRONE)
 * @param magnetURI - L'URI magnet du torrent à rechercher
 * @returns Le torrent s'il existe, null sinon
 */
public getTorrentByMagnet(magnetURI: string): WebTorrent.Torrent | null {
  try {
    console.log('Recherche torrent:', magnetURI);
    
    // Méthode SYNCHRONE de WebTorrent pour récupérer un torrent existant
    const torrent = this.client.get(magnetURI);
    
    if (torrent) {
      console.log('Torrent trouvé:', {
        infoHash: torrent.infoHash,
        name: torrent.name,
        progress: torrent.progress,
        ready: torrent.ready,
        done: torrent.done
      });
      return torrent;
    }
    
    console.log('Aucun torrent trouvé pour:', magnetURI);
    return null;
    
  } catch (error) {
    console.error('Erreur getTorrentByMagnet:', error);
    return null;
  }
}

/**
 * Alternative : Recherche par infoHash si le magnetURI ne fonctionne pas
 * @param magnetURI - L'URI magnet du torrent
 * @returns Le torrent s'il existe, null sinon
 */

public async removeTorrent(magnetOrInfoHash: string): Promise<boolean> {
  try {
    const torrent = this.getTorrentByMagnet(magnetOrInfoHash) || this.getTorrentByInfoHash(magnetOrInfoHash)
    
    if (torrent) {
      torrent.destroy()
      return true
    }
    return false
  } catch (error) {
    console.error('Erreur suppression torrent:', error)
    return false
  }
}


// Dans votre webTorrentService, ajoutez ces méthodes publiques :

public getTorrentByInfoHash(infoHash: string): WebTorrent.Torrent | null {
  try {
    return this.client.get(infoHash) || 
           this.client.torrents.find((t: WebTorrent.Torrent) => 
             t.infoHash?.toLowerCase() === infoHash.toLowerCase()
           ) || null;
  } catch (error) {
    console.error('Erreur getTorrentByInfoHash:', error);
    return null;
  }
}

public async removeTorrentByInfoHash(infoHash: string): Promise<boolean> {
  try {
    const existingTorrent = this.getTorrentByInfoHash(infoHash);
    
    if (existingTorrent && typeof existingTorrent.destroy === 'function') {
      console.log(`Suppression torrent: ${existingTorrent.name || infoHash}`);
      existingTorrent.destroy();
      return true;
    }
    
    console.log(`ℹAucun torrent trouvé pour: ${infoHash}`);
    return false;
  } catch (error) {
    console.error('Erreur removeTorrentByInfoHash:', error);
    return false;
  }
}

public async clearAllTorrents(): Promise<number> {
  try {
    const torrents = [...this.client.torrents];
    console.log(`🧹 Nettoyage de ${torrents.length} torrents`);
    
    torrents.forEach(torrent => {
      if (typeof torrent.destroy === 'function') {
        console.log(`🗑️ Destruction: ${torrent.name || torrent.infoHash}`);
        torrent.destroy();
      }
    });
    
    return torrents.length;
  } catch (error) {
    console.error('Erreur clearAllTorrents:', error);
    return 0;
  }
}
  
}

const webTorrentService = new WebTorrentService();
export default webTorrentService;
