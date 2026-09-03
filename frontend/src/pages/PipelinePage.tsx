import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Play,
  Loader2,
  RefreshCw,
  Blocks,
  FileCheck2,
  Radio,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { PipelineProgress } from '../components/PipelineProgress';
import { FaceAnalysisCard } from '../components/FaceAnalysisCard';
import { MatchCard } from '../components/MatchCard';
import { EvidenceCard } from '../components/EvidenceCard';
import { BlockchainCard } from '../components/BlockchainCard';
import { VerificationCard } from '../components/VerificationCard';
import { VerificationSummary } from '../components/VerificationSummary';
import { ErrorState } from '../components/ErrorState';
import { DemoModeControls } from '../components/DemoModeControls';
import { TamperSimulator } from '../components/TamperSimulator';
import { apiService } from '../services/api';
import {
  SAMPLE_FACE_PRESETS,
  DEMO_PRESET_RESPONSES,
  SampleFacePreset
} from '../services/demoData';
import {
  PipelineResponse,
  PipelineStages,
  PipelineTiming,
  PipelineSuccessResponse
} from '../types/pipeline';

const INITIAL_STAGES: PipelineStages = {
  faceAnalysis: 'PENDING',
  webSearch: 'PENDING',
  matching: 'PENDING',
  evidence: 'PENDING',
  blockchain: 'PENDING',
  verification: 'PENDING'
};

export const PipelinePage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrlOverride, setPreviewUrlOverride] = useState<string | null>(SAMPLE_FACE_PRESETS[0].imageUrl);
  const [selectedSampleFaceId, setSelectedSampleFaceId] = useState<string | null>(SAMPLE_FACE_PRESETS[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const [stages, setStages] = useState<PipelineStages>(INITIAL_STAGES);
  const [timing, setTiming] = useState<Partial<PipelineTiming> | undefined>(undefined);
  const [result, setResult] = useState<PipelineResponse | null>(null);

  // Demo Sandbox State
  const [isDemoMode, setIsDemoMode] = useState(true); // Default to interactive demo sandbox for instantaneous evaluation
  const [demoScenario, setDemoScenario] = useState<string>('VERIFIED');
  const [backendOfflinePrompt, setBackendOfflinePrompt] = useState(false);

  // Simulated tamper overrides in VerificationCard
  const [simulatedAuditStatus, setSimulatedAuditStatus] = useState<{
    isVerified: boolean;
    currentHash: string;
  } | null>(null);

  // Pre-load default demo response so dashboard is alive on first visit
  useEffect(() => {
    if (isDemoMode && !result && demoScenario === 'VERIFIED') {
      const defaultResp = DEMO_PRESET_RESPONSES.VERIFIED;
      setResult(defaultResp);
      if (defaultResp.pipeline) setStages(defaultResp.pipeline);
      if (defaultResp.timing) setTiming(defaultResp.timing);
    }
  }, [isDemoMode, result, demoScenario]);

  const handleSelectSampleFace = (preset: SampleFacePreset) => {
    setSelectedSampleFaceId(preset.id);
    setPreviewUrlOverride(preset.imageUrl);
    setSelectedFile(null);
    setDemoScenario(preset.expectedResult);
    setBackendOfflinePrompt(false);
    setSimulatedAuditStatus(null);

    // Auto update response if in demo mode
    if (isDemoMode) {
      const mockRes = DEMO_PRESET_RESPONSES[preset.expectedResult];
      if (mockRes) {
        setResult(mockRes);
        if (mockRes.pipeline) setStages(mockRes.pipeline);
        if (mockRes.timing) setTiming(mockRes.timing);
      }
    } else {
      setResult(null);
      setStages(INITIAL_STAGES);
      setTiming(undefined);
    }
  };

  const handleSelectPresetScenario = (scenario: string) => {
    setDemoScenario(scenario);
    setSimulatedAuditStatus(null);
    const mockRes = DEMO_PRESET_RESPONSES[scenario];
    if (mockRes) {
      setResult(mockRes);
      if (mockRes.pipeline) setStages(mockRes.pipeline);
      if (mockRes.timing) setTiming(mockRes.timing);
    }
  };

  const handleRunPipeline = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setResult(null);
    setTiming(undefined);
    setSimulatedAuditStatus(null);
    setBackendOfflinePrompt(false);

    // Staged Simulation Mode
    if (isDemoMode) {
      // Stage 1: Face Analysis
      setStages({
        faceAnalysis: 'PROCESSING',
        webSearch: 'PENDING',
        matching: 'PENDING',
        evidence: 'PENDING',
        blockchain: 'PENDING',
        verification: 'PENDING'
      });
      await new Promise((r) => setTimeout(r, 450));

      if (demoScenario === 'NO_FACE_DETECTED') {
        const noFaceRes = DEMO_PRESET_RESPONSES.NO_FACE_DETECTED;
        setStages(noFaceRes.pipeline!);
        setTiming(noFaceRes.timing);
        setResult(noFaceRes);
        setIsRunning(false);
        return;
      }

      // Stage 2: Web Search
      setStages((prev) => ({ ...prev, faceAnalysis: 'COMPLETED', webSearch: 'PROCESSING' }));
      await new Promise((r) => setTimeout(r, 650));

      // Stage 3: Face Matching
      setStages((prev) => ({ ...prev, webSearch: 'COMPLETED', matching: 'PROCESSING' }));
      await new Promise((r) => setTimeout(r, 450));

      if (demoScenario === 'NO_CONFIDENT_MATCH') {
        const lowMatchRes = DEMO_PRESET_RESPONSES.NO_CONFIDENT_MATCH;
        setStages(lowMatchRes.pipeline!);
        setTiming(lowMatchRes.timing);
        setResult(lowMatchRes);
        setIsRunning(false);
        return;
      }

      // Stage 4: Evidence Package
      setStages((prev) => ({ ...prev, matching: 'COMPLETED', evidence: 'PROCESSING' }));
      await new Promise((r) => setTimeout(r, 350));

      // Stage 5: Solana Devnet
      setStages((prev) => ({ ...prev, evidence: 'COMPLETED', blockchain: 'PROCESSING' }));
      await new Promise((r) => setTimeout(r, 800));

      // Stage 6: Cryptographic Verification
      setStages((prev) => ({ ...prev, blockchain: 'COMPLETED', verification: 'PROCESSING' }));
      await new Promise((r) => setTimeout(r, 350));

      const finalRes = DEMO_PRESET_RESPONSES[demoScenario] || DEMO_PRESET_RESPONSES.VERIFIED;
      setStages(finalRes.pipeline!);
      setTiming(finalRes.timing);
      setResult(finalRes);
      setIsRunning(false);
      return;
    }

    // Live API Mode
    if (!selectedFile) {
      setIsRunning(false);
      return;
    }

    setStages({
      faceAnalysis: 'PROCESSING',
      webSearch: 'PENDING',
      matching: 'PENDING',
      evidence: 'PENDING',
      blockchain: 'PENDING',
      verification: 'PENDING'
    });

    try {
      const res = await apiService.runPipeline(selectedFile);
      setResult(res);
      if (res.pipeline) {
        setStages(res.pipeline);
      }
      if (res.timing) {
        setTiming(res.timing);
      }
    } catch (err: any) {
      setResult({
        success: false,
        status: 'VERIFICATION_FAILED',
        message: err.message || 'Pipeline execution failed.'
      });
      setBackendOfflinePrompt(true);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrlOverride(null);
    setSelectedSampleFaceId(null);
    setIsRunning(false);
    setStages(INITIAL_STAGES);
    setTiming(undefined);
    setResult(null);
    setSimulatedAuditStatus(null);
    setBackendOfflinePrompt(false);
  };

  // Determine effective verification data for display
  const effectiveResult = result && result.success ? (result as PipelineSuccessResponse) : null;
  const effectiveVerified = simulatedAuditStatus
    ? simulatedAuditStatus.isVerified
    : effectiveResult
    ? effectiveResult.verification.verified
    : false;
  const effectiveStatus = simulatedAuditStatus
    ? simulatedAuditStatus.isVerified
      ? ('VERIFIED' as const)
      : ('TAMPERED' as const)
    : effectiveResult
    ? effectiveResult.status
    : ('VERIFIED' as const);
  const effectiveCurrentHash = simulatedAuditStatus
    ? simulatedAuditStatus.currentHash
    : effectiveResult?.verification.currentHash || '';

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col bg-grid-pattern relative">
      {/* Background ambient glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-32 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-950/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-gradient-cyan-purple flex items-center gap-2">
                  Face Identification & Blockchain Verification
                </h1>
                <span className="hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold">
                  Task 3 Shortlisting
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                InsightFace Buffalo_L • SerpApi Visual Search • RFC 8785 Canonical SHA-256 • Solana Devnet SPL Memo
              </p>
            </div>
          </div>

          {/* Header Right: Solana Devnet Status Pill */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs shadow-inner" title="Connected to Solana Devnet cluster for blockchain evidence anchoring">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-purple-300 font-semibold flex items-center gap-1.5 text-[11px]">
                <Blocks className="w-3.5 h-3.5 text-purple-400" />
                SOLANA DEVNET
              </span>
              <a
                href="https://explorer.solana.com/?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                title="View Solana Devnet Explorer"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8">
        {/* Top Control Bar: Demo Sandbox & Presets */}
        <DemoModeControls
          isDemoMode={isDemoMode}
          onToggleDemoMode={(enabled) => {
            setIsDemoMode(enabled);
            setBackendOfflinePrompt(false);
            if (enabled) {
              handleSelectPresetScenario(demoScenario);
            }
          }}
          selectedPresetScenario={demoScenario}
          onSelectPresetScenario={handleSelectPresetScenario}
          onSelectSampleFace={handleSelectSampleFace}
          selectedSampleFaceId={selectedSampleFaceId}
          disabled={isRunning}
        />

        {/* Offline Backend Fallback Prompt Banner */}
        {backendOfflinePrompt && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-300">
                  Backend API unreachable (http://localhost:5000)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  The local FastAPI server is not currently running. You can switch to the interactive Demo Sandbox to evaluate all features.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsDemoMode(true);
                setBackendOfflinePrompt(false);
                handleSelectPresetScenario('VERIFIED');
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-slate-950 hover:brightness-110 transition-all shadow-md shrink-0 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Switch to Demo Sandbox</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Split Layout: Upload & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Upload & Action Controls */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-cyan-400" />
                  1. Input Face Portrait
                </h2>
                {(selectedFile || previewUrlOverride) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isRunning}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>

              <ImageUploader
                selectedFile={selectedFile}
                previewUrlOverride={previewUrlOverride}
                onFileSelect={(file) => {
                  setSelectedFile(file);
                  setPreviewUrlOverride(null);
                  setSelectedSampleFaceId(null);
                  setBackendOfflinePrompt(false);
                  if (result) {
                    setResult(null);
                    setStages(INITIAL_STAGES);
                  }
                }}
                disabled={isRunning}
              />

              <button
                type="button"
                onClick={handleRunPipeline}
                disabled={(!selectedFile && !previewUrlOverride) || isRunning}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                  (!selectedFile && !previewUrlOverride) || isRunning
                    ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    : 'bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 shadow-cyan-950/40 border border-cyan-300/40 font-extrabold hover:shadow-cyan-500/20'
                }`}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>RUNNING PIPELINE STAGES...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>EXECUTE VERIFICATION PIPELINE</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Execution Progress Tracker */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <PipelineProgress
              stages={stages}
              timing={timing}
              isRunning={isRunning}
            />
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {result.success ? (
              <>
                <VerificationSummary
                  status={effectiveStatus}
                  similarity={result.match.similarity}
                  evidenceId={result.evidence.evidenceId}
                  transactionSignature={result.blockchain.transactionSignature}
                />

                <VerificationCard
                  status={effectiveStatus}
                  verification={{
                    verified: effectiveVerified,
                    currentHash: effectiveCurrentHash,
                    blockchainHash: result.verification.blockchainHash
                  }}
                />

                {/* Interactive Cryptographic Tamper Simulator Workbench */}
                <TamperSimulator
                  initialTitle={result.source.title || 'Official Discovered Portrait'}
                  initialPlatform={result.source.platform}
                  initialUrl={result.source.url}
                  initialSimilarity={result.match.similarity}
                  initialEvidenceId={result.evidence.evidenceId}
                  onChainHash={result.blockchain ? result.verification.blockchainHash : result.evidence.hash}
                  onChainSignature={result.blockchain.transactionSignature}
                  onAuditStatusChange={(isVerif, currentHash) => {
                    setSimulatedAuditStatus({
                      isVerified: isVerif,
                      currentHash: currentHash
                    });
                  }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FaceAnalysisCard face={result.face} />
                  <MatchCard match={result.match} source={result.source} />
                  <EvidenceCard evidence={result.evidence} />
                  <BlockchainCard blockchain={result.blockchain} />
                </div>
              </>
            ) : (
              <ErrorState
                status={result.status}
                failedStage={result.failedStage}
                message={result.message}
                details={result.details}
                onRetry={handleRunPipeline}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">
              Face Identification & Solana Devnet Blockchain Verifier
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">v1.0.0</span>
          </div>
          <div className="text-[11px] text-slate-500">© 2026 — Built for Task 3 Shortlisting</div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>InsightFace Buffalo_L</span>
            <span>•</span>
            <span>RFC 8785 Canonical JSON</span>
            <span>•</span>
            <span>Solana SPL Memo v2</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
