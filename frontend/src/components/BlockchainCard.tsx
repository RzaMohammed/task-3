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
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Blocks className="w-4 h-4 text-purple-400" />
          Blockchain Record
        </h4>
        <span className="text-xs font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40 uppercase">
          {blockchain.network}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">Transaction Signature</span>
            <CopyButton text={blockchain.transactionSignature} label="Copy Sig" />
          </div>
          <div className="font-mono text-xs text-purple-300 break-all bg-slate-900/80 p-2 rounded border border-slate-800">
            {blockchain.transactionSignature}
          </div>
        </div>

        {blockchain.recordedAt && (
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Recorded At</span>
            <span className="font-mono text-slate-300">
              {new Date(blockchain.recordedAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>SPL Memo Program v2</span>
        </div>

        <a
          href={blockchain.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 transition-colors"
        >
          <span>View on Solana Explorer</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
