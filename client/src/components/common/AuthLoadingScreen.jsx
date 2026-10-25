import React from 'react';
import { Bus, ShieldCheck } from 'lucide-react';

export default function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-5 animate-in fade-in duration-300">
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-sky-100 animate-ping opacity-30"></div>
          <div className="relative h-14 w-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md">
            <Bus className="h-7 w-7" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Greater Noida College Transit
          </h2>
          <p className="text-xs text-slate-500">
            Checking your session...
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-medium text-sky-700 bg-sky-50 py-2 px-3 rounded-lg border border-sky-100">
          <span className="h-2 w-2 rounded-full bg-sky-600 animate-pulse"></span>
          <span>Verifying secure identity & credentials</span>
        </div>

        <p className="text-[11px] text-slate-400">
          Greater Noida Transit Authority (GNTA) • Secure Access
        </p>
      </div>
    </div>
  );
}
