import React from 'react';
import {
  ScanFace,
  Globe,
  Users,
  Fingerprint,
  Blocks,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle
} from 'lucide-react';
import { PipelineStages, PipelineTiming } from '../types/pipeline';

interface PipelineProgressProps {
  stages: PipelineStages;
  timing?: Partial<PipelineTiming>;
  isRunning?: boolean;
}

interface StageConfig {
  key: keyof PipelineStages;
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
  timingKey?: keyof PipelineTiming;
}

const STAGE_CONFIGS: StageConfig[] = [
  {
    key: 'faceAnalysis',
    number: '1',
    title: 'FACE ANALYSIS',
    description: 'InsightFace detection & 512-D embedding',
    icon: ScanFace,
    timingKey: 'faceAnalysisMs'
  },
  {
    key: 'webSearch',
    number: '2',
    title: 'WEB SEARCH',
    description: 'Visual web & social media candidate search',
    icon: Globe,
    timingKey: 'webSearchMs'
  },
  {
    key: 'matching',
    number: '3',
    title: 'FACE MATCHING',
    description: 'Cosine similarity scoring & threshold filtering',
    icon: Users,
    timingKey: 'matchingMs'
  },
  {
    key: 'evidence',
    number: '4',
    title: 'EVIDENCE PACKAGE',
    description: 'Canonical JSON normalization & SHA-256 hash',
    icon: Fingerprint,
    timingKey: 'evidenceMs'
  },
  {
    key: 'blockchain',
    number: '5',
    title: 'SOLANA DEVNET',
    description: 'On-chain SPL Memo transaction broadcast',
    icon: Blocks,
    timingKey: 'blockchainMs'
  },
  {
    key: 'verification',
    number: '6',
    title: 'VERIFICATION',
    description: 'Independent hash recalculation & audit',
    icon: ShieldCheck,
    timingKey: 'verificationMs'
  }
];

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  stages,
  timing
}) => {
  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          Pipeline Execution Stages
        </h3>
        {timing?.totalMs !== undefined && timing.totalMs > 0 && (
          <span className="text-xs font-mono text-slate-400">
            Total: <span className="text-cyan-400 font-medium">{timing.totalMs} ms</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {STAGE_CONFIGS.map((stg) => {
          const status = stages[stg.key];
          const Icon = stg.icon;
          const stageDuration = timing && stg.timingKey ? timing[stg.timingKey] : undefined;

          let statusBg = 'bg-slate-950/40 border-slate-800/80 text-slate-400';
          let iconColor = 'text-slate-500';

          if (status === 'COMPLETED') {
            statusBg = 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300';
            iconColor = 'text-emerald-400';
          } else if (status === 'PROCESSING') {
            statusBg = 'bg-cyan-950/30 border-cyan-700/50 text-cyan-200 animate-pulse';
            iconColor = 'text-cyan-400';
          } else if (status === 'FAILED') {
            statusBg = 'bg-rose-950/20 border-rose-800/40 text-rose-300';
            iconColor = 'text-rose-400';
          }

          return (
            <div
              key={stg.key}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${statusBg}`}
            >
              <div className={`p-2 rounded-md bg-slate-900 border border-slate-800 ${iconColor} shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {stg.number}. {stg.title}
                  </span>
                  {status === 'COMPLETED' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {status === 'PROCESSING' && (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                  )}
                  {status === 'FAILED' && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  {status === 'PENDING' && (
                    <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {stg.description}
                </p>

                {stageDuration !== undefined && stageDuration > 0 && (
                  <span className="text-[10px] font-mono text-cyan-400/80 mt-1 inline-block">
                    {stageDuration} ms
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
