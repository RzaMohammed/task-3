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
    <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-6 shadow-xl flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
              {failedStage ? `Failed Stage: ${failedStage.toUpperCase()}` : 'Pipeline Halted'}
            </span>
            <h4 className="text-base font-bold text-slate-100 mt-0.5">
              {status.replace(/_/g, ' ')}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>

      <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
        <p className="leading-relaxed">{message}</p>
        {details && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 font-mono text-[11px] text-slate-400 flex flex-wrap gap-3">
            {Object.entries(details).map(([key, val]) => (
              <span key={key}>
                {key}: <strong className="text-slate-200">{String(val)}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
