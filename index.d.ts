/// <reference types="vite/client" />

declare global {
    interface Window {
        electronAPI: {
            downloadTorrent(magnetLink: string, datasetId: string): Promise<any>;
            onTorrentProgress(callback: (datasetId: string, progressData: any) => void): void;
            isDownloading(datasetId: string): Promise<boolean>;
            cancelDownload(datasetId: string): Promise<boolean>;
            getActiveDownloads(): Promise<string[]>;
        };
    }
}

export { };
