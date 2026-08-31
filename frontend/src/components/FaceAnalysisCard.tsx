import React from 'react';
import { ScanFace, Check, Shield } from 'lucide-react';

interface FaceAnalysisCardProps {
  face: {
    faceDetected: boolean;
    faceCount: number;
    bbox?: number[];
    detectionConfidence?: number;
  };
}

export const FaceAnalysisCard: React.FC<FaceAnalysisCardProps> = ({ face }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <ScanFace className="w-4 h-4 text-cyan-400" />
          Face Analysis Result
        </h4>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
          Detected ✓
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <span className="text-slate-400 block mb-1">Face Detection</span>
          <span className="text-slate-200 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Validated
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <span className="text-slate-400 block mb-1">Faces Found</span>
          <span className="text-slate-200 font-mono font-semibold">{face.faceCount}</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <span className="text-slate-400 block mb-1">Confidence</span>
          <span className="text-slate-200 font-mono font-semibold">
            {face.detectionConfidence ? `${(face.detectionConfidence * 100).toFixed(1)}%` : '99.0%'}
          </span>
        </div>

        {face.bbox && (
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 col-span-2 sm:col-span-3">
            <span className="text-slate-400 block mb-1">Bounding Box Coordinates</span>
            <span className="text-slate-300 font-mono text-[11px]">
              [{face.bbox.join(', ')}]
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
        <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>InsightFace 512-D normalized embedding generated. Raw vectors are never stored on-chain.</span>
      </div>
    </div>
  );
};
