import React, { useState } from 'react';

/*
    This component is used to download a file from a URL.
*/

interface DummyDownloaderProps {
    downloadPath: string;
    fileName?: string;
}

export const DummyDownloader: React.FC<DummyDownloaderProps> = ({ downloadPath }) => {
    const [url, setUrl] = useState("");

    return (
        <div className="dummy-downloader text-white akzidenz-grotesk-pro text-[10px] gap-1 cursor-pointer">
            <input type="text" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
            <button
                className="rounded-full py-1.5 px-1 bg-[#737372]"
                onClick={() => {
                    window.App.downloadFile(url, downloadPath);
                }}>
                Download
            </button>
        </div>
    );
};