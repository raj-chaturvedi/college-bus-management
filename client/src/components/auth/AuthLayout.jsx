import React from 'react';
import { Bus } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-sky-600 selection:text-white">
      {/* Outer Card Container */}
      <div className="w-full max-w-4xl bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        
        {/* Left Column: Minimal Brand & Restrained Route Graphic */}
        <div className="hidden lg:flex lg:col-span-5 bg-slate-900 text-white flex-col justify-between p-8 xl:p-10 relative overflow-hidden border-r border-slate-800">
          {/* Subtle geometric dot grid watermark */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Top Brand Identity */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-sky-400 text-xs font-semibold mb-6">
              <Bus className="w-4 h-4 text-sky-400" />
              <span>Campus Transit</span>
            </div>

            <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-white leading-tight">
              College Bus<br />Management
            </h1>
            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-normal">
              Unified platform for student transportation, bus scheduling, and route coordination.
            </p>
          </div>

          {/* Minimal Restrained Transit Route Illustration */}
          <div className="relative z-10 my-8 py-4">
            <svg
              className="w-full h-36 overflow-visible"
              viewBox="0 0 280 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Background transit line trace */}
              <path
                d="M 20 90 C 70 90, 80 35, 140 35 C 200 35, 210 80, 260 80"
                stroke="#1e293b"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Active illuminated path */}
              <path
                d="M 20 90 C 70 90, 80 35, 140 35 C 200 35, 210 80, 260 80"
                stroke="url(#route-gradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              
              {/* Route stop nodes */}
              <circle cx="20" cy="90" r="5" fill="#0284c7" stroke="#0f172a" strokeWidth="2.5" />
              <circle cx="140" cy="35" r="5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
              <circle cx="260" cy="80" r="5" fill="#0284c7" stroke="#0f172a" strokeWidth="2.5" />

              {/* Node indicator labels */}
              <text x="20" y="108" fill="#64748b" fontSize="9" fontFamily="sans-serif" textAnchor="start">Campus</text>
              <text x="140" y="22" fill="#94a3b8" fontSize="9" fontFamily="sans-serif" textAnchor="middle">Interchange</text>
              <text x="260" y="98" fill="#64748b" fontSize="9" fontFamily="sans-serif" textAnchor="end">Terminal</text>

              <defs>
                <linearGradient id="route-gradient" x1="20" y1="90" x2="260" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0284c7" />
                  <stop offset="0.5" stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#0284c7" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Bottom Project Note */}
          <div className="relative z-10 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            College Bus Management System
          </div>
        </div>

        {/* Right Column: Clean Form Container */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-center p-6 sm:p-10 bg-white">
          <div className="w-full max-w-sm mx-auto">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}
