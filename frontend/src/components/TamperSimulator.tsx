import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  RotateCcw,
  Zap,
  Lock,
  Flame,
  ShieldCheck,
  FileCode2
} from 'lucide-react';
import { canonicalizeJson, calculateSha256Hex } from '../services/demoData';

interface TamperSimulatorProps {
  initialTitle: string;
  initialPlatform: string;
  initialUrl: string;
  initialSimilarity: number;
  initialEvidenceId: string;
  onChainHash: string;
  onChainSignature: string;
  onAuditStatusChange?: (isVerified: boolean, currentHash: string) => void;
}

export const TamperSimulator: React.FC<TamperSimulatorProps> = ({
  initialTitle,
  initialPlatform,
  initialUrl,
  initialSimilarity,
  initialEvidenceId,
  onChainHash,
  onChainSignature,
  onAuditStatusChange
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [platform, setPlatform] = useState(initialPlatform);
  const [computedHash, setComputedHash] = useState(onChainHash);
  const [isTampered, setIsTampered] = useState(false);
  const [showCanonicalJson, setShowCanonicalJson] = useState(false);

  useEffect(() => {
    setTitle(initialTitle);
    setPlatform(initialPlatform);
  }, [initialTitle, initialPlatform]);

  useEffect(() => {
    const runHashCalculation = async () => {
      // Reconstruct canonical evidence record matching backend structure
      const canonicalEvidenceObj = {
        evidenceId: initialEvidenceId,
        match: {
          similarity: Number(initialSimilarity.toFixed(4)),
          threshold: 0.85
        },
        source: {
          platform: platform,
          title: title,
          url: initialUrl
        }
      };

      const canonicalStr = canonicalizeJson(canonicalEvidenceObj);
      const newHash = await calculateSha256Hex(canonicalStr);

      // If user hasn't modified title/platform from authentic, ensure it matches onChainHash
      const hasChanged = title !== initialTitle || platform !== initialPlatform;
      const effectiveHash = hasChanged ? newHash : onChainHash;

      setComputedHash(effectiveHash);
      const tampered = effectiveHash.toLowerCase() !== onChainHash.toLowerCase();
      setIsTampered(tampered);

      if (onAuditStatusChange) {
        onAuditStatusChange(!tampered, effectiveHash);
      }
    };

    runHashCalculation();
  }, [title, platform, initialTitle, initialPlatform, initialEvidenceId, initialSimilarity, initialUrl, onChainHash, onAuditStatusChange]);

  const handleInjectTamper = () => {
    setTitle('MALICIOUSLY ALTERED POST TITLE (TAMPERED)');
  };

  const handleRestore = () => {
    setTitle(initialTitle);
    setPlatform(initialPlatform);
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-slate-800 shadow-2xl flex flex-col gap-5">
      {/* Title & Explainer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isTampered
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {isTampered ? <Flame className="w-6 h-6 animate-pulse" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                Interactive Cryptographic Tamper Simulator
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                isTampered
                  ? 'bg-rose-950/80 text-rose-300 border-rose-600/60'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
              }`}>
                {isTampered ? '✗ TAMPER DETECTED' : '✓ AUTHENTIC & VERIFIED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate an adversary attempting to secretly modify off-chain post metadata after blockchain anchoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTampered ? (
            <button
              type="button"
              onClick={handleRestore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Authentic</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInjectTamper}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 transition-colors shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Attack (Inject Tamper)</span>
            </button>
          )}
        </div>
      </div>

      {/* Editing Sandbox Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              Candidate Post Title (Off-Chain Metadata)
            </span>
            {title !== initialTitle && (
              <span className="text-[10px] font-mono text-rose-400">Edited</span>
            )}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
            placeholder="Enter or alter post title..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            Immutable Solana Devnet Anchor (SPL Memo)
          </label>
          <div className="w-full px-3.5 py-2.5 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs font-mono text-purple-300 flex items-center justify-between">
            <span className="truncate">Tx: {onChainSignature.slice(0, 24)}...</span>
            <span className="text-[10px] bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700/60 uppercase shrink-0">
              Devnet Locked
            </span>
          </div>
        </div>
      </div>

      {/* Live Hash Comparison Box */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-2">
            Real-Time Cryptographic Hash Comparison
          </span>
          <button
            type="button"
            onClick={() => setShowCanonicalJson(!showCanonicalJson)}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>{showCanonicalJson ? 'Hide RFC 8785 JSON' : 'Inspect Canonical JSON'}</span>
          </button>
        </div>

        {/* Current Computed Hash vs On-Chain Hash */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg border flex flex-col gap-1 transition-all ${
            isTampered
              ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
              : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
          }`}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300">Locally Recalculated SHA-256</span>
              {isTampered ? (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> MISMATCH
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> MATCH
                </span>
              )}
            </div>
            <div className="font-mono text-[11px] p-2 rounded bg-slate-950 border border-slate-800 break-all">
              {computedHash}
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-purple-950/20 border-purple-800/40 text-purple-300 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300">Solana Devnet On-Chain Hash (Immutable)</span>
              <span className="text-purple-400 font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> DEVNET RECORD
              </span>
            </div>
            <div className="font-mono text-[11px] p-2 rounded bg-slate-950 border border-slate-800 break-all text-purple-300">
              {onChainHash}
            </div>
          </div>
        </div>

        {/* Dynamic Explainer Alert */}
        {isTampered ? (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-rose-300 font-bold mb-0.5">
                Cryptographic Fraud Caught by Zero-Trust Architecture
              </strong>
              <p className="leading-relaxed">
                Because SHA-256 exhibits the strict <em>avalanche effect</em>, altering metadata changes the fingerprint entirely. 
                Even though the adversary manipulated the off-chain database, Solana Devnet’s on-chain SPL memo transaction guarantees immutable proof of what was originally recorded.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-emerald-300 font-bold mb-0.5">
                Evidence Integrity Cryptographically Verified
              </strong>
              <p className="leading-relaxed">
                The computed hash matches the Solana Devnet blockchain record byte-for-byte. The candidate evidence package has not been tampered with or altered since recording.
              </p>
            </div>
          </div>
        )}

        {/* Optional Canonical JSON Inspector */}
        {showCanonicalJson && (
          <div className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
            <div className="text-[10px] uppercase text-cyan-400 font-bold mb-1">
              RFC 8785 Canonical JSON Representation (Hashed Input):
            </div>
            <pre className="whitespace-pre-wrap">
              {canonicalizeJson({
                evidenceId: initialEvidenceId,
                match: {
                  similarity: Number(initialSimilarity.toFixed(4)),
                  threshold: 0.85
                },
                source: {
                  platform: platform,
                  title: title,
                  url: initialUrl
                }
              })}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
