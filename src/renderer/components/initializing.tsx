import { useEffect, useState } from "react";
import { Settings, Check, RotateCw } from "lucide-react";
import ErrorActions from "./ErrorActions";

// Types pour les états d'initialisation
type InitStatus = 'loading' | 'success' | 'error';

interface InitStep {
  id: string;
  label: string;
  status: InitStatus;
}

const ShelterInitialization = () => {
  const [steps, setSteps] = useState<InitStep[]>([
    { id: 'download', label: 'DOWNLOAD', status: 'loading' },
    { id: 'folder', label: 'FOLDER ACCESS', status: 'loading' },
    { id: 'upload', label: 'UPLOAD', status: 'loading' }
  ]);
  const [hasError, setHasError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const handleRetry = () => {
    setHasError(false);
    setSteps([
      { id: 'download', label: 'DOWNLOAD', status: 'loading' },
      { id: 'folder', label: 'FOLDER ACCESS', status: 'loading' },
      { id: 'upload', label: 'UPLOAD', status: 'loading' }
    ]);
    setRetryTrigger(prev => prev + 1);
  };

  const handleSubmitError = () => {
    console.log("Error submitted"); 
  };


// Simulation de l'initialisation progressive
useEffect(() => {
  const simulateInit = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSteps(prev => prev.map(step => 
        step.id === 'download' ? { ...step, status: 'success' } : step
      ));

      // ce commentaire est pour tester le cas où il ya une erreur lors des simulations, les endpoints seront connectés plus tard
      // if (true) throw new Error('Simulation error');

      await new Promise(resolve => setTimeout(resolve, 1500));
      setSteps(prev => prev.map(step => 
        step.id === 'folder' ? { ...step, status: 'success' } : step
      ));

      await new Promise(resolve => setTimeout(resolve, 1000));
      setSteps(prev => prev.map(step => 
        step.id === 'upload' ? { ...step, status: 'success' } : step
      ));
    } catch (error) {
      setHasError(true);
    }
  };

  simulateInit();
}, [retryTrigger]);

  const renderIcon = (status: InitStatus) => {
    switch (status) {
      case 'loading':
        return <RotateCw className="w-[14px] h-[14px] rotate-0 opacity-100 top-[1px] left-[1px] animate-spin" />;
      case 'success':
        return <Check className="w-[14px] h-[14px] rotate-0 opacity-100 top-[1px] left-[1px]" />;
      case 'error':
        return <div className="w-[14px] h-[14px] rotate-0 opacity-100 top-[1px] left-[1px] rounded-full bg-red-500" />;
      default:
        return <RotateCw className="w-[14px] h-[14px] rotate-0 opacity-100 top-[1px] left-[1px] animate-spin" />;
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