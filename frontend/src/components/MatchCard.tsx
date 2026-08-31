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
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Genuine Match Discovered
        </h4>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Match Found ✓
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-4">
        {source.imageUrl && (
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
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
            <h5 className="text-sm font-semibold text-slate-100 truncate">
              {source.title}
            </h5>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono uppercase text-[11px] border border-slate-700">
              {source.platform}
            </span>
            <span className="text-slate-400">
              Face Similarity:{' '}
              <strong className="text-emerald-400 font-mono text-sm">{similarityPct}%</strong>
            </span>
            <span className="text-slate-500 text-[11px]">
              (Threshold: {thresholdPct}%)
            </span>
          </div>

          <div className="mt-1">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 hover:underline max-w-full truncate font-mono"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{source.url}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
