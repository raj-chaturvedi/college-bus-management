import React from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Footprints,
  Users,
  ShieldCheck,
  Timer,
  HelpCircle,
  Bus
} from 'lucide-react';

export default function WhyThisRouteModal({ isOpen, onClose, candidate, activeMode }) {
  if (!isOpen || !candidate) return null;

  const { bus, route, scores, metrics, explanation, score } = candidate;

  const scoreRows = [
    {
      label: 'Travel Time',
      score: scores?.travelTimeScore || 85,
      raw: `${metrics.travelTimeMinutes} min travel`,
      icon: Clock,
      barColor: 'bg-sky-600'
    },
    {
      label: 'Walking Distance',
      score: scores?.walkingScore || 90,
      raw: `${metrics.walkingMeters}m walk`,
      icon: Footprints,
      barColor: 'bg-teal-600'
    },
    {
      label: 'Crowd & Seating',
      score: scores?.crowdScore || 80,
      raw: `${metrics.occupancyPercentage}% full (${metrics.crowdLevel})`,
      icon: Users,
      barColor: 'bg-indigo-600'
    },
    {
      label: 'On-Time Reliability',
      score: scores?.reliabilityScore || 92,
      raw: `${metrics.reliabilityPercentage}% on-time, ${metrics.averageDelayMinutes}m avg delay`,
      icon: ShieldCheck,
      barColor: 'bg-emerald-600'
    },
    {
      label: 'Boarding Wait (ETA)',
      score: scores?.waitingScore || 95,
      raw: `~${metrics.etaMinutes} min boarding wait`,
      icon: Timer,
      barColor: 'bg-amber-600'
    }
  ];

  return (
    <div className="fixed inset-0 z-[1000] app-modal-backdrop flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative z-[1100] app-modal-content w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Why This Route Was Recommended</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                  {activeMode || 'BALANCED'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Multi-criteria ranking algorithm breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Selected Bus Banner */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Top Recommendation</span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{bus.busNumber}</h4>
            <p className="text-xs text-slate-500">{route.name}</p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-0.5">
              <span className="text-2xl font-bold text-sky-700 font-mono">{score}</span>
              <span className="text-xs text-slate-400 font-mono">/100</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
              <CheckCircle2 className="h-3 w-3" /> Optimal Match
            </span>
          </div>
        </div>

        {/* Metrics Breakdown */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Algorithmic Scoring Factors
          </p>
          <div className="space-y-2.5">
            {scoreRows.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">{item.raw}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {item.score}<span className="text-[10px] text-slate-400">/100</span>
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.barColor}`}
                      style={{ width: `${Math.min(100, Math.max(10, item.score))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation Box */}
        <div className="rounded-lg bg-sky-50 border border-sky-100 p-3 text-xs text-sky-900 leading-relaxed">
          <strong className="text-sky-800">Recommendation Summary: </strong>
          {explanation}
        </div>

        <div>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
