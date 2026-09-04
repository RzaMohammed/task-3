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
    <div className="min-h-screen bg-[#062e1a] text-[#fdfbf7] flex flex-col bg-goa-mesh relative overflow-x-hidden">
      {/* Ambient Goa Sun & Palm Glows */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-yellow-400/20 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10 animate-sun" />
      <div className="absolute top-32 left-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-60 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Bar */}
      <header className="border-b border-[#16623a]/80 bg-[#041f11]/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 2:41PM Studio Badge from Referral */}
            <div className="px-2.5 py-1 rounded-lg bg-[#ffd60a] text-[#062e1a] font-black text-xs tracking-tight shadow-md flex items-center gap-1 select-none">
              <span>2:41PM</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-85">STUDIO</span>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-[#16623a]">
              <span className="font-display font-bold text-sm tracking-wide text-[#ffd60a] hidden sm:inline-block">
                HACKER HOUSE
              </span>
              <span className="goa-badge-hindi px-2 py-0.5 rounded-lg text-xs font-bold shadow-md">
                गोवा
              </span>
              <span className="hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0a3d24] text-[#ffd60a] border border-[#16623a] font-semibold">
                Task 3 Shortlisting
              </span>
            </div>
          </div>

          {/* Header Right: Hype link & Solana Devnet Status Pill */}
          <div className="flex items-center gap-3">
            <a
              href="#demo-sandbox"
              className="text-xs font-mono font-extrabold tracking-wider text-[#ffd60a] hover:text-[#ffea75] uppercase transition-colors hidden sm:inline-block"
            >
              CHECK HYPE
            </a>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#062e1a] border border-[#16623a] text-xs shadow-inner"
              title="Connected to Solana Devnet cluster for blockchain evidence anchoring"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffd60a] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffd60a]"></span>
              </span>
              <span className="font-mono text-[#ffd60a] font-bold flex items-center gap-1.5 text-[11px]">
                <Blocks className="w-3.5 h-3.5 text-[#ffd60a]" />
                SOLANA DEVNET
              </span>
              <a
                href="https://explorer.solana.com/?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                title="View Solana Devnet Explorer"
                className="text-emerald-400 hover:text-[#ffd60a] transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8">
        {/* Goa Hacker House Hero Banner from Referral Image */}
        <section className="relative w-full rounded-3xl bg-gradient-to-b from-[#0a4629] via-[#063721] to-[#041f11] border border-[#16623a] p-6 sm:p-10 shadow-2xl overflow-hidden flex flex-col items-center justify-center text-center">
          {/* Ambient Sun Backdrop */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-[#ffd60a]/20 blur-2xl pointer-events-none" />
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-gradient-to-b from-[#ffd60a] to-[#eab308] opacity-30 blur-xl pointer-events-none" />

          {/* Top Date & Studio Meta */}
          <div className="flex items-center justify-between w-full max-w-4xl text-[11px] font-mono text-[#ffd60a] tracking-widest uppercase mb-2">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#ffd60a] inline-block animate-pulse" />
              GOA, INDIA • 28 - 31 OCT 2026
            </span>
            <span className="font-bold hidden sm:inline-block">2:41 PM STUDIO</span>
          </div>

          {/* Main HACKER HOUSE + गोवा Title Display */}
          <div className="relative my-3 sm:my-5 flex flex-wrap items-center justify-center gap-2 sm:gap-4 select-none">
            <h1 className="hacker-house-heading text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight">
              HACKER
            </h1>
            <div className="goa-badge-hindi px-3.5 sm:px-5 py-1 rounded-2xl text-2xl sm:text-4xl md:text-5xl font-black text-white shadow-2xl -mt-1 sm:-mt-2 animate-pulse-ring border-2 border-white/20">
              गोवा
            </div>
            <h1 className="hacker-house-heading text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight">
              HOUSE
            </h1>
          </div>

          {/* Subheading & Feature Badges */}
          <p className="text-xs sm:text-sm text-[#cbd5c5] max-w-2xl font-medium mt-1">
            Off-chain Biometric Facial Identification &amp; Solana Devnet Blockchain Verification Engine
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-5 text-[11px] font-mono">
            <span className="px-3 py-1 rounded-full bg-[#0a3d24] text-[#ffd60a] border border-[#16623a] flex items-center gap-1.5 font-semibold shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#ffd60a]" />
              InsightFace Buffalo_L 512-D
            </span>
            <span className="px-3 py-1 rounded-full bg-[#0a3d24] text-emerald-300 border border-[#16623a] flex items-center gap-1.5 font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              SerpApi Visual Search
            </span>
            <span className="px-3 py-1 rounded-full bg-[#0a3d24] text-pink-300 border border-[#ff2a85]/40 flex items-center gap-1.5 font-semibold shadow-sm">
              <Radio className="w-3.5 h-3.5 text-[#ff2a85]" />
              RFC 8785 Canonical JSON
            </span>
            <span className="px-3 py-1 rounded-full bg-[#0a3d24] text-[#ffd60a] border border-[#ffd60a]/40 flex items-center gap-1.5 font-semibold shadow-sm">
              <Blocks className="w-3.5 h-3.5 text-[#ffd60a]" />
              Solana SPL Memo v2
            </span>
          </div>
        </section>

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
                <p className="text-xs text-[#cbd5c5] mt-0.5">
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
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#ffd60a] hover:bg-[#ffea75] text-[#062e1a] hover:brightness-105 transition-all shadow-md shadow-yellow-950/40 shrink-0 flex items-center gap-1.5"
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
            <div className="glass-panel rounded-2xl p-5 border border-[#16623a] shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#16623a]/70 pb-3">
                <h2 className="text-xs font-bold text-[#ffd60a] uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#ffd60a]" />
                  1. Input Face Portrait
                </h2>
                {(selectedFile || previewUrlOverride) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isRunning}
                    className="text-xs text-[#cbd5c5] hover:text-[#ffd60a] transition-colors flex items-center gap-1"
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

              <div className="apply-pattern-border w-full">
                <button
                  type="button"
                  onClick={handleRunPipeline}
                  disabled={(!selectedFile && !previewUrlOverride) || isRunning}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all uppercase tracking-wider ${
                    (!selectedFile && !previewUrlOverride) || isRunning
                      ? 'bg-[#0a3d24] text-[#cbd5c5]/40 cursor-not-allowed border border-[#16623a]'
                      : 'bg-[#ffd60a] hover:bg-[#ffea75] text-[#062e1a] shadow-lg shadow-yellow-950/40 hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#062e1a]" />
                      <span>RUNNING PIPELINE STAGES...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-[#062e1a]" />
                      <span>APPLY &amp; EXECUTE VERIFICATION</span>
                      <kbd className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/15 border border-black/20 text-[#062e1a]">↵</kbd>
                    </>
                  )}
                </button>
              </div>
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
      <footer className="border-t border-[#16623a] bg-[#041f11]/90 py-8 text-center text-xs text-[#cbd5c5] mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[#ffd60a] font-display text-sm tracking-wide">
              Hacker House गोवा Edition
            </span>
            <span title="Goa Hacker House 2026" className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0a3d24] text-[#ffd60a] border border-[#16623a] font-semibold">
              28 - 31 OCT 2026
            </span>
          </div>
          <div className="text-[11px] text-[#a7bda9]">
            © 2026 — 2:41 PM Studio • Task 3 Shortlisting Biometric Verifier
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#ffd60a]">
            <span>InsightFace Buffalo_L</span>
            <span className="text-[#16623a]">•</span>
            <span>RFC 8785 Canonical JSON</span>
            <span className="text-[#16623a]">•</span>
            <span>Solana SPL Memo v2</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
