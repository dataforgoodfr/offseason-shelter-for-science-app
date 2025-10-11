import { app } from "electron";

import { makeAppWithSingleInstanceLock } from "lib/electron-app/factories/app/instance";
import { makeAppSetup } from "lib/electron-app/factories/app/setup";
import { MainWindow } from "./windows/main";
import { LoggerWindow } from "./windows/logger";

import { registerFolderPicker } from "lib/electron-app/factories/ipcs/register-folter-picker";
import { registerDownloadDataset } from "lib/electron-app/factories/ipcs/register-download-dataset";
import { registerStoreHandler } from "lib/electron-app/factories/ipcs/register-store-handler";
import { registerSeedingManagement } from "lib/electron-app/factories/ipcs/register-seeding-management";
import { loggerService } from "./services/logger";
import { registerDownloadStore } from "lib/electron-app/factories/ipcs/register-download-store";
import { registerSystemInfo } from "lib/electron-app/factories/ipcs/register-system-bandwidth-info";

import { registerDownloadDummy } from "lib/electron-app/factories/ipcs/register-download-dummy";
import { climateDataHandlers } from "lib/electron-app/factories/ipcs/climateDataHandlers";
import { registerInitialization } from "lib/electron-app/factories/ipcs/register-initialization";
import { registerWindowEvents } from "lib/electron-app/factories/ipcs/register-window-events";

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();

  // Register IPCs
  registerFolderPicker();
  registerStoreHandler();
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
  
  // Configure the logging service with the window
  loggerService.setLoggerWindow(loggerWindow);
  
  // Log startup
  loggerService.info('Application started successfully');
});
