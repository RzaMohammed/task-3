import React from 'react';
import { ShieldCheck, AlertTriangle, Check, X } from 'lucide-react';

interface VerificationCardProps {
  status: 'VERIFIED' | 'TAMPERED';
  verification: {
    verified: boolean;
    currentHash: string;
    blockchainHash: string;
  };
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  status,
  verification
}) => {
  const isVerified = status === 'VERIFIED' && verification.verified;

  return (
    <div
      className={`rounded-xl p-6 shadow-xl border transition-all ${
        isVerified
          ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900/60 border-emerald-500/40 shadow-emerald-950/20'
          : 'bg-gradient-to-b from-rose-950/40 to-slate-900/60 border-rose-500/40 shadow-rose-950/20'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl border ${
              isVerified
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {isVerified ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Cryptographic Audit
            </span>
            <h3
              className={`text-xl font-extrabold tracking-tight ${
                isVerified ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isVerified ? '✓ VERIFIED' : '✗ TAMPERED'}
            </h3>
          </div>
        </div>

        <span
          className={`px-3 py-1 text-xs font-mono font-bold rounded-full border self-start sm:self-center ${
            isVerified
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
              : 'bg-rose-950/60 text-rose-300 border-rose-700/50'
          }`}
        >
          {isVerified ? 'HASHES MATCH 100%' : 'HASH MISMATCH DETECTED'}
        </span>
      </div>

      <p className="text-xs text-slate-300 mt-4 leading-relaxed">
        {isVerified
          ? 'The off-chain evidence package was independently canonicalized and hashed. The resulting SHA-256 fingerprint matches the immutable on-chain record stored on Solana Devnet.'
          : 'The calculated SHA-256 fingerprint differs from the on-chain record stored on Solana Devnet. One or more metadata fields have been modified after blockchain anchoring.'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Current Computed Hash</span>
            {isVerified ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-rose-400" />
            )}
          </div>
          <span className="font-mono text-[11px] text-slate-200 break-all bg-slate-900/90 p-2 rounded border border-slate-800/80">
            {verification.currentHash}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">On-Chain Solana Hash</span>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="font-mono text-[11px] text-purple-300 break-all bg-slate-900/90 p-2 rounded border border-slate-800/80">
            {verification.blockchainHash}
          </span>
        </div>
      </div>
    </div>
  );
};
