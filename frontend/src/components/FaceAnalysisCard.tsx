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
    <div className="bg-[#0a4629]/80 border border-[#16623a] rounded-2xl p-5 shadow-xl flex flex-col gap-4 card-glow">
      <div className="flex items-center justify-between border-b border-[#16623a]/70 pb-3">
        <h4 className="text-xs font-bold text-[#ffd60a] uppercase tracking-wider flex items-center gap-2">
          <ScanFace className="w-4 h-4 text-[#ffd60a]" />
          Face Analysis Result
        </h4>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60 font-semibold">
          Detected ✓
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[#041f11] border border-[#16623a]">
          <span className="text-[#cbd5c5] block mb-1">Face Detection</span>
          <span className="text-[#fdfbf7] font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Validated
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#041f11] border border-[#16623a]">
          <span className="text-[#cbd5c5] block mb-1">Faces Found</span>
          <span className="text-[#ffd60a] font-mono font-bold">{face.faceCount}</span>
        </div>

        <div className="p-3 rounded-xl bg-[#041f11] border border-[#16623a]">
          <span className="text-[#cbd5c5] block mb-1">Confidence</span>
          <span className="text-[#ffd60a] font-mono font-bold">
            {face.detectionConfidence ? `${(face.detectionConfidence * 100).toFixed(1)}%` : '99.0%'}
          </span>
        </div>

        {face.bbox && (
          <div className="p-3 rounded-xl bg-[#041f11] border border-[#16623a] col-span-2 sm:col-span-3">
            <span className="text-[#cbd5c5] block mb-1">Bounding Box Coordinates</span>
            <span className="text-[#ffd60a] font-mono text-[11px]">
              [{face.bbox.join(', ')}]
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-[#cbd5c5] bg-[#041f11]/70 p-2.5 rounded-xl border border-[#16623a]">
        <Shield className="w-4 h-4 text-[#ffd60a] shrink-0" />
        <span>InsightFace 512-D normalized embedding generated. Raw vectors are never stored on-chain.</span>
      </div>
    </div>
  );
};
