import { useState, useEffect } from 'react';

interface LoadingBarsProps {
  downloadPath: string | null;
}

export default function LoadingBars({ downloadPath }: LoadingBarsProps) {
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<'waiting' | 'downloading now' | 'uploading'>('waiting');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const totalBars = 10;

  useEffect(() => {


    // get une liste de urls a telecharger
    const fileUrls: string[] = [
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      "https://jsonplaceholder.typicode.com/posts/1",
      "https://jsonplaceholder.typicode.com/users/1"
    ]

    if (fileUrls.length === 0) return;

    const downloadFiles = async () => {
      setCurrentStatus('downloading now');
      
      for (let i = 0; i < fileUrls.length; i++) {
        setCurrentFileIndex(i);
          setCurrentStatus('uploading');
        
        try {
          // Simuler le début du téléchargement
          if (downloadPath) {
            await window.App.downloadFile(fileUrls[i], downloadPath);
          }
          // Passer en mode "uploading" après le téléchargement
          
          // Mettre à jour la progress bar
          const newProgress = Math.floor(((i + 1) / fileUrls.length) * totalBars);
          setProgress(newProgress);
          
          // Petit délai pour voir le changement de statut
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Erreur lors du téléchargement du fichier ${fileUrls[i]}:`, error);
        }
      }
      
      // Tous les téléchargements sont terminés
      setProgress(totalBars);
      setCurrentStatus('uploading');
    };

    downloadFiles();
  }, [downloadPath]);

  const getStatusText = () => {
    switch (currentStatus) {
      case 'downloading now':
        return 'Downloading now';
      case 'uploading':
        return 'Uploading';
      default:
        return 'Downloading now';
    }
  };

  return (
    <div
        className="w-[188px] h-[96px] flex flex-col items-center gap-[24px] pt-[16px] pb-[16px] opacity-100 mb-[39px]"
        style={{ transform: "rotate(0deg)" }}
    >
        
        <div
            className="w-[166px] h-[32px] flex justify-center items-center opacity-100 uppercase text-white font-normal text-[46px] leading-[100%] tracking-[-0.1em]"
            style={{ 
            transform: "rotate(0deg)",
            fontFamily: "LT Railway",
            fontStyle: "normal" 
            }}
        >
            <span>
            Running
            </span>
        </div>

        <div
            className="w-[188px] h-[8px] flex items-center justify-between opacity-100"
            style={{ transform: "rotate(0deg)" }}
            >
                <span
                className="w-[133px] h-[8px] uppercase text-white font-normal text-[11px] font-normal uppercase tracking-[0.1em] leading-[100%] text-center text-white"
                style={{ fontFamily: "Akzidenz-Grotesk Pro" }}
                >
                {getStatusText()}
                </span>

            <div 
            className="flex opacity-100 w-[50px] h-[7px] gap-[2px] items-center justify-between" >
            {Array.from({ length: totalBars }).map((_, index) => (
                <div
                key={index}
                className="h-[7px] transition-colors duration-200"
                style={{
                    width: '0px',
                    borderWidth: '1px',
                    border: index < progress ? '1px solid #FFFFFF' : '1px solid #FFFFFF66',
                    opacity: 1
                }}
                />
            ))}
            </div>

        </div>
    </div>
  );
}