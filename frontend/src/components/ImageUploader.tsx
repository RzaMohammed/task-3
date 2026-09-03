import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface ImageUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  previewUrlOverride?: string | null;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  selectedFile,
  onFileSelect,
  previewUrlOverride,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(previewUrlOverride || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (previewUrlOverride) {
      setPreviewUrl(previewUrlOverride);
      return undefined;
    }
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    setPreviewUrl(null);
    return undefined;
  }, [selectedFile, previewUrlOverride]);

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setErrorMessage('Unsupported format. Please upload JPG, PNG, or WebP images.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage('Image size exceeds 10MB limit.');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setErrorMessage(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = previewUrlOverride || previewUrl;

  return (
    <div className="w-full flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
        id="face-image-upload"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer min-h-[250px] overflow-hidden ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-950/30'
            : displayUrl
            ? 'border-emerald-500/40 bg-slate-900/80 shadow-md'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/50'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {displayUrl ? (
          <div className="relative w-full flex flex-col items-center gap-3.5 z-10">
            <div className="relative group w-36 h-36 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-xl">
              <img
                src={displayUrl}
                alt="Selected face portrait"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                title="Remove image"
                className="absolute top-1.5 right-1.5 p-1.5 bg-slate-950/80 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md transition-colors shadow-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {selectedFile
                  ? `Portrait loaded (${(selectedFile.size / 1024).toFixed(0)} KB)`
                  : 'Sample Portrait Loaded ✓'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Click or drag another image to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center gap-3 z-10">
            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/80 text-cyan-400 shadow-inner group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Upload target face portrait
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Drag & drop or browse from local disk
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-800/40">
              <Sparkles className="w-3 h-3" />
              <span>InsightFace 512-D Embedding Ready</span>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-900/60 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
