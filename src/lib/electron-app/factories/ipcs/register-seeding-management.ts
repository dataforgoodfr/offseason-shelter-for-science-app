import { ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import {
  getSeedingData,
  saveSeedingInfo,
  removeSeedingInfo,
} from "main/services/store.service";

export function registerSeedingManagement() {
  // Sauvegarder les infos de seeding
  ipcMain.handle("save-seeding-info", async (_event, filePath: string, info: any) => {
    try {
      saveSeedingInfo(filePath, info);
      console.log('✅ Seeding info sauvegardée pour:', info.name);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde seeding info:', error);
      return { success: false, error: error.message };
    }
  });

  // Récupérer toutes les données de seeding
  ipcMain.handle("get-seeding-data", async () => {
    try {
      const data = getSeedingData();
      console.log(data);
      console.log('📊 Récupération des données de seeding:', Object.keys(data).length, 'fichiers');
      return data;
    } catch (error: any) {
      console.error('❌ Erreur récupération seeding data:', error);
      return {};
    }
  });

  // Supprimer les infos de seeding
  ipcMain.handle("remove-seeding-info", async (_event, filePath: string) => {
    try {
      removeSeedingInfo(filePath);
      console.log('🗑️ Seeding info supprimée pour:', filePath);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Erreur suppression seeding info:', error);
      return { success: false, error: error.message };
    }
  });

  // Scanner un dossier pour trouver les fichiers à seeder
  ipcMain.handle("scan-directory-for-seeding", async (_event, directoryPath: string) => {
    try {
      if (!fs.existsSync(directoryPath)) {
        return { success: false, error: 'Le dossier n\'existe pas' };
      }

      const files: string[] = [];
      const items = fs.readdirSync(directoryPath);

      for (const item of items) {
        const fullPath = path.join(directoryPath, item);
        const stats = fs.statSync(fullPath);
        
        // Ne prendre que les fichiers (pas les dossiers)
        if (stats.isFile()) {
          files.push(fullPath);
        }
      }

      console.log('🔍 Scan dossier:', directoryPath, '→', files.length, 'fichiers trouvés');
      return { success: true, files };
    } catch (error: any) {
      console.error('❌ Erreur scan dossier:', error);
      return { success: false, error: error.message };
    }
  });
}