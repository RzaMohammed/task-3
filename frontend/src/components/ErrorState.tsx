import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { PipelineStatus } from '../types/pipeline';

interface ErrorStateProps {
  status: PipelineStatus;
  failedStage?: string;
  message: string;
  details?: Record<string, unknown>;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  status,
  failedStage,
  message,
  details,
  onRetry
}) => {
  return (
    <div className="bg-[#450a24]/80 border-2 border-[#ff2a85]/60 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#ff2a85]/20 text-[#ff2a85] border border-[#ff2a85]/40 shadow-inner">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#ff66a8] font-bold block">
              {failedStage ? `Failed Stage: ${failedStage.toUpperCase()}` : 'Pipeline Halted'}
            </span>
            <h4 className="text-base font-bold text-[#fdfbf7] mt-0.5 flex items-center gap-2 font-display">
              {status.replace(/_/g, ' ')}
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#ff2a85] text-white font-bold uppercase shadow-sm">
                Error
              </span>
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-xl bg-[#ffd60a] hover:bg-[#ffea75] text-[#062e1a] shadow-md transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>

      <div className="p-3.5 rounded-xl bg-[#041f11] border border-[#16623a] text-xs text-[#cbd5c5]">
        <p className="leading-relaxed">{message}</p>
        {details && (
          <div className="mt-2.5 pt-2.5 border-t border-[#16623a] font-mono text-[11px] text-[#cbd5c5] flex flex-wrap gap-3">
            {Object.entries(details).map(([key, val]) => (
              <span key={key}>
                {key}: <strong className="text-[#ffd60a]">{String(val)}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
