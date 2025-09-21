import { Asset, DispatchRequestPayload, DispatchResponse, DownloadProgressCallback, StatusUpdatePayload } from 'renderer/lib/types'
import webTorrentService from './webtorrent.service'
import { logger } from 'renderer/lib/logger'
import { truncateMagnetLink } from 'renderer/lib/torrent'
import { MEGA_BYTES } from 'lib/electron-app/utils/units'

class ClimateDataService { 
  /**
   * Appel à l'API pour récupérer la liste des fichiers à télécharger
   */
  async fetchDownloadTasks(payload: DispatchRequestPayload): Promise<DispatchResponse> {
    try {
      logger.debug("[RESCUE API] Fetching download tasks", payload);
      // @todo renderer should not define the route (issue #70)
      const response = await window.App.rescueApiCall("/dispatch", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }, { retry: 3 })
      logger.debug("[RESCUE API] Download tasks response", { response });
      if (!response.success) {
        throw new Error(`API Error: ${response.error || 'Unknown error'}`)
      }

      const data: DispatchResponse = response.data
      return data
    } catch (error) {
      throw error
    }
  }

  async sendStatusUpdate(payload: StatusUpdatePayload): Promise<void> {
    try {
      logger.debug("[RESCUE API] Sending file status update", payload);
      // @todo renderer should not define the route (issue #70)
      const response = await window.App.rescueApiCall("/assets-downloaded", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }, { retry: 3 })
      if (!response.success) {
        throw new Error(`Status Update Error: ${response.error || 'Unknown error'}`)
      }
      logger.debug("[RESCUE API] File status update response", { response });
    } catch (error: any) {
      logger.error("[RESCUE API] Status update error", { error: error.message, details: error.errorDetails });
      console.error('Erreur lors de l\'envoi du status update:', error)
    }
  }

  private isMagnetLink(url: string): boolean {
    return url.startsWith('magnet:')
  }

  /**
   * Télécharge un fichier via HTTP et crée son magnet link
   * broija 2025/09/03 @todo download logic should be moved to the main process
   */
  private async downloadHttpFile(
    asset: Asset,
    downloadPath: string
  ): Promise<{ success: boolean; filePath?: string; magnetLink?: string; fileSize?: number; error?: string }> {
    try {
      /** broija 2025/09/03 @todo asset file name is irrelevant most of the time.
       * It can even lead to collisions with other files in the same directory.
       * Ignoring it for now. */
      const downloadResult = await window.App.downloadFile(
        asset.url,
        downloadPath,
        undefined,
        asset.asset_id?.toString()
      );
      
      if (!downloadResult.success || !downloadResult.filePath) {
        return { success: false, error: downloadResult.error || 'Download failed' }
      }

      // Création du magnet link
      try {
        const seedingResult = await webTorrentService.saveFileForSeeding(
          downloadResult.filePath,
          asset.name,
          {
            onSeedingStarted: ({ magnetURI }) => {
              console.log(`Seeding démarré pour ${asset.name}: ${magnetURI}`)
            },
            onError: ({ error }) => {
              console.error(`Erreur seeding ${asset.name}:`, error)
            },
          }
        )

        if (seedingResult.error) {
          console.error(`Erreur création magnet pour ${asset.name}:`, seedingResult.error)
          return { success: true, error: seedingResult.error }
        }

        return {
          success: true,
          magnetLink: seedingResult.magnetURI,
          ...(downloadResult.filePath && { filePath: downloadResult.filePath }),
          ...(downloadResult.fileSize && { fileSize: downloadResult.fileSize / MEGA_BYTES })
        };
      } catch (seedingError: any) {
        console.error(`Erreur seeding pour ${asset.name}:`, seedingError)
        return { success: true, error: seedingError?.message || 'Seeding failed' }
      }
    } catch (error: any) {
      console.error(`Erreur téléchargement HTTP ${asset.name}:`, error)
      return { success: false, error: error?.message || 'HTTP download failed' }
    }
  }

  /**
   * Télécharge un fichier via torrent
   */
  private async downloadTorrentFile(
    asset: Asset,
    downloadPath: string
  ): Promise<{ success: boolean; error?: string }> {
      return new Promise(async (resolve) => {

      console.info(`Nettoyage complet du client WebTorrent`)
      const removedCount = await webTorrentService.clearAllTorrents()

      // Attendre que le nettoyage soit effectif
      await new Promise(resolve => setTimeout(resolve, 3000))

      try {
        const expectedFilePath = `${downloadPath}/${asset.name}`;
        let fileExists = false;
        try {
          fileExists = await window.App.checkFileExists(expectedFilePath);
      
          if (fileExists) {
            console.info(`Fichier déjà téléchargé, passage au suivant: ${asset.name}`);
            window.App.addDownloadedFile(expectedFilePath)
            asset.status = 'SUCCESS';
            resolve({ success: true });
            return;
          }
        } catch (checkError) {
          console.info(`ℹ Impossible de vérifier l'existence du fichier, téléchargement normal`);
        }
        
        const torrentKey = `torrent-${asset.asset_id}-${Date.now()}`
        
        // État de téléchargement local
        let downloadCompleted = false
        let savedFilesCount = 0
        let totalFilesCount = 0

        // Callbacks pour le téléchargement torrent
        const callbacks = {
          onReady: (data: any) => {
            console.info(`Torrent ready: ${asset.name}`)
            totalFilesCount = data.info.files.length
          },
          onProgress: (progress: any) => {
            const torrent = progress.torrents.find((t: any) => t.torrentKey === torrentKey)
            if (torrent) {
              console.info(`${asset.name}: ${Math.round(torrent.progress * 100)}% - ${torrent.numPeers} peers`)
            }
          },
          onFileSaved: (data: any) => {
            savedFilesCount++
            console.info(`Fichier sauvegardé: ${data.fileName} (${savedFilesCount}/${totalFilesCount})`)
            
            window.App.addDownloadedFile(data.filePath)

            // Si tous les fichiers sont sauvegardés, marquer comme terminé
            if (savedFilesCount >= totalFilesCount && !downloadCompleted) {
              downloadCompleted = true
              console.info(`Téléchargement torrent terminé: ${asset.name}`)
              resolve({ success: true })
            }
          },
          onFileSaveError: (data: any) => {
            if (!downloadCompleted) {
              downloadCompleted = true
              console.error(`Erreur sauvegarde fichier ${asset.name}:`, data.error)
              resolve({ success: false, error: data.error })
            }
          },
          onError: (data: any) => {
            if (!downloadCompleted) {
              downloadCompleted = true
              console.error(`Erreur téléchargement torrent ${asset.name}:`, data.error)
              resolve({ success: false, error: data.error })
            }
          },
          onDone: (data: any) => {
            // Vérifier que tous les fichiers ont été sauvegardés
            if (savedFilesCount >= totalFilesCount && !downloadCompleted) {
              downloadCompleted = true
              resolve({ success: true })
            }
          }
        }

        await webTorrentService.startTorrenting(torrentKey, asset.url, callbacks)

        const progressCallback = (progress: any) => {
          callbacks.onProgress?.(progress)
        }
        webTorrentService.subscribeToProgress(progressCallback)

        // Timeout de sécurité
        setTimeout(() => {
          if (!downloadCompleted) {
            downloadCompleted = true
            webTorrentService.unsubscribeFromProgress(progressCallback)
            webTorrentService.stopTorrenting(asset.url)
            console.error(`Timeout téléchargement torrent: ${asset.name}`)
            resolve({ success: false, error: 'Download timeout' })
          } else {
            // Nettoyer l'abonnement même si terminé avec succès
            webTorrentService.unsubscribeFromProgress(progressCallback)
          }
        }, 50000)
        
      } catch (error: any) {
        console.error(` Erreur démarrage torrent ${asset.name}:`, error)
        resolve({ success: false, error: error?.message || 'Torrent setup failed' })
      }
    })
  }

  async downloadAssets(
    assets: Asset[],
    downloadPath: string,
    rescuerId: number,
    callbacks?: DownloadProgressCallback
  ): Promise<{ completedAssets: Asset[]; failedAssets: Asset[] }> {
    
    const completedAssets: Asset[] = []
    const failedAssets: Asset[] = []

    callbacks?.onStatusChange?.('downloading now')

    for (let i = 0; i < assets.length; i++) {
      // If free space exhausted, stop the download
      if (!await window.App.checkRemainingFreeSpace()) {
        callbacks?.onError?.('Free space exhausted', assets[i]);
        return { completedAssets, failedAssets }
      }

      const asset = assets[i]

      // Mise à jour de la progression
      callbacks?.onProgress?.(i, i, assets.length)

      // Marquer comme en cours de téléchargement
      asset.status = 'DOWNLOADING'

      try {
        let result: { success: boolean; filePath?: string; magnetLink?: string; fileSize?: number; error?: string }

        // Nettoyage du nom du fichier
        asset.name = asset.name.replace(/[\s\/\\:*?"<>|]/g, '_');

        if (this.isMagnetLink(asset.url)) {
          // Téléchargement torrent
          const torrentResult = await this.downloadTorrentFile(asset, downloadPath)
          result = { success: torrentResult.success, error: torrentResult.error }
        } else {
          // Téléchargement HTTP + création magnet
          result = await this.downloadHttpFile(asset, downloadPath)
          
          // Envoi du magnetLink au dispatcher
          if (result.success) {

            logger.info(
              'File downloaded', {
                ...(asset.name && { name: asset.name }),
                ...(result.filePath && { filePath: result.filePath }),
              });

            asset.status = 'SUCCESS'
            if (result.magnetLink) {
              asset.magnet_link = result.magnetLink;
            }
            if (result.fileSize) {
              asset.size_mb = result.fileSize / MEGA_BYTES;
            }

            try {
              if (asset.magnet_link) {
              logger.info('Sending magnet link to rescue API', {
                name: asset.name,
                magnet: truncateMagnetLink(asset.magnet_link)
                })
              } else {
                logger.info('Sending file status to rescue API', { name: asset.name })
              }

              /** @todo broija 2025/09/12 : Handle retries in case of error */
              await this.sendStatusUpdate({
                rescuer_id: 1,
                message: "Mise à jour de l'état",
                assets: [asset] 
              })
            } catch (updateError) {
              console.error('Erreur envoi status update:', updateError)
            }
          }
        }

        if (result.success) {
          asset.status = 'SUCCESS'
         
          completedAssets.push(asset)
          callbacks?.onFileComplete?.(asset, result.magnetLink)
        } else {
          asset.status = 'ABORTED'
          failedAssets.push(asset)
          callbacks?.onError?.(result.error || 'Download failed', asset)
        }

        // Petit délai entre les téléchargements
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error: any) {
        console.error(`Erreur générale ${asset.name}:`, error)
        asset.status = 'ABORTED'
        failedAssets.push(asset)
        callbacks?.onError?.(error?.message || 'Unknown error', asset)
      }
    }

    // Progression finale
    callbacks?.onProgress?.(assets.length, assets.length, assets.length)
    callbacks?.onStatusChange?.('uploading')
    callbacks?.onComplete?.(completedAssets)

    return { completedAssets, failedAssets }
  }

  async fetchAndDownload(
    payload: DispatchRequestPayload,
    downloadPath: string,
    callbacks?: DownloadProgressCallback
  ): Promise<{ completedAssets: Asset[]; failedAssets: Asset[] }> {
    try {
      callbacks?.onStatusChange?.('downloading now')
      
      const response = await this.fetchDownloadTasks(payload)
      
      if (!response.asset || response.asset.length === 0) {
        throw new Error('Aucun asset à télécharger')
      }
      logger.info(`${response.asset.length} assets retrieved from API`)

      return await this.downloadAssets(
        response.asset,
        downloadPath,
        payload.node_id, // broija 2025/09/11 : should be named rescuer_id to be consistent with /assets-downloaded
        callbacks
      )
    } catch (error: any) {
      console.error('Erreur processus principal:', error)
      callbacks?.onError?.(error?.message || 'Process failed')
      throw error
    }
  }
}

export const climateDataService = new ClimateDataService()
export default climateDataService