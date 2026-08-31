import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-lg w-full bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center shadow-xl">
        <div className="inline-flex p-3 bg-[#58a6ff]/10 text-[#58a6ff] rounded-xl mb-4 border border-[#58a6ff]/20">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight mb-2">
          Face Identification & Blockchain Verification
        </h1>
        <p className="text-xs text-[#8b949e] font-mono mb-6">
          Module 1: Project Foundation & Environment Setup
        </p>
        <div className="pt-4 border-t border-[#30363d] flex items-center justify-center space-x-2 text-sm font-mono text-green-400 bg-[#2ea44f]/10 py-2.5 px-4 rounded-lg border border-[#2ea44f]/30">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>System Status: Ready</span>
        </div>
      </div>
    </div>
  );
};
export default App;
