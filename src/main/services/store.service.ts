import Store from "electron-store";

const store = new Store();

/** DOWNLOAD PATH */
export function saveDownloadPath(path: string) {
  store.set("downloadPath", path);
}
export function getDownloadPath(): string | undefined {
  return store.get("downloadPath") as string | undefined;
}
