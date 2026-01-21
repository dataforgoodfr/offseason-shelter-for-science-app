import { app, session } from "electron";

import { makeAppWithSingleInstanceLock } from "lib/electron-app/factories/app/instance";
import { makeAppSetup } from "lib/electron-app/factories/app/setup";
import { MainWindow } from "./windows/main";
import { LoggerWindow } from "./windows/logger";
import { DebugWindow } from "./windows/debug";
import { HiddenWindow } from "./windows/hidden";

import { registerFolderPicker } from "lib/electron-app/factories/ipcs/register-folter-picker";
import { registerDownloadDataset } from "lib/electron-app/factories/ipcs/register-download-dataset";
import { registerManageDownloadPath } from "lib/electron-app/factories/ipcs/register-manage-download-path";
import { registerSeedingManagement } from "lib/electron-app/factories/ipcs/register-seeding-management";
import { loggerService } from "./services/logger";
import { registerDownloadStore } from "lib/electron-app/factories/ipcs/register-download-store";
import { registerSystemInfo } from "lib/electron-app/factories/ipcs/register-system-bandwidth-info";

import { registerDownloadDummy } from "lib/electron-app/factories/ipcs/register-download-dummy";
import { climateDataHandlers } from "lib/electron-app/factories/ipcs/climateDataHandlers";
import { registerInitialization } from "lib/electron-app/factories/ipcs/register-initialization";
import { registerWindowEvents } from "lib/electron-app/factories/ipcs/register-window-events";
import { getDownloadPath } from "./services/store.service";

import path from "path";
import { ENVIRONMENT } from "shared/constants";
import { registerWindowCommunication } from "lib/electron-app/factories/ipcs/register-window-communication";

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();

  // Register IPCs
  registerFolderPicker();
  registerManageDownloadPath();
  registerDownloadDataset();
  registerSeedingManagement();
  registerDownloadStore();
  registerSystemInfo(); 
  registerDownloadDummy();
  climateDataHandlers();
  registerInitialization();
  registerWindowEvents();
  
  // Create and configure the windows
  const mainWindow = await makeAppSetup(MainWindow);
  const loggerWindow = await LoggerWindow();
  const hiddenWindow = await HiddenWindow();

  registerWindowCommunication(new Map([
    ['main', mainWindow],
    ['logger', loggerWindow],
    ['hidden', hiddenWindow],
  ]));

  if (ENVIRONMENT.IS_DEV) {
    const debugWindow = await DebugWindow();
  }
  
  // Configure the logging service with the window
  loggerService.setLoggerWindow(loggerWindow);

  const downloadPath = getDownloadPath();
  if (downloadPath) {
    loggerService.setOutputFile(path.join(downloadPath, 'log', 'app.log'));
  }
  
  // Log startup
  loggerService.info('Application started successfully');

  loggerService.info("USER DATA PATH: " + app.getPath('userData'));

  // Clear filesystem storage on quit to avoid accumulation of torrent chunks
  app.on('before-quit', async () => {
    await session.defaultSession.clearStorageData({storages: ['filesystem']});
  });
});
