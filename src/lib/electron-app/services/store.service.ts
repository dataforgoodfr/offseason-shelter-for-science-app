import Store from "electron-store";

const store = new Store();

export function saveDownloadPath(path: string) {
  store.set("downloadPath", path);
}
export function getDownloadPath(): string | undefined {
  return store.get("downloadPath") as string | undefined;
}

// === SEEDING ===
interface SeedingInfo {
  magnetURI: string;
  name: string;
  torrentKey: string;
  filePath: string;
  lastSeeded: number;
}

export function saveSeedingInfo(filePath: string, info: SeedingInfo) {
  const seedingData = getSeedingData();
  seedingData[filePath] = info;
  store.set("seedingData", seedingData);
}

export function getSeedingData(): Record<string, SeedingInfo> {
  return store.get("seedingData", {}) as Record<string, SeedingInfo>;
}

export function removeSeedingInfo(filePath: string) {
  const seedingData = getSeedingData();
  delete seedingData[filePath];
  store.set("seedingData", seedingData);
}