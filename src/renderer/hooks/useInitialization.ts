import { useState, useEffect } from "react";
import { InitStep } from "renderer/lib/types";
import { logger } from "renderer/lib/logger";

export interface UseInitializationProps {
  onError: (error: Error) => void;
}

interface UseInitializationReturn {
  steps: InitStep[];
  handleRetry: () => void;
}

export type StepStatus = 'loading' | 'success' | 'error';
export const STEP_STATUS_LOADING: StepStatus = 'loading';
export const STEP_STATUS_SUCCESS: StepStatus = 'success';
export const STEP_STATUS_ERROR: StepStatus = 'error';

export type StepId = 'folder' | 'upload' | 'download';
export const STEP_ID_FOLDER: StepId = 'folder';
export const STEP_ID_UPLOAD: StepId = 'upload';
export const STEP_ID_DOWNLOAD: StepId = 'download';

const STEPS: InitStep[] = [
  { id: STEP_ID_FOLDER, label: 'FOLDER ACCESS', status: STEP_STATUS_LOADING } as InitStep,
];

export const useInitialization = ({
  onError,
}: UseInitializationProps): UseInitializationReturn => {
  const [steps, setSteps] = useState<InitStep[]>(STEPS);

  const resetSteps = () => {
    setSteps(STEPS);
    const step = STEPS[0];
  };

  const updateStepStatus = (stepId: string, status: StepStatus) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const handleRetry = async () => {
    resetSteps();
    
    try {
      const result = await window.App.retryInitialization();
      if (!result.success) {
        logger.error('Retry initialization failed', { error: result.error });
      }
    } catch (error: any) {
      logger.error('Failed to retry initialization', { error: error.message });
    }
  };

  // Setup IPC event listeners for steps only
  useEffect(() => {
    const cleanupStepStatus = window.App.onInitializationStepStatus((data) => {
      updateStepStatus(data.stepId, data.status as StepStatus);
    });

    const cleanupError = window.App.onInitializationError((data) => {
      logger.error('Received initialization error', { data });
      if (onError) {
        onError(new Error(data.error));
      }
    });

    return () => {
      cleanupStepStatus();
      cleanupError();
    };
  }, []);

  return {
    steps,
    handleRetry
  };
};
