import { RefreshCw, Flag } from "lucide-react";

interface ErrorActionsProps {
  onRetry: () => void;
  onSubmitError: () => void;
}

const ErrorActions: React.FC<ErrorActionsProps> = ({ onRetry, onSubmitError }) => {
  return (
    <div className="flex flex-col gap-2 items-center">
      <button
        onClick={onRetry}
        className="w-[166px] h-[36px] rounded-full bg-black flex items-center justify-center gap-2 text-white"
      >
        <span className="text-sm font-medium">Retry</span>
        <RefreshCw className="w-4 h-4" />
      </button>

      <button
        onClick={onSubmitError}
        className="w-[166px] h-[36px] rounded-full bg-red-700 flex items-center justify-center gap-2 text-white"
      >
        <span className="text-sm font-medium">Submit error</span>
        <Flag className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ErrorActions;
