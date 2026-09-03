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
    <div className="w-full bg-[#0a4629]/90 border-2 border-[#16623a] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl card-shadow animate-pulse-ring transform transition-transform duration-200 hover:scale-[1.01]">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-[#ffd60a]/15 text-[#ffd60a] border border-[#ffd60a]/40 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-[#ffd60a]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#ffd60a] flex items-center gap-1.5 font-display tracking-wide">
              Verification Pipeline Complete
            </h3>
            <span className="goa-badge-hindi px-2 py-0.2 rounded-md text-[10px] font-bold text-white shadow-sm">
              गोवा
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs text-[#cbd5c5] mt-0.5">
            Off-chain biometric evidence integrity anchored and validated against Solana Devnet.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-[#062e1a] px-4 py-2.5 rounded-xl border border-[#16623a]">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-[#cbd5c5]/70">Similarity</span>
          <span className="text-[#ffd60a] font-bold">{(similarity * 100).toFixed(1)}%</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-[#cbd5c5]/70">Evidence ID</span>
          <span className="text-white font-medium">{evidenceId.slice(0, 10)}...</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-[#cbd5c5]/70">Tx Sig</span>
          <span className="text-pink-300 font-medium">{transactionSignature.slice(0, 8)}...</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-[#cbd5c5]/70">Result</span>
          <span className="text-emerald-400 font-bold">{status}</span>
        </div>
      </div>
    </div>
  );
};
