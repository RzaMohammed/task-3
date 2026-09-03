import React from 'react';
import { Users, ExternalLink, CheckCircle2, Globe } from 'lucide-react';

interface MatchCardProps {
  match: {
    found: boolean;
    similarity: number;
    threshold: number;
  };
  source: {
    url: string;
    platform: string;
    title: string | null;
    imageUrl?: string | null;
  };
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, source }) => {
  const similarityPct = (match.similarity * 100).toFixed(1);
  const thresholdPct = (match.threshold * 100).toFixed(0);

  return (
    <div className="bg-[#0a4629]/80 border border-[#16623a] rounded-2xl p-5 shadow-xl flex flex-col gap-4 card-glow">
      <div className="flex items-center justify-between border-b border-[#16623a]/70 pb-3">
        <h4 className="text-xs font-bold text-[#ffd60a] uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-[#ffd60a]" />
          Genuine Match Discovered
        </h4>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60 flex items-center gap-1 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" /> Match Found ✓
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-4">
        {source.imageUrl && (
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#041f11] border-2 border-[#16623a] shrink-0 shadow-md">
            <img
              src={source.imageUrl}
              alt="Discovered candidate"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {source.title && (
            <h5 className="text-sm font-bold text-[#fdfbf7] truncate">
              {source.title}
            </h5>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-lg bg-[#041f11] text-[#ffd60a] font-mono uppercase text-[11px] border border-[#16623a] font-bold">
              {source.platform}
            </span>
            <span className="text-[#cbd5c5]">
              Face Similarity:{' '}
              <strong className="text-[#ffd60a] font-mono text-sm">{similarityPct}%</strong>
            </span>
            <span className="text-[#cbd5c5]/60 text-[11px]">
              (Threshold: {thresholdPct}%)
            </span>
          </div>

          <div className="mt-1">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#ffd60a] hover:text-[#ffea75] hover:underline max-w-full truncate font-mono"
            >
              <Globe className="w-3.5 h-3.5 shrink-0 text-[#ffd60a]" />
              <span className="truncate">{source.url}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
