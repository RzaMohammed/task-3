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
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono rounded-lg bg-[#041f11] hover:bg-[#062e1a] border border-[#16623a] hover:border-[#ffd60a]/60 text-[#cbd5c5] hover:text-[#ffd60a] transition-all ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-50" />
          <span className="text-emerald-400 font-medium">Copied ✓</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-[#ffd60a]" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};
