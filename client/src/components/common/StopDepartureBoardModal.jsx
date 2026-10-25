import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Bus,
  RefreshCw,
  Radio
} from 'lucide-react';
import { transitAPI } from '../../services/api';

export default function StopDepartureBoardModal({ isOpen, onClose, stopId, stopName, initialStopId, initialStopName }) {
  const activeStopId = stopId || initialStopId;
  const activeStopName = stopName || initialStopName;

  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBoard = async () => {
    if (!activeStopId) return;
    try {
      const res = await transitAPI.getStopBoard(activeStopId);
      if (res.data?.success) {
        setBoardData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeStopId) {
      setLoading(true);
      fetchBoard();
      const interval = setInterval(fetchBoard, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeStopId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] app-modal-backdrop flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative z-[1100] app-modal-content w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50 border border-brand-100 text-brand-600">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Live Station Departures</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  LIVE FEED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Stop: <strong className="text-slate-800">{activeStopName || boardData?.stop?.name || 'Station'}</strong> ({boardData?.stop?.code || 'HUB'})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Schedule Table */}
        <div className="mt-4 overflow-x-auto rounded-xl bg-white border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Route Corridor</th>
                <th className="p-3">Expected Time</th>
                <th className="p-3">ETA</th>
                <th className="p-3">Occupancy</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && !boardData ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Fetching live bus telemetry...
                  </td>
                </tr>
              ) : boardData?.arrivals?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No active buses currently dispatching toward this station.
                  </td>
                </tr>
              ) : (
                boardData?.arrivals?.map((arr) => {
                  const isCrowded = arr.crowdLevel === 'HIGH';
                  const isLow = arr.crowdLevel === 'LOW';

                  return (
                    <tr key={arr.busId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <Bus className="h-4 w-4 text-brand-600" />
                        <span>{arr.busNumber}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] text-white font-bold"
                          style={{ backgroundColor: arr.routeColor || '#0284c7' }}
                        >
                          {arr.routeCode}
                        </span>
                        <span className="ml-1.5 text-slate-600 hidden sm:inline">{arr.routeName}</span>
                      </td>
                      <td className="p-3 text-slate-700 font-semibold">{arr.clockTime}</td>
                      <td className="p-3">
                        <span className="font-bold text-brand-600 text-sm">~{arr.etaMinutes} min</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isLow ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          isCrowded ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {arr.occupancyPercentage}% ({arr.crowdLevel})
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {arr.delayMinutes > 0 ? (
                          <span className="text-[11px] text-rose-600 font-semibold">
                            Delayed (+{arr.delayMinutes}m)
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">
                            On Time ({arr.speed} km/h)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" /> Auto-refreshing every 4s via live GPS
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Close Board
          </button>
        </div>
      </div>
    </div>
  );
}
