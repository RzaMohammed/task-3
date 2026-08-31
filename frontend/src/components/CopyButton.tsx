import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, label, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      aria-label="Copy to clipboard"
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono rounded bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-50" />
          <span className="text-emerald-400 font-medium">Copied ✓</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-slate-400" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};
