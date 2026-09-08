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
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 active:scale-95 ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-rh-green" />
          <span className="text-rh-green text-[11px]">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          {label && <span className="text-[11px]">{label}</span>}
        </>
      )}
    </button>
  );
};
