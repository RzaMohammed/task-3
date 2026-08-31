import React from 'react';
import { Fingerprint } from 'lucide-react';
import { CopyButton } from './CopyButton';

interface EvidenceCardProps {
  evidence: {
    evidenceId: string;
    algorithm: string;
    hash: string;
  };
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-cyan-400" />
          Evidence Fingerprint
        </h4>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
          {evidence.algorithm}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs">Evidence ID</span>
            <span className="text-slate-200 font-mono font-medium text-xs mt-0.5">
              {evidence.evidenceId}
            </span>
          </div>
          <CopyButton text={evidence.evidenceId} label="Copy ID" />
        </div>

        <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">SHA-256 Cryptographic Hash</span>
            <CopyButton text={evidence.hash} label="Copy Hash" />
          </div>
          <div className="font-mono text-xs text-cyan-300 break-all bg-slate-900/80 p-2 rounded border border-slate-800 selection:bg-cyan-900">
            {evidence.hash}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Deterministic Canonical JSON serialization guarantees identical hashes across all platforms.
      </p>
    </div>
  );
};
