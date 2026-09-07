import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutModal: React.FC<ShortcutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + Enter', description: 'Trigger face recognition and blockchain pipeline' },
    { key: 'Esc', description: 'Close modals or cancel active image preview' },
    { key: 'Tab', description: 'Navigate accessible inputs and verification cards' },
    { key: 'Space', description: 'Toggle demo simulation mode settings' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#062e1a] border border-[#ffd60a]/30 rounded-2xl p-6 shadow-2xl text-[#fdfbf7]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-5 h-5 text-[#ffd60a]" />
            <h3 className="font-heading font-bold text-lg text-[#ffd60a]">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close shortcuts modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="mt-4 space-y-3">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5"
            >
              <span className="text-sm text-white/80">{sc.description}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-semibold text-[#ffd60a] bg-[#0c4026] border border-[#ffd60a]/40 rounded shadow">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-[#062e1a] bg-[#ffd60a] hover:bg-[#ffbe0b] rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
