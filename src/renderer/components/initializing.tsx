import { useEffect, useState } from "react";
import ErrorActions from "./ErrorActions";
import { InitStatus, InitStep } from "renderer/lib/types";


const processingIconUrl = new URL('../assets/icons/processing.svg', import.meta.url).href;
const check_markIconUrl = new URL('../assets/icons/check_mark.svg', import.meta.url).href;
interface StorageProps {
  selectedPath: string | null;
  setIsRunning: (isRunning: boolean) => void;
  setFreeSpace: (freeSpace: number) => void;
  setIsInitializing: (isInitializing: boolean) => void;
}

const ShelterInitialization = ({ selectedPath, setIsRunning, setFreeSpace, setIsInitializing }: StorageProps) => {
  const [steps, setSteps] = useState<InitStep[]>([
    // { id: 'download', label: 'DOWNLOAD', status: 'loading' },
    { id: 'folder', label: 'FOLDER ACCESS', status: 'loading' },
    // { id: 'upload', label: 'UPLOAD', status: 'loading' }
  ]);
  const [hasError, setHasError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const handleRetry = () => {
    setHasError(false);
    setSteps([
      // { id: 'download', label: 'DOWNLOAD', status: 'loading' },
      { id: 'folder', label: 'FOLDER ACCESS', status: 'loading' },
      // { id: 'upload', label: 'UPLOAD', status: 'loading' }
    ]);
    setRetryTrigger(prev => prev + 1);
  };

  const handleSubmitError = () => {
    console.info("Error submitted"); 
  };

  useEffect(() => {
    const checkFolder = async () => {
      if (selectedPath) {
        try {
          setSteps(prev => prev.map(step => 
            step.id === 'folder' ? { ...step, status: 'loading' } : step
          ));
          const freeBytes = await window.App.getFreeSpace(selectedPath);
          
          await new Promise(resolve => setTimeout(resolve, 500));
          if (freeBytes) {
            setFreeSpace(freeBytes);
            setSteps(prev => prev.map(step => 
              step.id === 'folder' ? { ...step, status: 'success' } : step
            ));

            await new Promise(resolve => setTimeout(resolve, 500));

            setIsRunning(true)
            setIsInitializing(false)
          }

        } catch (error) {
          console.error('Failed to get free space for path:', selectedPath);
          setHasError(true);
          
          setSteps(prev => prev.map(step => 
            step.id === 'folder' ? { ...step, status: 'error' } : step
          ));

          setIsRunning(false)
          setIsInitializing(true)
        }
      }
    };

    checkFolder();
  }, []);

  const renderIcon = (status: InitStatus) => {
    switch (status) {
      case 'loading':
        return (
          <img 
            src={processingIconUrl}
            className="w-[14px] h-[14px] rotate-0 opacity-100 top-[1px] left-[1px] animate-spin" 
            alt="Processing"
          />
        );
      case 'success':
        return (
          <img 
            src={check_markIconUrl} 
            className="w-[14px] h-[14px] rotate-0 opacity-100 top-[1px] left-[1px]" 
            alt="Success"
          />
        );
      case 'error':
        return <div className="w-[14px] h-[14px] rotate-0 opacity-100 top-[1px] left-[1px] rounded-full bg-red-500" />;
      default:
        return (
          <img 
            src={processingIconUrl}
            className="w-[14px] h-[14px] rotate-0 opacity-100 top-[1px] left-[1px] animate-spin" 
            alt="Processing"
          />
        );
    }
  };

  const getStatusText = (step: InitStep) => {
    if (step.status === 'success') {
      return `${step.label} : OK`;
    } else if (step.status === 'loading' && step.id === 'upload') {
      return `${step.label} : TESTING...`;
    }
    return step.label;
  };

  return (
    <div className="w-[188px] h-[190px] gap-[48px] pt-[16px] flex flex-col items-center">

      <div
        className="w-[166px] h-[36px] flex items-center justify-center opacity-100"
        style={{ transform: "rotate(0deg)" }}
      >
        <span
          className="text-white font-medium text-center leading-[100%] tracking-[-0.01em]"
          style={{
            fontFamily: "Akzidenz-Grotesk Pro",
            fontSize: "18.57px",
            letterSpacing: '-1%'
          }}
        >
          {hasError ? ("Error, unable to create a shelter") :
          (
            <>
              Initialization
              <br />
              of your shelter
            </>
          )}
          
        </span>
      </div>

      {hasError ? (
        <ErrorActions onRetry={handleRetry} onSubmitError={handleSubmitError} />
      ) : (
        // Steps
        <div className="flex flex-col justify-center items-center w-[138px] h-[64px] gap-[8px]">
          {steps.map((step) => (
            <div key={step.id} className=" w-[136px] h-[16px] gap-[8px] flex items-center gap-3">
              <div className="text-white">
                {renderIcon(step.status)}
              </div>

              <div
                className="w-[85px] h-[6px] flex items-center opacity-100 whitespace-nowrap"
                style={{ transform: "rotate(0deg)" }}
              >
                <span
                  className="text-[9px] font-normal uppercase tracking-[0.1em] leading-[100%] text-white"
                  style={{ fontFamily: "Akzidenz-Grotesk Pro" }}
                >
                  {getStatusText(step)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    
    </div>
  );
};

export default ShelterInitialization;