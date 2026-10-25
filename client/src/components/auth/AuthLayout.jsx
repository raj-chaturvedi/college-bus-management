import React from 'react';
import { Bus, Sun, Moon, Radio, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function AuthLayout({ children }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 font-sans selection:bg-sky-600 selection:text-white transition-colors duration-200 relative">
      
      {/* Top Floating Dark Mode & Brand Switcher */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-sm">
            <Bus className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-white tracking-tight">
            Greater Noida Transit
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live 16 Buses Online
          </span>
        </div>

        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle theme"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/80 transition"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-[11px]">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Main Outer Card Container */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
        
        {/* Left Column (Desktop): Brand & Animated Transit Route Graphic */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-900 to-sky-950 text-white flex-col justify-between p-8 xl:p-10 relative overflow-hidden border-r border-slate-800">
          {/* Subtle geometric dot grid watermark */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Ambient Lighting Gradient */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Identity */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs font-semibold mb-6">
              <Bus className="w-4 h-4 text-sky-400" />
              <span>Greater Noida Transit</span>
            </div>

            <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-tight">
              College Bus<br />Management
            </h1>
            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-normal">
              Live fleet tracking, Dijkstra multi-criteria routing, digital QR bus passes, and AI commute assistance.
            </p>
          </div>

          {/* Restrained Transit Route Illustration */}
          <div className="relative z-10 my-6 py-2">
            <svg
              className="w-full h-32 overflow-visible"
              viewBox="0 0 280 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M 20 80 C 70 80, 80 30, 140 30 C 200 30, 210 75, 260 75"
                stroke="#334155"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 20 80 C 70 80, 80 30, 140 30 C 200 30, 210 75, 260 75"
                stroke="url(#route-gradient-desktop)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              
              <circle cx="20" cy="80" r="5.5" fill="#0284c7" stroke="#0f172a" strokeWidth="2.5" />
              <circle cx="140" cy="30" r="5.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
              <circle cx="260" cy="75" r="5.5" fill="#0ea5e9" stroke="#0f172a" strokeWidth="2.5" />

              <text x="20" y="98" fill="#94a3b8" fontSize="9" fontWeight="600" fontFamily="sans-serif" textAnchor="start">Knowledge Park</text>
              <text x="140" y="18" fill="#38bdf8" fontSize="9" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">Pari Chowk Interchange</text>
              <text x="260" y="94" fill="#94a3b8" fontSize="9" fontWeight="600" fontFamily="sans-serif" textAnchor="end">Sector 62 Link</text>

              <defs>
                <linearGradient id="route-gradient-desktop" x1="20" y1="80" x2="260" y2="75" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0284c7" />
                  <stop offset="0.5" stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Bottom Live System Telemetry */}
          <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              21 Stops &bull; 6 Active Corridors
            </span>
            <span className="font-mono text-sky-400 text-[10px]">GPS 3s Sync</span>
          </div>
        </div>

        {/* Mobile Header Banner: Visible ONLY on mobile (< lg) */}
        <div className="lg:hidden col-span-1 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-5 border-b border-slate-800 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/30 text-sky-300 text-[10px] font-semibold mb-1.5">
                <Bus className="w-3 h-3 text-sky-400" />
                <span>Greater Noida Transit</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                College Bus Portal
              </h2>
              <p className="text-[11px] text-slate-300">
                Live 16 buses tracking &bull; 21 Stops &bull; Digital passes
              </p>
            </div>

            {/* Mobile Visual Bus Route Graphic Badge */}
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col items-center justify-center p-1 text-center shrink-0 shadow-inner">
              <Bus className="w-6 h-6 text-sky-400 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400 mt-1">ONLINE</span>
            </div>
          </div>

          {/* Mini Route Path Graphic on Mobile */}
          <div className="relative z-10 mt-3 pt-2 border-t border-slate-800/80">
            <svg className="w-full h-8" viewBox="0 0 280 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 15 16 L 130 16 L 265 16" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M 15 16 L 130 16" stroke="#38bdf8" strokeWidth="2.5" />
              <circle cx="15" cy="16" r="4" fill="#0284c7" />
              <circle cx="130" cy="16" r="4" fill="#38bdf8" />
              <circle cx="265" cy="16" r="4" fill="#64748b" />
              <text x="15" y="28" fill="#94a3b8" fontSize="7" fontFamily="sans-serif">Campus</text>
              <text x="130" y="28" fill="#38bdf8" fontSize="7" fontFamily="sans-serif" textAnchor="middle">Pari Chowk</text>
              <text x="265" y="28" fill="#94a3b8" fontSize="7" fontFamily="sans-serif" textAnchor="end">Sec 62</text>
            </svg>
          </div>
        </div>

        {/* Form Container Column */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-center p-5 sm:p-8 lg:p-10 bg-white dark:bg-slate-900 transition-colors">
          <div className="w-full max-w-sm mx-auto">
            {children}
          </div>
        </div>

      </div>

      {/* Footer text */}
      <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-4">
        &copy; {new Date().getFullYear()} Greater Noida College Transit Authority &bull; Greater Noida, Uttar Pradesh
      </p>
    </div>
  );
}
