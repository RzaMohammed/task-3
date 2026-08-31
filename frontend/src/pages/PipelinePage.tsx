import React, { useState } from 'react';
import {
  ShieldCheck,
  Play,
  Loader2,
  RefreshCw,
  Blocks,
  FileCheck2
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
import { apiService } from '../services/api';
import {
  PipelineResponse,
  PipelineStages,
  PipelineTiming
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
  const [isRunning, setIsRunning] = useState(false);
  const [stages, setStages] = useState<PipelineStages>(INITIAL_STAGES);
  const [timing, setTiming] = useState<Partial<PipelineTiming> | undefined>(undefined);
  const [result, setResult] = useState<PipelineResponse | null>(null);

  const handleRunPipeline = async () => {
    if (!selectedFile || isRunning) return;

    setIsRunning(true);
    setResult(null);
    setTiming(undefined);

    // Set stage 1 to processing
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
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIsRunning(false);
    setStages(INITIAL_STAGES);
    setTiming(undefined);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                Face Identification & Blockchain Verification
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Discover → Fingerprint → Verify
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-purple-950/40 text-purple-300 border border-purple-800/40">
              <Blocks className="w-3.5 h-3.5 text-purple-400" />
              SOLANA DEVNET
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8">
        {/* Top Split Layout: Upload & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Upload & Action Controls */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-cyan-400" />
                  1. Input Face Portrait
                </h2>
                {selectedFile && (
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
                onFileSelect={(file) => {
                  setSelectedFile(file);
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
                disabled={!selectedFile || isRunning}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  !selectedFile || isRunning
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-950/40 border border-cyan-400/30'
                }`}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>RUNNING PIPELINE...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>RUN VERIFICATION</span>
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

        {/* Results Area */}
        {result && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {result.success ? (
              <>
                <VerificationSummary
                  status={result.status}
                  similarity={result.match.similarity}
                  evidenceId={result.evidence.evidenceId}
                  transactionSignature={result.blockchain.transactionSignature}
                />

                <VerificationCard
                  status={result.status}
                  verification={result.verification}
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
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <span>Face Identification & Blockchain Verification Pipeline • Solana Devnet Hackathon Prototype</span>
        </div>
      </footer>
    </div>
  );
};
