import React from 'react';
import { Sparkles, Server, Cpu, CheckCircle2, AlertTriangle, XCircle, SearchX } from 'lucide-react';
import { SAMPLE_FACE_PRESETS, SampleFacePreset } from '../services/demoData';

interface DemoModeControlsProps {
  isDemoMode: boolean;
  onToggleDemoMode: (enabled: boolean) => void;
  selectedPresetScenario: string;
  onSelectPresetScenario: (scenario: string) => void;
  onSelectSampleFace: (preset: SampleFacePreset) => void;
  selectedSampleFaceId: string | null;
  disabled?: boolean;
}

export const DemoModeControls: React.FC<DemoModeControlsProps> = ({
  isDemoMode,
  onToggleDemoMode,
  selectedPresetScenario,
  onSelectPresetScenario,
  onSelectSampleFace,
  selectedSampleFaceId,
  disabled = false
}) => {
  return (
    <div id="demo-sandbox" className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-[#16623a] shadow-xl flex flex-col gap-4">
      {/* Top Header: Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#16623a]/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#ffd60a]/15 border border-[#ffd60a]/30 text-[#ffd60a]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#ffd60a]">
                Execution Mode
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                  isDemoMode
                    ? 'bg-[#ff2a85]/15 text-[#ff66a8] border-[#ff2a85]/40'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                }`}
              >
                {isDemoMode ? 'SANDBOX SIMULATOR' : 'LIVE FASTAPI BACKEND'}
              </span>
            </div>
            <p className="text-[11px] text-[#cbd5c5] mt-0.5">
              {isDemoMode
                ? 'Test full pipeline, realistic stage timing, and cryptographic tamper audit without local GPU.'
                : 'Connected to local FastAPI + Buffalo_L + Solana Devnet orchestrator.'}
            </p>
          </div>
        </div>

        {/* Toggle Pill */}
        <div className="flex items-center bg-[#041f11] p-1 rounded-xl border border-[#16623a] self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => onToggleDemoMode(false)}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              !isDemoMode
                ? 'bg-[#ffd60a] text-[#062e1a] shadow-md font-black'
                : 'text-[#cbd5c5] hover:text-[#ffd60a]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Live API</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleDemoMode(true)}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              isDemoMode
                ? 'bg-[#ffd60a] text-[#062e1a] shadow-md font-black'
                : 'text-[#cbd5c5] hover:text-[#ffd60a]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Demo Sandbox</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios Selector (Only in Demo Mode) */}
      {isDemoMode && (
        <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
          <span className="text-[11px] font-bold text-[#ffd60a] uppercase tracking-wider flex items-center gap-1.5">
            <span>Simulation Scenario:</span>
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectPresetScenario('VERIFIED')}
              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                selectedPresetScenario === 'VERIFIED'
                  ? 'bg-emerald-950/60 border-emerald-400/80 ring-1 ring-emerald-400/50 shadow-md'
                  : 'bg-[#062e1a]/80 border-[#16623a] hover:border-[#ffd60a]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
                <span className="text-[10px] font-mono text-emerald-300 font-bold">94.8%</span>
              </div>
              <p className="text-[10px] text-[#cbd5c5] leading-tight">
                Authentic face match + Solana Devnet proof
              </p>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectPresetScenario('TAMPERED')}
              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                selectedPresetScenario === 'TAMPERED'
                  ? 'bg-[#ff2a85]/15 border-[#ff2a85] ring-1 ring-[#ff2a85]/50 shadow-md'
                  : 'bg-[#062e1a]/80 border-[#16623a] hover:border-[#ffd60a]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ff66a8] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Tampered
                </span>
                <span className="text-[10px] font-mono text-[#ff66a8] font-bold">Audit ✗</span>
              </div>
              <p className="text-[10px] text-[#cbd5c5] leading-tight">
                Off-chain altered title reveals forgery
              </p>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectPresetScenario('NO_CONFIDENT_MATCH')}
              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                selectedPresetScenario === 'NO_CONFIDENT_MATCH'
                  ? 'bg-amber-950/60 border-amber-400/80 ring-1 ring-amber-400/50 shadow-md'
                  : 'bg-[#062e1a]/80 border-[#16623a] hover:border-[#ffd60a]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <SearchX className="w-3.5 h-3.5" /> Low Match
                </span>
                <span className="text-[10px] font-mono text-amber-300 font-bold">68.2%</span>
              </div>
              <p className="text-[10px] text-[#cbd5c5] leading-tight">
                Lookalike falls below 85% threshold
              </p>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectPresetScenario('NO_FACE_DETECTED')}
              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                selectedPresetScenario === 'NO_FACE_DETECTED'
                  ? 'bg-[#041f11] border-[#ffd60a]/70 ring-1 ring-[#ffd60a]/40 shadow-md'
                  : 'bg-[#062e1a]/80 border-[#16623a] hover:border-[#ffd60a]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#cbd5c5] flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-[#cbd5c5]" /> No Face
                </span>
                <span className="text-[10px] font-mono text-[#cbd5c5]">0 Faces</span>
              </div>
              <p className="text-[10px] text-[#cbd5c5] leading-tight">
                Non-face image halts at Stage 1
              </p>
            </button>
          </div>
        </div>
      )}

      {/* 1-Click Sample Portrait Avatars */}
      <div className="flex flex-col gap-2 pt-1 border-t border-[#16623a]/60">
        <span className="text-[11px] font-bold text-[#ffd60a] uppercase tracking-wider">
          Quick-Load Sample Portraits:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_FACE_PRESETS.map((preset) => {
            const isSelected = selectedSampleFaceId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectSampleFace(preset)}
                className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#ffd60a]/15 border-[#ffd60a] ring-1 ring-[#ffd60a]/60 shadow-md'
                    : 'bg-[#041f11]/70 border-[#16623a] hover:border-[#ffd60a]/40 hover:bg-[#062e1a]'
                }`}
              >
                <img
                  src={preset.imageUrl}
                  alt={preset.name}
                  className="w-9 h-9 rounded-lg object-cover border border-[#16623a] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[#fdfbf7] truncate block">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-[#cbd5c5] truncate block">
                    {preset.role}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
