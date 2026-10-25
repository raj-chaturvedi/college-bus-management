import React from 'react';
import { Bus, MapPin, ShieldCheck, Clock, Navigation, Radio, ArrowRight } from 'lucide-react';

export default function AuthLayout({ children, activeTab = 'login' }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Main Authentication Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* Left Column: Brand & Transportation Identity (Desktop/Tablet) */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-slate-900 border-r border-slate-800 flex-col justify-between p-8 xl:p-12 relative overflow-hidden">
          {/* Subtle geometric pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Top Brand Identity */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Bus className="w-4 h-4 text-sky-400" />
              <span>Official Campus Transit</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
              Greater Noida<br />College Transit
            </h1>
            <p className="text-sm font-medium text-slate-400">
              Student &amp; Faculty Transit Portal
            </p>
            <p className="text-base text-slate-300 mt-4 leading-relaxed font-normal">
              &ldquo;Your campus journey, simplified.&rdquo;
            </p>
          </div>

          {/* Transportation Operations Context */}
          <div className="relative z-10 my-8 space-y-6">
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>Greater Noida Network Status</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Fleet Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                  <div className="text-xl font-bold text-white">16</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Active Buses</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                  <div className="text-xl font-bold text-white">21</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Campus Stops</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                  <div className="text-xl font-bold text-emerald-400">98.4%</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">On-Time Rate</div>
                </div>
              </div>
            </div>

            {/* Real Corridors */}
            <div className="space-y-2.5 text-xs">
              <div className="text-slate-400 font-semibold tracking-wide uppercase text-[11px]">
                Key Transit Corridors
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Pari Chowk &bull; Knowledge Park II &bull; GL Bajaj KP-3</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Gautam Buddha University &bull; Tech Zone &bull; Alpha 1</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Greater Noida West (Gaur City) &bull; Surajpur &bull; Kasna</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Institutional Access
            </span>
            <span>Uttar Pradesh, India</span>
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 bg-slate-950">
          {/* Mobile Brand Header */}
          <div className="w-full max-w-md lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Bus className="w-4 h-4 text-sky-400" />
              <span>Greater Noida College Transit</span>
            </div>
            <h2 className="text-xl font-bold text-white">Student &amp; Faculty Transit Portal</h2>
            <p className="text-xs text-slate-400 mt-1">Your campus journey, simplified.</p>
          </div>

          {/* Authentication Card Wrapper */}
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl shadow-black/40">
            {children}
          </div>

          {/* Institutional Footer note */}
          <div className="w-full max-w-md mt-6 text-center text-xs text-slate-400">
            Greater Noida Transit Authority &bull; Greater Noida, UP, India
          </div>
        </div>
      </div>
    </div>
  );
}
