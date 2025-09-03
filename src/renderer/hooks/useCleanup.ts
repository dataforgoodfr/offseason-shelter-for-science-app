import { useState, useEffect } from "react";
import { InitStep } from "renderer/lib/types";
import { logger } from "renderer/lib/logger";

export interface UseCleanupProps {
  onError: (error: Error) => void;
  onComplete?: () => void;
}

interface UseCleanupReturn {
  steps: InitStep[];
  isCleanupInProgress: boolean;
  startCleanup: () => void;
}

export type StepStatus = 'loading' | 'success' | 'error';
export const STEP_STATUS_INPROGRESS: StepStatus = 'loading';
export const STEP_STATUS_SUCCESS: StepStatus = 'success';
export const STEP_STATUS_ERROR: StepStatus = 'error';

export type CleanupStepId = 'files' | 'datastore';
export const STEP_ID_FILES: CleanupStepId = 'files';
// export const STEP_ID_DATASTORE: CleanupStepId = 'datastore';

const CLEANUP_STEPS: InitStep[] = [
  { id: STEP_ID_FILES, label: 'Cleanup', status: STEP_STATUS_INPROGRESS } as InitStep,
  // { id: STEP_ID_DATASTORE, label: 'Datastore', status: STEP_STATUS_INPROGRESS } as InitStep,
];

export const useCleanup = ({
  onError,
  onComplete,
}: UseCleanupProps): UseCleanupReturn => {
  const [steps, setSteps] = useState<InitStep[]>([]);
  const [isCleanupInProgress, setIsCleanupInProgress] = useState(false);

  const updateStepStatus = (stepId: string, status: StepStatus) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const startCleanup = async () => {
    setIsCleanupInProgress(true);
    setSteps(CLEANUP_STEPS);
  };

  useEffect(() => {
    startCleanup();
  }, []);

  // Setup IPC event listeners for cleanup steps
  useEffect(() => {
    const cleanupFilesSuccess = window.App.onCleanupFilesSuccess(() => {
      updateStepStatus(STEP_ID_FILES, STEP_STATUS_SUCCESS);
      setIsCleanupInProgress(false);
      if (onComplete) {
        onComplete();
      }
    });

    const cleanupError = window.App.onCleanupError((data: { error: string }) => {
      logger.error('Received cleanup error', { data });
      setIsCleanupInProgress(false);
      updateStepStatus(STEP_ID_FILES, STEP_STATUS_ERROR);
      if (onError) {
        onError(new Error(data.error));
      }
    });

    return () => {
      cleanupFilesSuccess();
      cleanupError();
    };
  }, [onError, onComplete]);

  return {
    steps,
    isCleanupInProgress,
    startCleanup
  };
};
