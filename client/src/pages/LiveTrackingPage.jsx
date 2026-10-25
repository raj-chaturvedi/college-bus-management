import React, { useState, useEffect } from 'react';
import { transitAPI } from '../services/api';
import TransitMap from '../components/map/TransitMap';
import StopDepartureBoardModal from '../components/common/StopDepartureBoardModal';
import {
  Bus,
  MapPin,
  Clock,
  Users,
  Compass,
  Filter,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { GREATER_NOIDA_CENTER } from '../services/geocodingService';

export default function LiveTrackingPage() {
  const [buses, setBuses] = useState([]);
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [filterCrowd, setFilterCrowd] = useState('ALL');
  const [mapCenter, setMapCenter] = useState(GREATER_NOIDA_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [showStopBoard, setShowStopBoard] = useState(false);
  const [selectedStop, setSelectedStop] = useState({ id: '', name: '' });

  useEffect(() => {
    let isMounted = true;

    const fetchInitial = async () => {
      try {
        const [busesRes, stopsRes, routesRes] = await Promise.all([
          transitAPI.getLiveBuses(),
          transitAPI.getStops(),
          transitAPI.getRoutes()
        ]);
        if (!isMounted) return;
        if (busesRes.data?.success) setBuses(busesRes.data.buses);
        if (stopsRes.data?.success) setStops(stopsRes.data.stops);
        if (routesRes.data?.success) setRoutes(routesRes.data.routes);
      } catch (err) {
        console.error('Failed to load tracking data:', err);
      }
    };

    fetchInitial();

    const interval = setInterval(async () => {
      try {
        const res = await transitAPI.getLiveBuses();
        if (res.data?.success && isMounted) {
          setBuses(res.data.buses);
        }
      } catch {}
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    if (bus.currentLocation?.latitude && bus.currentLocation?.longitude) {
      setMapCenter([bus.currentLocation.latitude, bus.currentLocation.longitude]);
      setMapZoom(15);
    }
  };

  const filteredBuses = buses.filter(b => {
    if (filterCrowd === 'ALL') return true;
    return b.crowdLevel === filterCrowd;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Live Fleet Tracking & Telemetry
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time coordinates and occupancy levels along Greater Noida corridors (updates every 3s).
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterCrowd(lvl)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                filterCrowd === lvl
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lvl === 'ALL' ? 'All Buses' : `${lvl.charAt(0) + lvl.slice(1).toLowerCase()} Crowd`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Map & Bus List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Map */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl bg-white border border-slate-200 p-2 shadow-card">
            <TransitMap
              buses={filteredBuses}
              stops={stops}
              routes={routes}
              center={mapCenter}
              zoom={mapZoom}
              height="580px"
              onOpenStopBoard={(stopId, stopName) => {
                setSelectedStop({ id: stopId, name: stopName });
                setShowStopBoard(true);
              }}
            />
          </div>

          {/* Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-subtle">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tracked Fleet</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{buses.length} Buses</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-subtle">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active In-Service</span>
              <p className="text-base font-bold text-emerald-700 mt-0.5">
                {buses.filter(b => b.status === 'active').length} Active
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-subtle">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Speed</span>
              <p className="text-base font-bold text-sky-700 mt-0.5">34 km/h</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-subtle">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GPS Telemetry Rate</span>
              <p className="text-base font-bold text-slate-700 mt-0.5 font-mono">3.0s</p>
            </div>
          </div>
        </div>

        {/* Right Side: Bus Telemetry Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Bus className="h-4 w-4 text-sky-600" /> Active Buses ({filteredBuses.length})
            </h2>
            <span className="text-[11px] text-slate-400">Click to focus on map</span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredBuses.map((bus) => {
              const isSelected = selectedBus?._id === bus._id || selectedBus?.id === bus.id;
              const occ = bus.occupancyPercentage || 50;
              const crowd = bus.crowdLevel || 'MEDIUM';

              const crowdBadgeClass =
                crowd === 'LOW'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : crowd === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-red-50 text-red-800 border-red-200';

              return (
                <div
                  key={bus.id || bus._id}
                  onClick={() => handleSelectBus(bus)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/60 border-sky-600 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        bus.busType === 'government' ? 'bg-blue-50 text-blue-700' :
                        bus.busType === 'private' ? 'bg-purple-50 text-purple-700' :
                        'bg-teal-50 text-teal-700'
                      }`}>
                        <Bus className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900">{bus.busNumber}</h4>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border ${
                            bus.busType === 'government' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            bus.busType === 'private' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-teal-50 text-[#0F766E] border-teal-200'
                          }`}>
                            {bus.busType || 'college'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-mono">{bus.plateNumber}</span>
                          <span>&bull;</span>
                          <span className="text-slate-600 font-medium">
                            {bus.fare === 0 || !bus.fare ? 'Free/Subsidized' : `₹${bus.fare}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${crowdBadgeClass}`}>
                      {crowd} ({occ}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 truncate mb-2">
                    {bus.route?.name || 'Greater Noida Corridor'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-sky-600" />
                      <span>Next: <strong>~{bus.nextStopEtaMinutes || 4}m</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-indigo-600" />
                      <span>Seats: <strong>{bus.currentPassengers}/{bus.capacity}</strong></span>
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Speed: {bus.speed || 32} km/h</span>
                    <span>Dir: {bus.direction || 'outbound'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-Time Stop Departure Board Modal */}
      <StopDepartureBoardModal
        isOpen={showStopBoard}
        onClose={() => setShowStopBoard(false)}
        initialStopId={selectedStop.id}
        initialStopName={selectedStop.name}
      />
    </div>
  );
}
