import webTorrentService from './webtorrent.service'



class ClimateDataService {
  private readonly API_BASE_URL = 'https://us-climate-data-dispatcher.services.dataforgood.fr'
  
  /**
   * Appel à l'API pour récupérer la liste des fichiers à télécharger
   * Utilise l'API Electron pour éviter les problèmes CORS
   */
  async fetchDownloadTasks(payload: DispatchRequestPayload): Promise<DispatchResponse> {
    try {
      console.log('🚀 Appel API dispatch avec payload:', payload)
      
      // Utilisation de l'API Electron pour éviter CORS
      const response = await window.App.fetchClimateData(`${this.API_BASE_URL}/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.success) {
        throw new Error(`API Error: ${response.error || 'Unknown error'}`)
      }

      const data: DispatchResponse = response.data
      console.log('Réponse API reçue:', data)
      return data
    } catch (error) {
      console.error('Erreur lors de l\'appel API:', error)
      throw error
    }
  }

  async sendStatusUpdate(payload: Asset): Promise<void> {
    try {
      const response = await window.App.fetchClimateData(`${this.API_BASE_URL}/rescues`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.success) {
        throw new Error(`Status Update Error: ${response.error || 'Unknown error'}`)
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi du status update:', error)
    }
  }

  /**
   * Détermine si une URL est un magnet link
   */
  private isMagnetLink(url: string): boolean {
    return url.startsWith('magnet:')
  }

  /**
   * Télécharge un fichier via HTTP et crée son magnet link
   */
  private async downloadHttpFile(
    asset: Asset,
    downloadPath: string
  ): Promise<{ success: boolean; magnetLink?: string; error?: string }> {
    try {
      // Téléchargement du fichier via l'API Electron
      const result = await window.App.downloadFile(asset.url, downloadPath, asset.name)
      
      if (!result.success || !result.filePath) {
        return { success: false, error: result.error || 'Download failed' }
      }

      console.log(` Fichier téléchargé: ${result.filePath}`)

      // Création du magnet link
      try {
        const seedingResult = await webTorrentService.saveFileForSeeding(
          result.filePath,
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

        return { success: true, magnetLink: seedingResult.magnetURI }
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

    console.log(`🧹 Nettoyage complet du client WebTorrent`)
    const removedCount = await webTorrentService.clearAllTorrents()
    console.log(`${removedCount} torrents supprimés`)

    // Attendre que le nettoyage soit effectif
    await new Promise(resolve => setTimeout(resolve, 3000))

    try {
      const expectedFilePath = `${downloadPath}/${asset.name}`;
      let fileExists = false;
      try {
        fileExists = await window.App.checkFileExists(expectedFilePath);
        console.log(`🔍 Vérification existence fichier: ${expectedFilePath}`)
        console.log("fileExists = ", fileExists)
        if (fileExists) {
          console.log(`Fichier déjà téléchargé, passage au suivant: ${asset.name}`);
          window.App.addDownloadedFile(expectedFilePath)
          asset.status = 'SUCCESS';
          resolve({ success: true });
          return;
        }
      } catch (checkError) {
        console.log(`ℹ Impossible de vérifier l'existence du fichier, téléchargement normal`);
      }
      
      const torrentKey = `torrent-${asset.asset_id}-${Date.now()}`
      
      // NETTOYAGE PRÉVENTIF avec les nouvelles méthodes
      console.log(`🧹 Nettoyage préventif pour: ${asset.name}`)
      
      // État de téléchargement local
      let downloadCompleted = false
      let savedFilesCount = 0
      let totalFilesCount = 0

      // Callbacks pour le téléchargement torrent
      const callbacks = {
        onReady: (data: any) => {
          console.log(`📦 Torrent ready: ${asset.name}`)
          totalFilesCount = data.info.files.length
        },
        onProgress: (progress: any) => {
          const torrent = progress.torrents.find((t: any) => t.torrentKey === torrentKey)
          if (torrent) {
            console.log(`📊 ${asset.name}: ${Math.round(torrent.progress * 100)}% - ${torrent.numPeers} peers`)
          }
        },
        onFileSaved: (data: any) => {
          savedFilesCount++
          console.log(`💾 Fichier sauvegardé: ${data.fileName} (${savedFilesCount}/${totalFilesCount})`)
          
          window.App.addDownloadedFile(data.filePath)

          // Si tous les fichiers sont sauvegardés, marquer comme terminé
          if (savedFilesCount >= totalFilesCount && !downloadCompleted) {
            downloadCompleted = true
            console.log(`Téléchargement torrent terminé: ${asset.name}`)
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
            console.log(`Téléchargement torrent terminé: ${asset.name}`)
            resolve({ success: true })
          }
        }
      }

      // Démarrage du téléchargement torrent avec la bonne méthode
      await webTorrentService.startTorrenting(torrentKey, asset.url, callbacks)

      // S'abonner aux mises à jour de progrès global
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
      }, 300000) // 5 minutes timeout
      
    } catch (error: any) {
      console.error(` Erreur démarrage torrent ${asset.name}:`, error)
      resolve({ success: false, error: error?.message || 'Torrent setup failed' })
    }
  })
}

  /**
   * Processus principal de téléchargement
   */
  async downloadAssets(
    assets: Asset[],
    downloadPath: string,
    rescuerId: number,
    callbacks?: DownloadProgressCallback
  ): Promise<Asset[]> {
    
    const completedAssets: Asset[] = []
    callbacks?.onStatusChange?.('downloading now')

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i]

      // Mise à jour de la progression
      callbacks?.onProgress?.(i, i, assets.length)

      // Marquer comme en cours de téléchargement
      asset.status = 'DOWNLOADING'

      try {
        let result: { success: boolean; magnetLink?: string; error?: string }
        
        // Nettoyage du nom du fichier
        asset.name = asset.name.replace(/[\s\/\\:*?"<>|]/g, '_');

        if (this.isMagnetLink(asset.url)) {
          // Téléchargement torrent
          const torrentResult = await this.downloadTorrentFile(asset, downloadPath)
          result = { success: torrentResult.success, error: torrentResult.error }
        } else {
          // Téléchargement HTTP + création magnet
          result = await this.downloadHttpFile(asset, downloadPath)
        }

        if (result.success) {
          asset.status = 'SUCCESS'
          if (result.magnetLink) {
            asset.magnet = result.magnetLink
          }


          completedAssets.push(asset)
          callbacks?.onFileComplete?.(asset, result.magnetLink)
        } else {
          asset.status = 'ABORTED'
          completedAssets.push(asset)
          callbacks?.onError?.(result.error || 'Download failed', asset)
        }

        // Envoi du status update pour cet asset
        // try {
        //   await this.sendStatusUpdate({
        //     asset
        //   })
        // } catch (updateError) {
        //   console.error('Erreur envoi status update:', updateError)
        // }

        // Petit délai entre les téléchargements
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error: any) {
        console.error(`Erreur générale ${asset.name}:`, error)
        asset.status = 'ABORTED'
        completedAssets.push(asset)
        callbacks?.onError?.(error?.message || 'Unknown error', asset)
      }
    }

    // Progression finale
    callbacks?.onProgress?.(assets.length, assets.length, assets.length)
    callbacks?.onStatusChange?.('uploading')
    callbacks?.onComplete?.(completedAssets)

    // console.log(`Téléchargement terminé: ${completedAssets.length}/${assets.length} assets`)
    return completedAssets
  }

  /**
   * Méthode principale pour récupérer et télécharger
   */
  async fetchAndDownload(
    payload: DispatchRequestPayload,
    downloadPath: string,
    callbacks?: DownloadProgressCallback
  ): Promise<Asset[]> {
    try {
      callbacks?.onStatusChange?.('downloading now')
      
      // Récupération de la liste des fichiers via le dispatcher
      const response = await this.fetchDownloadTasks(payload)
      
      if (!response.asset || response.asset.length === 0) {
        throw new Error('Aucun asset à télécharger')
      }

      console.log(`${response.asset.length} assets récupérés de l'API`)

      // Démarrage des téléchargements
      return await this.downloadAssets(
        // response.asset,
        response.asset,
        downloadPath,
        payload.rescuer_id,
        callbacks
      )
    } catch (error: any) {
      console.error('Erreur processus principal:', error)
      callbacks?.onError?.(error?.message || 'Process failed')
      throw error
    }
  }
}

// Export singleton
export const climateDataService = new ClimateDataService()
export default climateDataService