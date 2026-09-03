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
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl flex flex-col gap-4">
      {/* Top Header: Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                Execution Mode
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isDemoMode
                    ? 'bg-purple-950/60 text-purple-300 border-purple-700/50'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                }`}
              >
                {isDemoMode ? 'SANDBOX SIMULATOR' : 'LIVE FASTAPI BACKEND'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isDemoMode
                ? 'Test full pipeline, realistic stage timing, and cryptographic tamper audit without local GPU.'
                : 'Connected to local FastAPI + Buffalo_L + Solana Devnet orchestrator.'}
            </p>
          </div>
        </div>

        {/* Toggle Pill */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => onToggleDemoMode(false)}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              !isDemoMode
                ? 'bg-slate-800 text-cyan-300 shadow-md border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Live API</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleDemoMode(true)}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isDemoMode
                ? 'bg-purple-900/60 text-purple-200 shadow-md border border-purple-500/40 text-glow-purple'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Demo Sandbox</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios Selector (Only in Demo Mode) */}
      {isDemoMode && (
        <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>Simulation Scenario:</span>
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectPresetScenario('VERIFIED')}
              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                selectedPresetScenario === 'VERIFIED'
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-950/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
                <span className="text-[10px] font-mono text-emerald-300/80">94.8%</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Authentic face match + Solana Devnet proof
              </p>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectPresetScenario('TAMPERED')}
              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                selectedPresetScenario === 'TAMPERED'
                  ? 'bg-rose-950/40 border-rose-500/60 shadow-md shadow-rose-950/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Tampered
                </span>
                <span className="text-[10px] font-mono text-rose-300/80">Audit ✗</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Off-chain altered title reveals forgery
              </p>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectPresetScenario('NO_CONFIDENT_MATCH')}
              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                selectedPresetScenario === 'NO_CONFIDENT_MATCH'
                  ? 'bg-amber-950/40 border-amber-500/60 shadow-md shadow-amber-950/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <SearchX className="w-3.5 h-3.5" /> Low Match
                </span>
                <span className="text-[10px] font-mono text-amber-300/80">68.2%</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Lookalike falls below 85% threshold
              </p>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectPresetScenario('NO_FACE_DETECTED')}
              className={`p-2.5 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                selectedPresetScenario === 'NO_FACE_DETECTED'
                  ? 'bg-slate-800/80 border-cyan-500/50 shadow-md'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-slate-400" /> No Face
                </span>
                <span className="text-[10px] font-mono text-slate-400">0 Faces</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Non-face image halts at Stage 1
              </p>
            </button>
          </div>
        </div>
      )}

      {/* 1-Click Sample Portrait Avatars */}
      <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/60">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                    ? 'bg-cyan-950/40 border-cyan-400/60 ring-1 ring-cyan-400/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <img
                  src={preset.imageUrl}
                  alt={preset.name}
                  className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-200 truncate block">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
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
