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
          setSelectedBus(prev => {
            if (!prev) return null;
            const updated = res.data.buses.find(
              b => (b._id || b.id)?.toString() === (prev._id || prev.id)?.toString()
            );
            return updated || prev;
          });
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
      setMapZoom(14);
    }
  };

  const filteredBuses = buses.filter(b => {
    if (filterCrowd === 'ALL') return true;
    const hasOcc = typeof b.occupancyPercentage === 'number' && typeof b.capacity === 'number';
    if (!hasOcc) return false;
    const occ = b.occupancyPercentage;
    if (filterCrowd === 'LOW') return occ < 50;
    if (filterCrowd === 'MEDIUM') return occ >= 50 && occ <= 80;
    if (filterCrowd === 'HIGH') return occ > 80;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Live Fleet Tracking & Telemetry
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time coordinates and occupancy levels along Greater Noida corridors (updates every 3s).
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterCrowd(lvl)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                filterCrowd === lvl
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-card transition-colors">
            <TransitMap
              buses={filteredBuses}
              stops={stops}
              routes={routes}
              selectedBus={selectedBus}
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
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-subtle transition-colors">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tracked Fleet</span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{buses.length} Buses</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-subtle transition-colors">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active In-Service</span>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {buses.filter(b => b.status === 'active').length} Active
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-subtle transition-colors">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Speed</span>
              <p className="text-base font-bold text-sky-700 dark:text-sky-400 mt-0.5">34 km/h</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-subtle transition-colors">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GPS Telemetry Rate</span>
              <p className="text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5 font-mono">3.0s</p>
            </div>
          </div>
        </div>

        {/* Right Side: Bus Telemetry Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Bus className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Active Buses ({filteredBuses.length})
            </h2>
            <span className="text-[11px] text-slate-400">Click to focus on map</span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredBuses.map((bus) => {
              const busIdStr = (bus._id || bus.id)?.toString();
              const selectedBusIdStr = (selectedBus?._id || selectedBus?.id)?.toString();
              const isSelected = !!selectedBus && (
                (selectedBusIdStr && selectedBusIdStr === busIdStr) ||
                (selectedBus.busNumber && selectedBus.busNumber === bus.busNumber)
              );

              const hasOcc = typeof bus.occupancyPercentage === 'number' && typeof bus.capacity === 'number';
              const occ = hasOcc ? bus.occupancyPercentage : null;
              const availableSeats = hasOcc ? Math.max(0, (bus.capacity || 0) - (bus.currentPassengers || 0)) : null;

              let crowdBadgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
              let crowdLabel = 'Crowd data unavailable';

              if (occ !== null) {
                if (occ < 50) {
                  crowdLabel = `Low (${occ}%)`;
                  crowdBadgeClass = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
                } else if (occ <= 80) {
                  crowdLabel = `Medium (${occ}%)`;
                  crowdBadgeClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                } else {
                  crowdLabel = `High (${occ}%)`;
                  crowdBadgeClass = 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
                }
              }

              return (
                <div
                  key={bus.id || bus._id}
                  onClick={() => handleSelectBus(bus)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/70 dark:bg-sky-950/50 border-sky-600 shadow-md ring-2 ring-sky-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        bus.busType === 'government' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' :
                        bus.busType === 'private' ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300' :
                        'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'
                      }`}>
                        <Bus className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{bus.busNumber}</h4>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border ${
                            bus.busType === 'government' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                            bus.busType === 'private' ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
                            'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border-teal-200 dark:border-teal-800'
                          }`}>
                            {bus.busType || 'college'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono">{bus.plateNumber}</span>
                          <span>&bull;</span>
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            {bus.fare === 0 || !bus.fare ? 'Free/Subsidized' : `₹${bus.fare}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${crowdBadgeClass}`}>
                      {crowdLabel}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mb-2">
                    {bus.route?.name || 'Greater Noida Corridor'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                      <span>Next: <strong>~{bus.nextStopEtaMinutes || 4}m</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                      <span>
                        {hasOcc ? (
                          <>Seats: <strong>{bus.currentPassengers}/{bus.capacity}</strong> ({availableSeats} left)</>
                        ) : (
                          <span className="italic text-slate-400">Crowd n/a</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
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
