import React from 'react';
import {
  SlidersHorizontal,
  Zap,
  Footprints,
  Users,
  Compass,
  Clock,
  ShieldCheck,
  Scale
} from 'lucide-react';

const PREFERENCE_OPTIONS = [
  { id: 'BALANCED', label: 'Balanced', desc: 'Equal weight on time, crowd & walk', icon: Scale },
  { id: 'FASTEST', label: 'Fastest', desc: 'Minimum total travel time', icon: Zap },
  { id: 'LEAST_WALKING', label: 'Least Walking', desc: 'Shortest pedestrian distance', icon: Footprints },
  { id: 'LEAST_CROWDED', label: 'Least Crowded', desc: 'Guaranteed seat & low density', icon: Users },
  { id: 'NO_TRANSFERS', label: 'No Transfers', desc: 'Direct single-bus corridors', icon: Compass },
  { id: 'LEAST_WAITING', label: 'Least Waiting', desc: 'Fastest boarding ETA', icon: Clock },
  { id: 'MOST_RELIABLE', label: 'Most Reliable', desc: 'Highest on-time transit record', icon: ShieldCheck }
];

export default function WhatIfPanel({ activeMode, onSelectMode, isRecalculating }) {
  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-700/50 text-cyan-400">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              "What If?" Route Optimizer
              {isRecalculating && (
                <span className="text-[11px] font-normal text-cyan-400 animate-pulse">
                  Re-evaluating graph weights...
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Select an optimization objective to instantly recalculate scores and rank buses
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 w-fit">
          Active: <strong className="text-cyan-400">{activeMode}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {PREFERENCE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeMode === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelectMode(opt.id)}
              disabled={isRecalculating}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-b from-brand-600/30 to-cyan-600/20 border-cyan-500/80 text-white shadow-glow-sm'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <Icon className={`h-4 w-4 mb-1.5 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
              <span className="text-xs font-bold tracking-tight">{opt.label}</span>
              <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 hidden lg:block">
                {opt.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
