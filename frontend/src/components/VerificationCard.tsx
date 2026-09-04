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
      className={`rounded-2xl p-6 shadow-2xl border-2 transition-all ${
        isVerified
          ? 'bg-gradient-to-b from-[#0a4629]/95 via-[#062e1a]/95 to-[#041f11] border-[#16623a] shadow-emerald-950/40'
          : 'bg-gradient-to-b from-[#450a24]/90 via-[#062e1a] to-[#041f11] border-[#ff2a85]/70 shadow-rose-950/40'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-[#16623a]/70">
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-2xl border shadow-inner ${
              isVerified
                ? 'bg-[#ffd60a]/15 border-[#ffd60a]/40 text-[#ffd60a] text-glow-yellow'
                : 'bg-[#ff2a85]/20 border-[#ff2a85]/50 text-[#ff2a85] text-glow-pink'
            }`}
          >
            {isVerified ? (
              <ShieldCheck className="w-8 h-8 text-[#ffd60a]" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-[#ff2a85] animate-bounce" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#cbd5c5]">
                Solana Devnet Zero-Trust Cryptographic Audit
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#041f11] border border-[#16623a] text-[#ffd60a] font-semibold">
                SPL MEMO v2
              </span>
            </div>
            <h3
              className={`text-2xl font-extrabold tracking-tight font-display ${
                isVerified ? 'text-[#ffd60a]' : 'text-[#ff66a8]'
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
          <span className="text-[11px] font-mono text-[#cbd5c5]">
            Algorithm: <strong className="text-[#ffd60a]">SHA-256 (RFC 8785)</strong>
          </span>
        </div>
      </div>

      <p className="text-xs text-[#cbd5c5] mt-4 leading-relaxed">
        {isVerified
          ? 'The candidate evidence package was independently canonicalized and hashed client-side. The resulting SHA-256 fingerprint matches the immutable on-chain record stored on Solana Devnet byte-for-byte.'
          : 'The calculated SHA-256 fingerprint differs from the on-chain record stored on Solana Devnet. One or more metadata attributes (title, timestamp, or platform) have been modified after blockchain anchoring.'}
      </p>

      {/* Side by side hashes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {/* Recalculated Hash */}
        <div className="p-4 rounded-xl bg-[#041f11] border border-[#16623a] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#cbd5c5] font-semibold flex items-center gap-1.5">
              Current Recalculated Hash
            </span>
            <div className="flex items-center gap-2">
              {isVerified ? (
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Valid
                </span>
              ) : (
                <span className="text-[#ff66a8] text-xs font-semibold flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Tampered
                </span>
              )}
              <CopyButton text={verification.currentHash} label="Copy" />
            </div>
          </div>
          <div className={`font-mono text-xs break-all p-2.5 rounded-lg border ${
            isVerified
              ? 'bg-[#062e1a] text-emerald-300 border-emerald-800/60'
              : 'bg-[#ff2a85]/15 text-[#ff66a8] border-[#ff2a85]/40'
          }`}>
            {verification.currentHash}
          </div>
        </div>

        {/* Blockchain Hash */}
        <div className="p-4 rounded-xl bg-[#041f11] border border-[#16623a] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#cbd5c5] font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#ffd60a]" />
              Solana Devnet On-Chain Record
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[#ffd60a] text-xs font-semibold flex items-center gap-1">
                <Blocks className="w-3.5 h-3.5" /> Immutable
              </span>
              <CopyButton text={verification.blockchainHash} label="Copy" />
            </div>
          </div>
          <div className="font-mono text-xs text-[#ffd60a] break-all bg-[#062e1a] p-2.5 rounded-lg border border-[#16623a]">
            {verification.blockchainHash}
          </div>
        </div>
      </div>
    </div>
  );
};
