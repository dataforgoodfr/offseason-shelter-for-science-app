import { app } from "electron";

import { makeAppWithSingleInstanceLock } from "lib/electron-app/factories/app/instance";
import { makeAppSetup } from "lib/electron-app/factories/app/setup";
import { MainWindow } from "./windows/main";
import { registerFolderPicker } from "lib/electron-app/factories/ipcs/register-folter-picker";
import { registerDownloadDataset } from "lib/electron-app/factories/ipcs/register-download-dataset";
import { registerManageDownloadPath } from "lib/electron-app/factories/ipcs/register-manage-download-path";
import { registerSeedingManagement } from "lib/electron-app/factories/ipcs/register-seeding-management";

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();

  // Register IPCs
  registerFolderPicker();
  registerManageDownloadPath();
  registerDownloadDataset();
  registerSeedingManagement();

  await makeAppSetup(MainWindow);
});
