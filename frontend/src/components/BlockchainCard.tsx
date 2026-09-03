import React from 'react';
import { Blocks, ExternalLink, ShieldCheck } from 'lucide-react';
import { CopyButton } from './CopyButton';

interface BlockchainCardProps {
  blockchain: {
    network: string;
    transactionSignature: string;
    explorerUrl: string;
    recordedAt?: string;
  };
}

export const BlockchainCard: React.FC<BlockchainCardProps> = ({ blockchain }) => {
  return (
    <div className="bg-[#0a4629]/80 border border-[#16623a] rounded-2xl p-5 shadow-xl flex flex-col gap-4 card-glow">
      <div className="flex items-center justify-between border-b border-[#16623a]/70 pb-3">
        <h4 className="text-xs font-bold text-[#ffd60a] uppercase tracking-wider flex items-center gap-2">
          <Blocks className="w-4 h-4 text-[#ffd60a]" />
          Blockchain Record
        </h4>
        <span className="text-xs font-mono text-[#ffd60a] bg-[#041f11] px-2.5 py-0.5 rounded-full border border-[#16623a] uppercase font-semibold">
          {blockchain.network}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#041f11] border border-[#16623a]">
          <div className="flex items-center justify-between">
            <span className="text-[#cbd5c5] text-xs">Transaction Signature</span>
            <CopyButton text={blockchain.transactionSignature} label="Copy Sig" />
          </div>
          <div className="font-mono text-xs text-[#ffd60a] break-all bg-[#062e1a] p-2.5 rounded-lg border border-[#16623a]">
            {blockchain.transactionSignature}
          </div>
        </div>

        {blockchain.recordedAt && (
          <div className="flex items-center justify-between text-xs text-[#cbd5c5] px-1">
            <span>Recorded At</span>
            <span className="font-mono text-[#fdfbf7]">
              {new Date(blockchain.recordedAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] text-[#cbd5c5]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#ffd60a]" />
          <span>SPL Memo Program v2</span>
        </div>

        <a
          href={blockchain.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#ffd60a] hover:bg-[#ffea75] text-[#062e1a] shadow-md transition-all"
        >
          <span>View on Solana Explorer</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
