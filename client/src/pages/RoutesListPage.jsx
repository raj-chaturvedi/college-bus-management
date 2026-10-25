import React, { useState, useEffect } from 'react';
import { transitAPI } from '../services/api';
import {
  Route as RouteIcon,
  Clock,
  MapPin,
  Bus,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function RoutesListPage() {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [expandedRouteId, setExpandedRouteId] = useState(null);

  useEffect(() => {
    Promise.all([transitAPI.getRoutes(), transitAPI.getLiveBuses()])
      .then(([routesRes, busesRes]) => {
        if (routesRes.data?.success) setRoutes(routesRes.data.routes);
        if (busesRes.data?.success) setBuses(busesRes.data.buses);
      })
      .catch(err => console.error('Failed to load routes:', err));
  }, []);

  const toggleExpand = (id) => {
    setExpandedRouteId(expandedRouteId === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
        <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <RouteIcon className="h-5 w-5 text-sky-600" /> Greater Noida Corridors & Routes
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive schedule of active college transit corridors, stop sequences, and assigned bus units.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {routes.map((route) => {
          const isExpanded = expandedRouteId === route._id;
          const assignedBuses = buses.filter(
            b => (b.route?._id || b.route || '').toString() === route._id.toString()
          );

          return (
            <div
              key={route._id}
              className="rounded-xl bg-white border border-slate-200 p-5 shadow-card flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-mono font-bold text-white shadow-sm"
                        style={{ backgroundColor: route.color || '#0284c7' }}
                      >
                        {route.code}
                      </span>
                      <span className="text-xs text-slate-500">
                        Every {route.frequencyMinutes || 15} mins
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{route.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-800 text-xs font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>94% On-Time</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                  {route.description || 'Dedicated campus transit corridor connecting students safely.'}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center mb-3.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Distance</span>
                    <p className="font-bold text-slate-900 mt-0.5">{route.distance} km</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Duration</span>
                    <p className="font-bold text-slate-900 mt-0.5">{route.estimatedTime} mins</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Stops</span>
                    <p className="font-bold text-slate-900 mt-0.5">{route.stops?.length || 0} stops</p>
                  </div>
                </div>

                {/* Assigned Buses */}
                <div className="mb-3.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Assigned Fleet ({assignedBuses.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedBuses.length === 0 ? (
                      <span className="text-xs text-slate-400">Next dispatch in 8 mins</span>
                    ) : (
                      assignedBuses.map((b) => (
                        <div
                          key={b.id || b._id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-800"
                        >
                          <Bus className="h-3.5 w-3.5 text-sky-600" />
                          <span className="font-bold">{b.busNumber}</span>
                          <span className={`text-[10px] font-semibold ml-1 px-1.5 py-0.2 rounded ${
                            b.crowdLevel === 'LOW'
                              ? 'bg-emerald-50 text-emerald-800'
                              : b.crowdLevel === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-red-50 text-red-800'
                          }`}>
                            {b.occupancyPercentage}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Expanded Stops Sequence */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 space-y-2 mb-3">
                    <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider block">
                      Sequence of Stops:
                    </span>
                    <div className="space-y-1.5 pl-2.5 border-l-2 border-sky-600">
                      {(route.stops || []).map((st, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                            {st.stop?.name || `Stop #${i + 1}`}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            +{st.scheduledMinutesFromStart || i * 5} min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Stops Accordion */}
              <button
                onClick={() => toggleExpand(route._id)}
                className="w-full py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{isExpanded ? 'Hide Stop Schedule' : 'View Stop Sequence'}</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
