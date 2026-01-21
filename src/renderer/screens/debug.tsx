import { WebTorrentDebugPanel } from "renderer/components/debug/webtorrent-debug-panel";

export function DebugScreen() {
    return (
        <div
            className="flex w-full h-screen p-4 flex-col items-start gap-4 box-border rounded-xl border border-white bg-gradient-to-t from-transparent via-transparent to-black/30 backdrop-blur-[17px] overflow-auto"
            style={{
                background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.00) 50%, rgba(0, 0, 0, 0.30) 100%), rgba(69, 126, 101, 0.75)'
            }}
        >
            <div className="w-full">
                <h1 className="text-xl font-bold text-white mb-4">Debug Panel</h1>
                <WebTorrentDebugPanel />
            </div>
        </div>
    );
}
