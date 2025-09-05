import { useState } from "react";
import ErrorActions from "./ErrorActions";
import { InitStatus, InitStep } from "renderer/lib/types";
import {
  useInitialization,
  STEP_STATUS_LOADING,
  STEP_STATUS_SUCCESS,
  STEP_STATUS_ERROR,
  STEP_ID_UPLOAD,
} from "renderer/hooks/useInitialization";

const processingIconUrl = new URL('../assets/icons/processing.svg', import.meta.url).href;
const check_markIconUrl = new URL('../assets/icons/check_mark.svg', import.meta.url).href;

import { logger } from "renderer/lib/logger";
import { leadingVariants } from "renderer/tailwind-pattern";

// Props removed - component only displays steps now

const ShelterInitialization = () => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = (error: Error) => {
    logger.error(error.message);
    setHasError(true);
    setError(error);
  };

  const handleSubmitError = () => {
    if (error) {
      logger.info("Error submitted", { error: error.message });
    }
  };

  const { steps, handleRetry } = useInitialization({
    onError: handleError,
  });

  const renderIcon = (status: InitStatus) => {
    switch (status) {
      case STEP_STATUS_LOADING:
        return (
          <img
            src={processingIconUrl}
            className="w-[14px] h-[14px] rotate-0 opacity-100 top-[1px] left-[1px] animate-spin"
            alt="Processing"
          />
        );
      case STEP_STATUS_SUCCESS:
        return (
          <img
            src={check_markIconUrl}
            className="w-[14px] h-[14px] rotate-0 opacity-100 top-[1px] left-[1px]"
            alt="Success"
          />
        );
      case STEP_STATUS_ERROR:
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
    if (step.status === STEP_STATUS_SUCCESS) {
      return `${step.label} : OK`;
    } else if (step.status === STEP_STATUS_LOADING && step.id === STEP_ID_UPLOAD) {
      return `${step.label} : TESTING...`;
    }
    return step.label;
  };

  return (
    <div className="w-full h-[190px] gap-[48px] pt-[16px] flex flex-col items-center">

      <div
        className="w-[166px] h-[36px] flex items-center justify-center opacity-100"
        style={{ transform: "rotate(0deg)" }}
      >
        <span
          className={leadingVariants.title}
          style={{
            fontFamily: "Akzidenz-Grotesk Pro",
            fontSize: "18.57px",
            letterSpacing: '-1%'
          }}
        >
          {hasError ? ("Error, unable to create a shelter") :
            (
              <>
                Creation of
                <br />
                your shelter
              </>
            )}

        </span>
      </div>

      {hasError ? (
        <ErrorActions onRetry={handleRetry} onSubmitError={handleSubmitError} />
      ) : (
        // Steps
        <div className="flex flex-col justify-center items-center w-[138px] h-[64px] gap-[8px]">
          {steps.map((step: InitStep) => (
            <div key={step.id} className="w-[136px] h-[16px] flex items-center gap-[8px]">
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