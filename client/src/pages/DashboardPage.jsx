import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transitAPI } from '../services/api';
import TransitMap from '../components/map/TransitMap';
import WhyThisRouteModal from '../components/common/WhyThisRouteModal';
import DigitalPassModal from '../components/common/DigitalPassModal';
import StopDepartureBoardModal from '../components/common/StopDepartureBoardModal';
import ReportIncidentModal from '../components/common/ReportIncidentModal';
import EmergencyModal from '../components/common/EmergencyModal';
import {
  detectCurrentLocation,
  isInGreaterNoidaServiceArea,
  GREATER_NOIDA_CENTER,
  POPULAR_GREATER_NOIDA_DESTINATIONS
} from '../services/geocodingService';
import { calculateBusArrivalInfo } from '../utils/etaCalculator';
import {
  Search,
  MapPin,
  Navigation,
  Clock,
  Footprints,
  Users,
  ShieldCheck,
  ArrowRight,
  Crosshair,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Bus,
  Ticket,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

const PREFERENCE_MODES = [
  { id: 'BALANCED', label: 'Balanced', desc: 'Optimal multi-criteria mix' },
  { id: 'FASTEST', label: 'Fastest', desc: 'Lowest total travel duration' },
  { id: 'SHORTEST', label: 'Shortest Route', desc: 'Lowest actual road distance' },
  { id: 'LEAST_CROWDED', label: 'Least Crowded', desc: 'Guaranteed seating & low density' },
  { id: 'LEAST_WALKING', label: 'Least Walking', desc: 'Minimal pedestrian walking meters' },
  { id: 'LEAST_WAITING', label: 'Least Waiting', desc: 'Earliest arriving bus' },
  { id: 'MOST_RELIABLE', label: 'Most Reliable', desc: 'Highest on-time arrival history' }
];

export default function DashboardPage({ onOpenAI, onOpenPassModal, onUpdateRouteContext }) {
  const { user } = useAuth();

  // Core Data
  const [stops, setStops] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Search Fields
  const [sourceStopId, setSourceStopId] = useState('');
  const [destinationStopId, setDestinationStopId] = useState('');
  const [activeMode, setActiveMode] = useState(user?.preferences?.mode || 'BALANCED');

  // Location Detection State
  const [userCoords, setUserCoords] = useState(null);
  const [userLocationLabel, setUserLocationLabel] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationWarning, setLocationWarning] = useState('');

  // Recommendation State
  const [recommendation, setRecommendation] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [selectedCandidateForWhy, setSelectedCandidateForWhy] = useState(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [passBus, setPassBus] = useState(null);
  const [showStopBoard, setShowStopBoard] = useState(false);
  const [stopBoardInfo, setStopBoardInfo] = useState({ id: '', name: '' });
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState('live'); // 'live' | 'routes'

  // Live real-time dynamic clock & telemetry countdown
  const [liveClock, setLiveClock] = useState(() =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  );
  const [syncCountdown, setSyncCountdown] = useState(3);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setSyncCountdown(prev => (prev <= 1 ? 3 : prev - 1));
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [stopsRes, busesRes, routesRes, alertsRes] = await Promise.all([
          transitAPI.getStops(),
          transitAPI.getLiveBuses(),
          transitAPI.getRoutes(),
          transitAPI.getAlerts()
        ]);

        if (!isMounted) return;

        if (stopsRes.data?.success) {
          const list = stopsRes.data.stops;
          setStops(list);

          if (list.length >= 2) {
            // Find Sector 62 Link and GL Bajaj for primary demo route
            const sec62Stop = list.find(s => s.code === 'S62') || list[0];
            const glbStop = list.find(s => s.code === 'GLB') || list.find(s => s.code === 'KP3') || list[1];

            setSourceStopId(sec62Stop._id || sec62Stop.id);
            setDestinationStopId(glbStop._id || glbStop.id);

            // Fetch initial recommendation
            fetchRecommendation(
              sec62Stop._id || sec62Stop.id,
              glbStop._id || glbStop.id,
              user?.preferences?.mode || 'BALANCED'
            );
          }
        }

        if (busesRes.data?.success) setBuses(busesRes.data.buses);
        if (routesRes.data?.success) setRoutes(routesRes.data.routes);
        if (alertsRes.data?.success) setAlerts(alertsRes.data.alerts);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }

    loadData();

    // 3-second live bus telemetry loop
    const telemetryTimer = setInterval(async () => {
      try {
        const res = await transitAPI.getLiveBuses();
        if (res.data?.success && isMounted) {
          setBuses(res.data.buses);
        }
      } catch {}
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(telemetryTimer);
    };
  }, []);

  // Listen for mode changes triggered from AI Assistant action shortcuts
  useEffect(() => {
    const handleTransitModeEvent = (e) => {
      if (e.detail?.mode) {
        setActiveMode(e.detail.mode);
        fetchRecommendation(sourceStopId, destinationStopId, e.detail.mode);
      }
    };
    window.addEventListener('app:changeTransitMode', handleTransitModeEvent);
    return () => {
      window.removeEventListener('app:changeTransitMode', handleTransitModeEvent);
    };
  }, [sourceStopId, destinationStopId]);

  const fetchRecommendation = async (srcId, dstId, mode) => {
    if (!srcId || !dstId) return;
    setLoadingRecommendation(true);
    setErrorMessage('');

    try {
      const res = await transitAPI.getRecommendations({
        sourceStopId: srcId,
        destinationStopId: dstId,
        mode: mode || activeMode,
        preferences: user?.preferences
      });

      if (res.data?.success) {
        setRecommendation(res.data.recommendation);
        setSelectedCandidate(res.data.recommendation.bestMatch);

        if (onUpdateRouteContext) {
          const srcStop = stops.find(s => (s._id || s.id) === srcId);
          const dstStop = stops.find(s => (s._id || s.id) === dstId);
          onUpdateRouteContext({
            sourceName: srcStop?.name,
            destinationName: dstStop?.name,
            bestMatch: res.data.recommendation.bestMatch,
            alternatives: [
              res.data.recommendation.secondBest,
              res.data.recommendation.thirdBest
            ].filter(Boolean),
            activeMode: mode || activeMode
          });
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Could not find a valid route between these locations.');
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const handleSearch = () => {
    if (!sourceStopId || !destinationStopId) {
      setErrorMessage('Please select both a departure location and a destination.');
      return;
    }
    if (sourceStopId === destinationStopId) {
      setErrorMessage('Departure and destination stops cannot be the same.');
      return;
    }
    fetchRecommendation(sourceStopId, destinationStopId, activeMode);
  };

  const handleSwap = () => {
    const temp = sourceStopId;
    setSourceStopId(destinationStopId);
    setDestinationStopId(temp);
    fetchRecommendation(destinationStopId, temp, activeMode);
  };

  const handleDetectLocation = async () => {
    setIsLocating(true);
    setLocationWarning('');

    const res = await detectCurrentLocation();
    setIsLocating(false);

    if (res.success && res.coords) {
      setUserCoords(res.coords);
      setUserLocationLabel(res.address);

      if (!res.inServiceArea) {
        setLocationWarning("You're currently outside the Greater Noida service area.");
      } else {
        // If within Greater Noida, find nearest bus stop
        if (stops.length > 0) {
          let closest = null;
          let minDistance = Infinity;

          stops.forEach(s => {
            const d = Math.hypot(s.latitude - res.coords[0], s.longitude - res.coords[1]) * 111000;
            if (d < minDistance) {
              minDistance = d;
              closest = s;
            }
          });

          if (closest) {
            setSourceStopId(closest._id || closest.id);
            fetchRecommendation(closest._id || closest.id, destinationStopId, activeMode);
          }
        }
      }
    } else {
      setLocationWarning(res.message || 'Location unavailable. Please select a Greater Noida stop.');
    }
  };

  const handleSelectQuickDestination = (dest) => {
    // Check if destination matches a stop
    const matchingStop = stops.find(s =>
      s.name.toLowerCase().includes(dest.name.toLowerCase()) ||
      dest.name.toLowerCase().includes(s.name.toLowerCase()) ||
      (dest.id === 'dest_glbajaj' && (s.code === 'GLB' || s.code === 'KP3')) ||
      (dest.id === 'dest_sec62' && s.code === 'S62') ||
      (dest.id === 'dest_parichowk' && s.code === 'PCK')
    );

    if (matchingStop) {
      setDestinationStopId(matchingStop._id || matchingStop.id);
      fetchRecommendation(sourceStopId, matchingStop._id || matchingStop.id, activeMode);
    }
  };

  const currentSourceStop = stops.find(s => (s._id || s.id) === sourceStopId);
  const currentDestStop = stops.find(s => (s._id || s.id) === destinationStopId);

  const bestMatch = recommendation?.bestMatch;
  const secondBest = recommendation?.secondBest;
  const thirdBest = recommendation?.thirdBest;

  const activeCandidate = selectedCandidate || bestMatch;
  const isDirectAvailable = !!activeCandidate;

  // Derive active bus from active candidate and synchronize with latest telemetry
  const candidateBusId = (activeCandidate?.bus?.id || activeCandidate?.bus?._id)?.toString();
  const nextBus = candidateBusId
    ? (buses.find(b => (b.id || b._id)?.toString() === candidateBusId) || activeCandidate?.bus)
    : null;

  const currentRoute = routes.find(r => (r._id || r.id)?.toString() === (activeCandidate?.route?.id || activeCandidate?.route?._id)?.toString());

  // Calculate dynamic road-constrained arrival info
  const arrivalInfo = calculateBusArrivalInfo(
    nextBus,
    currentSourceStop,
    currentDestStop,
    currentRoute,
    isDirectAvailable
  );

  const nextBusOcc = typeof nextBus?.occupancyPercentage === 'number'
    ? nextBus.occupancyPercentage
    : (activeCandidate?.metrics?.occupancyPercentage ?? null);

  const nextBusReliability = activeCandidate?.reliabilityScore || (nextBus ? 92 : 94);

  const hour = new Date().getHours();
  const timeGreeting = hour >= 12 && hour < 17 ? 'Good afternoon' : (hour >= 17 || hour < 4 ? 'Good evening' : 'Good morning');
  const greetingName = user?.name ? user.name.trim().split(' ')[0] : 'Commuter';

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* ============================================================ */}
      {/* MOBILE-FIRST HUMAN EXPERIENCE (< 768px)                      */}
      {/* Clean, spacious, uncluttered, human-designed transport app   */}
      {/* ============================================================ */}
      <div className="block md:hidden space-y-4 px-1 pb-4">
        {/* Mobile Header: Clean, modern status header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {timeGreeting}, {greetingName}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-medium">{liveClock}</span>
              <span>&bull;</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Transit
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800 shadow-2xs">
              {buses.length || 16} Buses
            </span>
          </div>
        </div>

        {/* Next Bus Live ETA Card - Crisp, readable, single layer */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-750">
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${arrivalInfo.badgeClass}`}>
              {arrivalInfo.badge}
            </span>
            {nextBus && (
              <span className="text-xs font-mono text-sky-300 font-bold bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-800/80">
                {nextBus.busNumber}
              </span>
            )}
          </div>

          <div className="text-xl font-black text-white tracking-tight">
            {arrivalInfo.headline}
          </div>
          <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
            <span className="font-semibold text-white truncate max-w-[140px]">
              {currentSourceStop?.name?.split(' (')[0] || 'Origin'}
            </span>
            <span className="text-slate-400">&rarr;</span>
            <span className="font-semibold text-slate-200 truncate max-w-[140px]">
              {currentDestStop?.name?.split(' (')[0] || 'Destination'}
            </span>
            {arrivalInfo.distanceKm && (
              <span className="text-sky-300/80 font-mono text-[11px] shrink-0">({arrivalInfo.distanceKm} km)</span>
            )}
          </div>

          {arrivalInfo.isAvailable && nextBus && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Crowd: <strong className="text-white">{nextBusOcc !== null ? `${nextBusOcc}%` : 'N/A'}</strong></span>
                <span className="text-slate-400">Reliability: <strong className="text-emerald-400">{nextBusReliability}%</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPassBus(nextBus);
                  setShowPassModal(true);
                }}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Issue Pass</span>
              </button>
            </div>
          )}
        </div>

        {/* Clean 2-Segment Control: Live Map vs Route Finder */}
        <div className="bg-slate-100 dark:bg-slate-850 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setMobileActiveTab('live')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              mobileActiveTab === 'live'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Live Fleet Map</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveTab('routes')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              mobileActiveTab === 'routes'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Find Route</span>
          </button>
        </div>

        {/* TAB 1: LIVE FLEET TRACKING MAP */}
        {mobileActiveTab === 'live' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live GPS Telemetry
              </span>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800"
              >
                <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Locate Me'}</span>
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
              <TransitMap
                buses={buses}
                stops={stops}
                routes={routes}
                selectedBus={nextBus}
                recommendedRoute={activeCandidate}
                alternativeRoutes={
                  recommendation
                    ? [secondBest, thirdBest].filter(Boolean)
                    : []
                }
                sourceStop={sourceStopId}
                destinationStop={destinationStopId}
                userLocation={userCoords}
                destinationLocation={
                  currentDestStop ? [currentDestStop.latitude, currentDestStop.longitude] : null
                }
                center={
                  currentSourceStop
                    ? [currentSourceStop.latitude, currentSourceStop.longitude]
                    : GREATER_NOIDA_CENTER
                }
                zoom={13}
                height="380px"
                onSelectDeparture={(id) => {
                  setSourceStopId(id);
                  fetchRecommendation(id, destinationStopId, activeMode);
                }}
                onSelectDestination={(id) => {
                  setDestinationStopId(id);
                  fetchRecommendation(sourceStopId, id, activeMode);
                }}
                onOpenStopBoard={(id, name) => {
                  setStopBoardInfo({ id, name });
                  setShowStopBoard(true);
                }}
                onLocateUser={handleDetectLocation}
              />
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Tap any bus or station pin to inspect live telemetry</span>
              <button
                type="button"
                onClick={() => setMobileActiveTab('routes')}
                className="font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
              >
                <span>Change route</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ROUTE SEARCH & RECOMMENDATIONS */}
        {mobileActiveTab === 'routes' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Route Planning Inputs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Select Journey</span>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1"
                >
                  <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'Nearest Stop'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Boarding From</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <select
                      value={sourceStopId}
                      onChange={(e) => setSourceStopId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {stops.map((stop) => (
                        <option key={stop._id || stop.id} value={stop._id || stop.id}>
                          {stop.name} ({stop.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-center -my-1 relative z-10">
                  <button
                    type="button"
                    onClick={handleSwap}
                    className="p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50"
                    title="Swap origin & destination"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Going To</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Navigation className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <select
                      value={destinationStopId}
                      onChange={(e) => setDestinationStopId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {stops.map((stop) => (
                        <option key={stop._id || stop.id} value={stop._id || stop.id}>
                          {stop.name} ({stop.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preference Modes Bar */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Preference</label>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {PREFERENCE_MODES.slice(0, 5).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveMode(m.id);
                        fetchRecommendation(sourceStopId, destinationStopId, m.id);
                      }}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap ${
                        activeMode === m.id
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={loadingRecommendation}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Search className="h-4 w-4" />
                <span>{loadingRecommendation ? 'Calculating optimal routes...' : 'Search Available Buses'}</span>
              </button>
            </div>

            {/* Route Results Cards */}
            {bestMatch && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Route Recommendations</span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Match: {bestMatch.score}%</span>
                </div>

                {/* Best Match Card */}
                <div
                  onClick={() => {
                    setSelectedCandidate(bestMatch);
                    setMobileActiveTab('live');
                  }}
                  className={`p-4 rounded-2xl border transition active:scale-[0.99] cursor-pointer ${
                    activeCandidate?.candidateId === bestMatch.candidateId
                      ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 shadow-sm ring-1 ring-sky-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                      Recommended
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                      {bestMatch.metrics?.travelTimeMinutes} min &bull; {bestMatch.metrics?.distanceKm} km
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-base">
                        {bestMatch.bus?.busNumber}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[210px] mt-0.5">
                        {bestMatch.route?.name}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-200 block">
                        Occupancy: {bestMatch.metrics?.occupancyPercentage}%
                      </span>
                      <span className="text-slate-400 font-medium text-[11px]">
                        Walk: {bestMatch.metrics?.walkingMeters}m
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCandidateForWhy(bestMatch);
                      }}
                      className="text-sky-600 dark:text-sky-400 font-bold text-xs"
                    >
                      Why this route?
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidate(bestMatch);
                          setMobileActiveTab('live');
                        }}
                        className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold rounded-xl text-xs border border-sky-200 dark:border-sky-800"
                      >
                        Track on Map
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPassBus(bestMatch.bus);
                          setShowPassModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-xs"
                      >
                        Issue Pass
                      </button>
                    </div>
                  </div>
                </div>

                {/* Second Option */}
                {secondBest && (
                  <div
                    onClick={() => {
                      setSelectedCandidate(secondBest);
                      setMobileActiveTab('live');
                    }}
                    className={`p-3.5 rounded-2xl border transition active:scale-[0.99] cursor-pointer ${
                      activeCandidate?.candidateId === secondBest.candidateId
                        ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          Alternative Option
                        </span>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                          {secondBest.bus?.busNumber} &bull; {secondBest.route?.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono">
                          {secondBest.metrics?.travelTimeMinutes} min
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {secondBest.metrics?.distanceKm} km
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* DESKTOP EXPERIENCE (>= 768px)                                */}
      {/* Exact original rich desktop layout preserved intact          */}
      {/* ============================================================ */}
      <div className="hidden md:block space-y-5">
        {/* 1. Header / Real-Time Operations Telemetry Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 dark:text-white text-lg">
                {timeGreeting}, {greetingName}
              </h1>
              <span className="text-[11px] font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded border border-sky-100 dark:border-sky-800">
                Greater Noida Transit
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Knowledge Park &bull; Pari Chowk &bull; Sector 62 Link &bull; Campus Transit Corridors
            </p>
          </div>

          {/* Real Dynamic Telemetry Indicators */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs text-slate-600 dark:text-slate-300 border-t md:border-t-0 pt-2 md:pt-0 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md font-semibold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SERVICE: ON TIME</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md">
              <span className="font-semibold text-slate-900 dark:text-white">{buses.length || 16}</span>
              <span className="text-slate-500 dark:text-slate-400">Active Buses</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
              <span>GPS sync: {syncCountdown} seconds ago</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md">
              <span>{liveClock}</span>
            </div>
          </div>
        </div>

        {/* 2. Your Next Journey Card */}
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${arrivalInfo.badgeClass}`}>
                  {arrivalInfo.badge}
                </span>
                {nextBus ? (
                  <span className="text-xs text-slate-400 font-mono">
                    {nextBus.busNumber} &bull; {nextBus.plateNumber || 'UP-16-CB-1012'}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Campus Transit Service</span>
                )}
              </div>
              <div className="text-lg font-bold text-white flex flex-wrap items-center gap-2">
                <span>{arrivalInfo.headline}</span>
                {arrivalInfo.isAvailable && (
                  <span className="text-xs font-normal text-slate-400">
                    {arrivalInfo.subtext}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {arrivalInfo.isAvailable ? (
                  <>Corridor to: <strong className="text-slate-200">{currentDestStop?.name || 'Selected Destination'}</strong> {arrivalInfo.distanceKm && <span className="text-slate-500 font-mono ml-1">({arrivalInfo.distanceKm} km road distance)</span>}</>
                ) : (
                  <span className="text-rose-300">{arrivalInfo.subtext}</span>
                )}
              </p>
            </div>

            {arrivalInfo.isAvailable && nextBus && (
              <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div>
                    <div className="text-[11px] text-slate-400">Occupancy</div>
                    <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                      <span>{nextBusOcc !== null ? `${nextBusOcc}%` : 'N/A'}</span>
                      {nextBusOcc !== null && (
                        <div className="w-12 sm:w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${nextBusOcc > 80 ? 'bg-rose-500' : nextBusOcc > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${nextBusOcc}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-l border-slate-800 pl-4 sm:pl-6">
                    <div className="text-[11px] text-slate-400">Reliability</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">{nextBusReliability}%</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPassBus(nextBus);
                    setShowPassModal(true);
                  }}
                  className="w-full xs:w-auto px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <Ticket className="w-3.5 h-3.5 text-sky-200" />
                  <span>Issue Pass</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Hero Search Area */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card space-y-4 transition-colors">
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              Find the best way to reach your destination.
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your departure and arrival points to get live bus options with real road routing.
            </p>
          </div>

          {/* Service area warning if user location is outside Greater Noida */}
          {locationWarning && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{locationWarning}</span>
              </div>
              <button
                onClick={() => {
                  setUserCoords(GREATER_NOIDA_CENTER);
                  setLocationWarning('');
                  const defaultStop = stops.find(s => s.code === 'PCK') || stops[0];
                  if (defaultStop) setSourceStopId(defaultStop._id || defaultStop.id);
                }}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold text-[11px] hover:bg-amber-100/50 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                Use Greater Noida Center
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Search Input Row */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-end">
            {/* Origin / Current Location */}
            <div className="md:col-span-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Your Current Location / Boarding Stop</span>
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="text-[11px] font-medium text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 flex items-center gap-1"
                >
                  <Crosshair className={`h-3 w-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Detecting...' : 'Detect Location'}</span>
                </button>
              </div>
              <select
                value={sourceStopId}
                onChange={(e) => setSourceStopId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600"
              >
                {stops.map((stop) => (
                  <option key={stop._id || stop.id} value={stop._id || stop.id}>
                    {stop.name} ({stop.code}) — {stop.zone}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center pb-0.5">
              <button
                type="button"
                onClick={handleSwap}
                className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Swap departure and destination"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Destination */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Navigation className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>Where do you want to go?</span>
              </label>
              <select
                value={destinationStopId}
                onChange={(e) => setDestinationStopId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600"
              >
                {stops.map((stop) => (
                  <option key={stop._id || stop.id} value={stop._id || stop.id}>
                    {stop.name} ({stop.code}) — {stop.zone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Controls & Preference Modes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">Optimize:</span>
              {PREFERENCE_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveMode(m.id);
                    fetchRecommendation(sourceStopId, destinationStopId, m.id);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    activeMode === m.id
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-transparent dark:border-slate-700'
                  }`}
                  title={m.desc}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleSearch}
              disabled={loadingRecommendation}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Search className="h-3.5 w-3.5" />
              <span>{loadingRecommendation ? 'Searching...' : 'Find Best Route'}</span>
            </button>
          </div>

          {/* Popular Destinations Quick Pick */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Popular Destinations in Greater Noida:
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {POPULAR_GREATER_NOIDA_DESTINATIONS.slice(0, 6).map((dest) => (
                <button
                  key={dest.id}
                  onClick={() => handleSelectQuickDestination(dest)}
                  className="px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] transition-colors"
                >
                  {dest.isCollege ? '🎓 ' : '📍 '}
                  {dest.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Interactive Map & Route Recommendations View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Route Options & Recommendations */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Available Route Options
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Ranked by {PREFERENCE_MODES.find(m => m.id === activeMode)?.label || 'Balanced'}
              </span>
            </div>

            {loadingRecommendation ? (
              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2">
                <span className="h-4 w-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                <p className="text-xs text-slate-600 dark:text-slate-400">Calculating road distances and telemetry...</p>
              </div>
            ) : !bestMatch ? (
              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2">
                <Bus className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">No route computed yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Select departure and destination to find buses.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Recommended Best Option Card */}
                <div
                  onClick={() => setSelectedCandidate(bestMatch)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    activeCandidate?.candidateId === bestMatch.candidateId
                      ? 'bg-sky-50/50 dark:bg-sky-950/40 border-sky-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
                        {bestMatch.badge || (activeMode === 'SHORTEST' ? 'SHORTEST ROUTE' : activeMode === 'FASTEST' ? 'FASTEST ROUTE' : 'BEST OPTION')}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {activeMode}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
                      Match Score: {bestMatch.score}/100
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {bestMatch.bus?.busNumber}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {bestMatch.route?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-900 dark:text-white block leading-tight">
                        {bestMatch.metrics?.travelTimeMinutes} min
                      </span>
                      <span className="text-xs font-semibold text-sky-700 dark:text-sky-400 font-mono">
                        {bestMatch.metrics?.distanceKm} km road
                      </span>
                    </div>
                  </div>

                  {/* Practical Metric Row */}
                  <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Walking</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{bestMatch.metrics?.walkingMeters} m</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Waiting</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">~{bestMatch.metrics?.etaMinutes} min</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Crowd</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{bestMatch.metrics?.occupancyPercentage}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">On-Time</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{bestMatch.metrics?.reliabilityPercentage}%</span>
                    </div>
                  </div>

                  {/* Microcopy Justification */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {bestMatch.explanation}
                  </p>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCandidateForWhy(bestMatch);
                      }}
                      className="text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium flex items-center gap-1"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Why this route?</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPassBus(bestMatch.bus);
                        setShowPassModal(true);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium border border-transparent dark:border-slate-700"
                    >
                      Get Boarding Pass
                    </button>
                  </div>
                </div>

                {/* Alternative 1 Card */}
                {secondBest && (
                  <div
                    onClick={() => setSelectedCandidate(secondBest)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      activeCandidate?.candidateId === secondBest.candidateId
                        ? 'bg-sky-50/50 dark:bg-sky-950/40 border-sky-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        Alternative 1
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Score: {secondBest.score}/100
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                          {secondBest.bus?.busNumber}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{secondBest.route?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                          {secondBest.metrics?.travelTimeMinutes} min
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono">
                          {secondBest.metrics?.distanceKm} km
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                      <div>Walk: <strong className="text-slate-800 dark:text-slate-200">{secondBest.metrics?.walkingMeters}m</strong></div>
                      <div>Wait: <strong className="text-slate-800 dark:text-slate-200">{secondBest.metrics?.etaMinutes}m</strong></div>
                      <div>Crowd: <strong className="text-slate-800 dark:text-slate-200">{secondBest.metrics?.occupancyPercentage}%</strong></div>
                      <div>Reliable: <strong className="text-slate-800 dark:text-slate-200">{secondBest.metrics?.reliabilityPercentage}%</strong></div>
                    </div>
                  </div>
                )}

                {/* Alternative 2 Card */}
                {thirdBest && (
                  <div
                    onClick={() => setSelectedCandidate(thirdBest)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      activeCandidate?.candidateId === thirdBest.candidateId
                        ? 'bg-sky-50/50 dark:bg-sky-950/40 border-sky-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        Alternative 2
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Score: {thirdBest.score}/100
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                          {thirdBest.bus?.busNumber}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{thirdBest.route?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                          {thirdBest.metrics?.travelTimeMinutes} min
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono">
                          {thirdBest.metrics?.distanceKm} km
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                      <div>Walk: <strong className="text-slate-800 dark:text-slate-200">{thirdBest.metrics?.walkingMeters}m</strong></div>
                      <div>Wait: <strong className="text-slate-800 dark:text-slate-200">{thirdBest.metrics?.etaMinutes}m</strong></div>
                      <div>Crowd: <strong className="text-slate-800 dark:text-slate-200">{thirdBest.metrics?.occupancyPercentage}%</strong></div>
                      <div>Reliable: <strong className="text-slate-800 dark:text-slate-200">{thirdBest.metrics?.reliabilityPercentage}%</strong></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Assistant Prompt Card */}
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  Ask College Bus Assistant
                </span>
                <button
                  onClick={onOpenAI}
                  className="text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-semibold"
                >
                  Open Assistant &rarr;
                </button>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Have specific questions about this journey? The assistant knows your current search, arrival ETA, and crowding levels.
              </p>
            </div>
          </div>

          {/* Right Column: Road-Routing Map */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900 dark:text-white">Road Transit Map</span>
                <span>&bull;</span>
                <span>Real road network via OSRM</span>
              </div>
              {currentSourceStop && currentDestStop && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                  {currentSourceStop.name.split(' (')[0]} &rarr; {currentDestStop.name.split(' (')[0]}
                </span>
              )}
            </div>

            <TransitMap
              buses={buses}
              stops={stops}
              routes={routes}
              selectedBus={nextBus}
              recommendedRoute={activeCandidate}
              alternativeRoutes={
                recommendation
                  ? [secondBest, thirdBest].filter(Boolean)
                  : []
              }
              sourceStop={sourceStopId}
              destinationStop={destinationStopId}
              userLocation={userCoords}
              destinationLocation={
                currentDestStop ? [currentDestStop.latitude, currentDestStop.longitude] : null
              }
              center={
                currentSourceStop
                  ? [currentSourceStop.latitude, currentSourceStop.longitude]
                  : GREATER_NOIDA_CENTER
              }
              zoom={13}
              height="560px"
              onSelectDeparture={(id) => {
                setSourceStopId(id);
                fetchRecommendation(id, destinationStopId, activeMode);
              }}
              onSelectDestination={(id) => {
                setDestinationStopId(id);
                fetchRecommendation(sourceStopId, id, activeMode);
              }}
              onOpenStopBoard={(id, name) => {
                setStopBoardInfo({ id, name });
                setShowStopBoard(true);
              }}
              onLocateUser={handleDetectLocation}
            />
          </div>
        </div>
      </div>

      {/* Modals & Dialogs */}
      <WhyThisRouteModal
        isOpen={Boolean(selectedCandidateForWhy)}
        onClose={() => setSelectedCandidateForWhy(null)}
        candidate={selectedCandidateForWhy}
        activeMode={activeMode}
      />

      <DigitalPassModal
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
        selectedBus={passBus}
        stops={stops}
        initialSourceStopId={sourceStopId}
        initialDestinationStopId={destinationStopId}
      />

      <StopDepartureBoardModal
        isOpen={showStopBoard}
        onClose={() => setShowStopBoard(false)}
        stopId={stopBoardInfo.id}
        stopName={stopBoardInfo.name}
      />

      <ReportIncidentModal
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        routes={routes}
        buses={buses}
      />

      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />
    </div>
  );
}
