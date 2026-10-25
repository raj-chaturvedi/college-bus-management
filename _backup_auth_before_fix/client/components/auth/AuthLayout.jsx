import React from 'react';
import { Bus, MapPin, ShieldCheck, Clock, Navigation, Radio, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';

export default function AuthLayout({ children, activeTab = 'login' }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between selection:bg-[#0F766E] selection:text-white">
      {/* Main Authentication Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* Left Column: Brand & Transport Technology Identity (Midnight Blue #102A43) */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-[#102A43] text-white flex-col justify-between p-8 xl:p-12 relative overflow-hidden border-r border-slate-800">
          {/* Subtle transit route network watermark pattern */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#38bdf8_1.5px,transparent_1.5px)] [background-size:20px_20px]" />
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

          {/* Top Brand Identity */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-900/60 border border-teal-500/40 text-teal-300 text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
              <Bus className="w-3.5 h-3.5 text-teal-400" />
              <span>Integrated Regional Transit</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight">
              Greater Noida<br />Transit Authority
            </h1>
            <p className="text-sm font-medium text-slate-300">
              Campus, Government &amp; Private Transit Hub
            </p>
            <p className="text-sm text-slate-300/90 mt-3 leading-relaxed font-normal">
              Live telemetry tracking, Dijkstra-optimized route recommendation, and single-click boarding passes.
            </p>
          </div>

          {/* Multimodal Transit Operations Context */}
          <div className="relative z-10 my-6 space-y-5">
            <div className="bg-slate-900/70 border border-slate-700/80 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <span>Active Network Fleet</span>
                <span className="flex items-center gap-1.5 text-teal-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  Live GPS Ingestion
                </span>
              </div>

              {/* 3 Multimodal Fleet Categories */}
              <div className="grid grid-cols-3 gap-2.5 text-center mb-3">
                <div className="p-2.5 rounded-xl bg-teal-950/50 border border-teal-800/60">
                  <div className="text-lg font-bold text-teal-300">8</div>
                  <div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider mt-0.5">College Fleet</div>
                  <div className="text-[9px] text-teal-400/80 font-mono mt-0.5">₹0 Subsidized</div>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-950/50 border border-blue-800/60">
                  <div className="text-lg font-bold text-blue-300">4</div>
                  <div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider mt-0.5">Govt UPSRTC</div>
                  <div className="text-[9px] text-blue-400/80 font-mono mt-0.5">City &amp; Feeder</div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-800/60">
                  <div className="text-lg font-bold text-purple-300">4</div>
                  <div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider mt-0.5">Private Bus</div>
                  <div className="text-[9px] text-purple-400/80 font-mono mt-0.5">Express Lines</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="py-1.5 px-2 rounded-lg bg-slate-800/60 text-slate-300 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Campus Stops</span>
                  <span className="font-bold text-white">21 Hubs</span>
                </div>
                <div className="py-1.5 px-2 rounded-lg bg-slate-800/60 text-slate-300 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Punctuality</span>
                  <span className="font-bold text-teal-400">98.4%</span>
                </div>
              </div>
            </div>

            {/* Key Corridors */}
            <div className="space-y-2 text-xs">
              <div className="text-slate-400 font-semibold tracking-wide uppercase text-[10px]">
                Monitored Corridors
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Pari Chowk &bull; Knowledge Park II &bull; GL Bajaj KP-3</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Gautam Buddha University &bull; Tech Zone 2 &bull; Bennett</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Greater Noida West (Gaur City) &bull; Surajpur &bull; Kasna</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Verified Multi-Tier Access
            </span>
            <span className="text-slate-400 font-mono text-[11px]">GNTA Transit Portal</span>
          </div>
        </div>

        {/* Right Column: Premium Off-White Form Container (#F8FAFC) */}
        <div className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 bg-[#F8FAFC]">
          {/* Mobile Brand Header */}
          <div className="w-full max-w-md lg:hidden mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#102A43] text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Bus className="w-3.5 h-3.5 text-teal-400" />
              <span>Greater Noida Transit</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Student &amp; Commuter Portal</h2>
            <p className="text-xs text-slate-500 mt-0.5">College, Government &amp; Private Bus Network</p>
          </div>

          {/* Authentication Card Wrapper (Crisp white #FFFFFF with soft border and elevated shadow) */}
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
            {children}
          </div>

          {/* Institutional Footer note */}
          <div className="w-full max-w-md mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Greater Noida Transit Authority &bull; UP-16 Transportation Desk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
