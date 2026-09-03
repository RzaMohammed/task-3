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
  Circle,
  Activity
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
  activeStatusText: string;
  icon: React.ElementType;
  timingKey?: keyof PipelineTiming;
}

const STAGE_CONFIGS: StageConfig[] = [
  {
    key: 'faceAnalysis',
    number: '1',
    title: 'FACE ANALYSIS',
    description: 'InsightFace Buffalo_L detection & 512-D embedding',
    activeStatusText: 'Detecting landmarks & generating 512-D vector...',
    icon: ScanFace,
    timingKey: 'faceAnalysisMs'
  },
  {
    key: 'webSearch',
    number: '2',
    title: 'WEB SEARCH',
    description: 'Visual web & social media candidate discovery',
    activeStatusText: 'Querying visual search engine for matches...',
    icon: Globe,
    timingKey: 'webSearchMs'
  },
  {
    key: 'matching',
    number: '3',
    title: 'FACE MATCHING',
    description: 'Cosine similarity scoring (Threshold ≥ 85%)',
    activeStatusText: 'Evaluating candidate face embeddings...',
    icon: Users,
    timingKey: 'matchingMs'
  },
  {
    key: 'evidence',
    number: '4',
    title: 'EVIDENCE PACKAGE',
    description: 'Canonical RFC 8785 JSON & SHA-256 fingerprint',
    activeStatusText: 'Canonicalizing metadata & computing SHA-256...',
    icon: Fingerprint,
    timingKey: 'evidenceMs'
  },
  {
    key: 'blockchain',
    number: '5',
    title: 'SOLANA DEVNET',
    description: 'On-chain SPL Memo immutable transaction broadcast',
    activeStatusText: 'Broadcasting memo proof to Solana Devnet cluster...',
    icon: Blocks,
    timingKey: 'blockchainMs'
  },
  {
    key: 'verification',
    number: '6',
    title: 'CRYPTOGRAPHIC AUDIT',
    description: 'Independent hash recalculation & provenance audit',
    activeStatusText: 'Auditing off-chain hash against Solana Devnet...',
    icon: ShieldCheck,
    timingKey: 'verificationMs'
  }
];

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  stages,
  timing,
  isRunning = false
}) => {
  // Calculate completed count
  const completedCount = Object.values(stages).filter((s) => s === 'COMPLETED').length;
  const isAnyFailed = Object.values(stages).some((s) => s === 'FAILED');
  const progressPercent = Math.round((completedCount / STAGE_CONFIGS.length) * 100);

  // Active running stage text
  const activeStage = STAGE_CONFIGS.find((stg) => stages[stg.key] === 'PROCESSING');

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-[#16623a] shadow-xl flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#16623a]/70 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#ffd60a]" />
          <h3 className="text-xs font-bold text-[#ffd60a] uppercase tracking-wider">
            Pipeline Execution Stages ({completedCount}/{STAGE_CONFIGS.length})
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {isRunning && activeStage && (
            <span className="text-xs font-mono text-[#ffd60a] animate-pulse flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ffd60a]" />
              <span>{activeStage.activeStatusText}</span>
            </span>
          )}

          {timing?.totalMs !== undefined && timing.totalMs > 0 && !isRunning && (
            <span className="text-xs font-mono text-[#cbd5c5] bg-[#041f11] px-2.5 py-1 rounded-lg border border-[#16623a]">
              Total Time: <span className="text-[#ffd60a] font-bold">{timing.totalMs} ms</span>
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-[#041f11] rounded-full overflow-hidden border border-[#16623a]">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isAnyFailed
              ? 'bg-[#ff2a85]'
              : progressPercent === 100
              ? 'bg-gradient-to-r from-emerald-500 via-[#ffd60a] to-[#ff2a85]'
              : 'bg-gradient-to-r from-[#ffd60a] to-emerald-400'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {STAGE_CONFIGS.map((stg) => {
          const status = stages[stg.key];
          const Icon = stg.icon;
          const stageDuration = timing && stg.timingKey ? timing[stg.timingKey] : undefined;

          let cardStyle = 'bg-[#041f11]/60 border-[#16623a]/60 text-[#cbd5c5]/50';
          let iconWrapper = 'bg-[#062e1a] border-[#16623a] text-[#cbd5c5]/60';

          if (status === 'COMPLETED') {
            cardStyle = 'bg-[#0a4629]/70 border-[#16623a] text-emerald-300 shadow-sm';
            iconWrapper = 'bg-[#084d2a] border-[#16623a] text-[#ffd60a]';
          } else if (status === 'PROCESSING') {
            cardStyle = 'bg-[#ffd60a]/15 border-[#ffd60a] text-[#ffd60a] ring-1 ring-[#ffd60a]/60 shadow-lg shadow-yellow-950/40 animate-pulse';
            iconWrapper = 'bg-[#ffd60a]/25 border-[#ffd60a] text-[#ffd60a]';
          } else if (status === 'FAILED') {
            cardStyle = 'bg-[#ff2a85]/15 border-[#ff2a85]/60 text-[#ff66a8] shadow-sm';
            iconWrapper = 'bg-[#ff2a85]/20 border-[#ff2a85]/40 text-[#ff2a85]';
          }

          return (
            <div
              key={stg.key}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${cardStyle}`}
            >
              <div className={`p-2 rounded-xl border ${iconWrapper} shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[#fdfbf7] truncate">
                    {stg.number}. {stg.title}
                  </span>
                  {status === 'COMPLETED' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {status === 'PROCESSING' && (
                    <Loader2 className="w-4 h-4 text-[#ffd60a] animate-spin shrink-0" />
                  )}
                  {status === 'FAILED' && (
                    <XCircle className="w-4 h-4 text-[#ff2a85] shrink-0" />
                  )}
                  {status === 'PENDING' && (
                    <Circle className="w-3.5 h-3.5 text-[#16623a] shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-[#cbd5c5] truncate mt-0.5">
                  {stg.description}
                </p>

                {stageDuration !== undefined && stageDuration > 0 && (
                  <span className="text-[10px] font-mono text-[#ffd60a] font-semibold mt-1 inline-block bg-[#041f11] px-1.5 py-0.5 rounded border border-[#16623a]">
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
