import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface VerificationSummaryProps {
  status: string;
  similarity: number;
  evidenceId: string;
  transactionSignature: string;
}

export const VerificationSummary: React.FC<VerificationSummaryProps> = ({
  status,
  similarity,
  evidenceId,
  transactionSignature
}) => {
  return (
    <div className="w-full bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg card-shadow animate-pulse-ring transform transition-transform duration-200 hover:scale-105">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
            Verification Pipeline Complete
            <CheckCircle2 className="w-4 h-4" />
          </h3>
          <p className="text-xs text-slate-300">
            Off-chain evidence integrity anchored and validated against Solana Devnet.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-slate-400">Similarity</span>
          <span className="text-emerald-400 font-bold">{(similarity * 100).toFixed(1)}%</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-slate-400">Evidence ID</span>
          <span className="text-slate-200">{evidenceId.slice(0, 10)}...</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-slate-400">Tx Sig</span>
          <span className="text-purple-300">{transactionSignature.slice(0, 8)}...</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-slate-400">Result</span>
          <span className="text-emerald-400 font-bold">{status}</span>
        </div>
      </div>
    </div>
  );
};
