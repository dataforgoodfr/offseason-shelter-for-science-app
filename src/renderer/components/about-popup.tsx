interface AboutPopupProps {
    onStopHosting: () => void;
    onContactUs: () => void;
    onGoToWebsite: () => void;
}

export default function AboutPopup({ onStopHosting, onContactUs, onGoToWebsite }: AboutPopupProps) {
    // Icons
    const stopIconUrl = new URL('../assets/icons/stop.svg', import.meta.url).href;
    const mailIconUrl = new URL('../assets/icons/mail.svg', import.meta.url).href;
    const webIconUrl = new URL('../assets/icons/web.svg', import.meta.url).href;

    const handleStopHosting = () => {
        onStopHosting();
    };

    const handleContactUs = () => {
        console.log('Contact us clicked');
        onContactUs();
    };

    const handleGoToWebsite = () => {
        console.log('Go to website clicked');
        onGoToWebsite();
    };

    return (
        <div className="about-popup absolute top-0 right-5 z-50 w-46 bg-black text-white rounded-lg shadow-lg p-2"
            style={{ fontFamily: "Akzidenz-Grotesk Pro" }}
        >
            <div
                className="flex items-center gap-3 px-4 py-2 hover:bg-[#9D000380] cursor-pointer transition-colors"
                onClick={handleStopHosting}
            >
                <img src={stopIconUrl} alt="Stop" className="w-4 h-4" />
                <span className="text-sm">Stop hosting</span>
            </div>

            <div
                className="flex items-center gap-3 px-4 py-2 hover:bg-[#9D000380] cursor-pointer transition-colors"
                onClick={handleContactUs}
            >
                <img src={mailIconUrl} alt="Mail" className="w-4 h-4" />
                <span className="text-sm">Contact us</span>
            </div>

            <div
                className="flex items-center gap-3 px-4 py-2 hover:bg-[#9D000380] cursor-pointer transition-colors"
                onClick={handleGoToWebsite}
            >
                <img src={webIconUrl} alt="Web" className="w-4 h-4" />
                <span className="text-sm">Go to website</span>
            </div>
        </div>
    );
}