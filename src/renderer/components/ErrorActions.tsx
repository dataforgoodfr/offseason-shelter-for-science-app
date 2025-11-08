import { RefreshCw, Flag } from "lucide-react";

interface ErrorActionsProps {
  onRetry: () => void;
  onSubmitError: () => void;
}
const flag = new URL('../assets/icons/flag.svg', import.meta.url).href;
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
          className="w-31 h-8 rounded-full border-2 flex items-center justify-between rotate-0 opacity-100 py-2 px-3 text-white"
          style={{
            background: '#9D0003',
            border: '2px solid #D50003'
          }}
        >
          <span 
            className="text-sm font-normal leading-none tracking-normal rotate-0 opacity-100"
            style={{
              fontFamily: 'Akzidenz-Grotesk Pro'
            }}
          >Submit error</span>
          <img 
            src={flag} 
            alt="flag" 
            className="w-3 h-3 rotate-0 opacity-100"
          />
        </button>
    </div>
  );
};

export default ErrorActions;
