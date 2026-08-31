import React, { useState, useRef } from 'react';
import { UploadCloud, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  selectedFile,
  onFileSelect,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setErrorMessage(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer min-h-[240px] ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10'
            : selectedFile
            ? 'border-emerald-500/50 bg-slate-900/80'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {previewUrl && selectedFile ? (
          <div className="relative w-full flex flex-col items-center gap-3">
            <div className="relative group w-36 h-36 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow-md">
              <img
                src={previewUrl}
                alt="Selected face portrait"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                title="Remove image"
                className="absolute top-1 right-1 p-1 bg-slate-950/80 hover:bg-rose-600/90 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Image ready ✓ ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
            </div>

            <p className="text-xs text-slate-400">Click or drag another image to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center gap-3">
            <div className="p-3 bg-slate-800/60 rounded-full border border-slate-700 text-cyan-400">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                Upload a face image or drag and drop here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, JPEG, PNG, WebP (Max 10 MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
