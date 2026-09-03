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
    <div className="bg-[#0a4629]/80 border border-[#16623a] rounded-2xl p-5 shadow-xl flex flex-col gap-4 card-glow">
      <div className="flex items-center justify-between border-b border-[#16623a]/70 pb-3">
        <h4 className="text-xs font-bold text-[#ffd60a] uppercase tracking-wider flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-[#ffd60a]" />
          Evidence Fingerprint
        </h4>
        <span className="text-xs font-mono text-[#ffd60a] bg-[#041f11] px-2.5 py-0.5 rounded-full border border-[#16623a] font-semibold">
          {evidence.algorithm}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#041f11] border border-[#16623a]">
          <div className="flex flex-col">
            <span className="text-[#cbd5c5] text-xs">Evidence ID</span>
            <span className="text-[#fdfbf7] font-mono font-bold text-xs mt-0.5">
              {evidence.evidenceId}
            </span>
          </div>
          <CopyButton text={evidence.evidenceId} label="Copy ID" />
        </div>

        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#041f11] border border-[#16623a]">
          <div className="flex items-center justify-between">
            <span className="text-[#cbd5c5] text-xs">SHA-256 Cryptographic Hash</span>
            <CopyButton text={evidence.hash} label="Copy Hash" />
          </div>
          <div className="font-mono text-xs text-[#ffd60a] break-all bg-[#062e1a] p-2.5 rounded-lg border border-[#16623a]">
            {evidence.hash}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[#cbd5c5]">
        Deterministic Canonical JSON serialization guarantees identical hashes across all platforms.
      </p>
    </div>
  );
};
