import React from 'react';
import { ShieldCheck, AlertTriangle, Check, X, Blocks, Lock } from 'lucide-react';
import { CopyButton } from './CopyButton';

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

  // Calculate matching characters
  const h1 = verification.currentHash || '';
  const h2 = verification.blockchainHash || '';
  let matchCount = 0;
  for (let i = 0; i < Math.min(h1.length, h2.length); i++) {
    if (h1[i] === h2[i]) matchCount++;
  }
  const matchPct = h1.length > 0 ? ((matchCount / Math.max(h1.length, h2.length)) * 100).toFixed(0) : '0';

  return (
    <div
      className={`rounded-2xl p-6 shadow-2xl border transition-all ${
        isVerified
          ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900/80 to-slate-950 border-emerald-500/40 shadow-emerald-950/20'
          : 'bg-gradient-to-b from-rose-950/40 via-slate-900/80 to-slate-950 border-rose-500/40 shadow-rose-950/20'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-800">
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-2xl border shadow-inner ${
              isVerified
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-glow-emerald'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 text-glow-rose'
            }`}
          >
            {isVerified ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Solana Devnet Zero-Trust Cryptographic Audit
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-purple-300">
                SPL MEMO v2
              </span>
            </div>
            <h3
              className={`text-2xl font-extrabold tracking-tight ${
                isVerified ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isVerified ? '✓ CRYPTOGRAPHICALLY VERIFIED' : '✗ TAMPERED (AUDIT FAILED)'}
            </h3>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-1">
          <span
            className={`px-3.5 py-1 text-xs font-mono font-bold rounded-full border self-start sm:self-auto shadow-sm ${
              isVerified
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                : 'bg-rose-950/80 text-rose-300 border-rose-600/60'
            }`}
          >
            {isVerified ? 'HASHES MATCH 100%' : `MISMATCH (${matchPct}% CHAR MATCH)`}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Algorithm: <strong className="text-slate-200">SHA-256 (RFC 8785)</strong>
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 mt-4 leading-relaxed">
        {isVerified
          ? 'The candidate evidence package was independently canonicalized and hashed client-side. The resulting SHA-256 fingerprint matches the immutable on-chain record stored on Solana Devnet byte-for-byte.'
          : 'The calculated SHA-256 fingerprint differs from the on-chain record stored on Solana Devnet. One or more metadata attributes (title, timestamp, or platform) have been modified after blockchain anchoring.'}
      </p>

      {/* Side by side hashes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {/* Recalculated Hash */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              Current Recalculated Hash
            </span>
            <div className="flex items-center gap-2">
              {isVerified ? (
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Valid
                </span>
              ) : (
                <span className="text-rose-400 text-xs font-semibold flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Tampered
                </span>
              )}
              <CopyButton text={verification.currentHash} label="Copy" />
            </div>
          </div>
          <div className={`font-mono text-xs break-all p-2.5 rounded-lg border ${
            isVerified
              ? 'bg-slate-900/90 text-emerald-300 border-emerald-900/60'
              : 'bg-rose-950/40 text-rose-300 border-rose-900/60'
          }`}>
            {verification.currentHash}
          </div>
        </div>

        {/* Blockchain Hash */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              Solana Devnet On-Chain Record
            </span>
            <div className="flex items-center gap-2">
              <span className="text-purple-400 text-xs font-semibold flex items-center gap-1">
                <Blocks className="w-3.5 h-3.5" /> Immutable
              </span>
              <CopyButton text={verification.blockchainHash} label="Copy" />
            </div>
          </div>
          <div className="font-mono text-xs text-purple-300 break-all bg-purple-950/30 p-2.5 rounded-lg border border-purple-900/60">
            {verification.blockchainHash}
          </div>
        </div>
      </div>
    </div>
  );
};
