import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  Polyline,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plus,
  Minus,
  Crosshair,
  Maximize2,
  RotateCcw,
  Layers,
  MapPin,
  Radio,
  Navigation,
  Compass
} from 'lucide-react';
import {
  getDrivingRoadRoute,
  getWalkingRoadRoute
} from '../../services/roadRoutingService';
import {
  GREATER_NOIDA_CENTER,
  isInGreaterNoidaServiceArea
} from '../../services/geocodingService';
import { useTheme } from '../../context/ThemeContext';
import cachedRouteRoadGeometries from '../../data/routeRoadGeometries.json';

// Fix Leaflet default marker icons for Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Custom Clean Bus Stop Marker
const createStopIcon = (stop, isSource = false, isDest = false) => {
  let bgColor = '#0284c7';
  let badgeText = '🚏';

  if (isSource) {
    bgColor = '#0f766e';
    badgeText = '📍';
  } else if (isDest) {
    bgColor = '#1e3a8a';
    badgeText = '🎓';
  }

  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        background: ${bgColor};
        color: white;
        border: 2px solid #ffffff;
        border-radius: 50%;
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.25);
        cursor: pointer;
      ">
        ${badgeText}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14]
  });
};

// Helper for 8-point compass bearing
const getCompassDirection = (heading) => {
  if (typeof heading !== 'number') return 'N';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((heading % 360) / 45) % 8];
};

// Realistic Top-Down Bus Silhouette Marker with Directional Heading and Crowd Colors
// Designed strictly in the style of navigation and delivery tracking apps (Zomato/Uber style)
// Standalone vehicle silhouette sitting directly on the road polyline (no enclosing circle/card)
const createBusIcon = (bus, isSelected = false) => {
  const hasOcc = typeof bus.occupancyPercentage === 'number' && typeof bus.capacity === 'number';
  const occ = hasOcc ? bus.occupancyPercentage : null;

  // Crowd category mapping per specifications:
  // Green (<50%): Seats Available / Low crowd
  // Amber/Orange (50-80%): Moderate crowd
  // Red (>80%): Crowded / High crowd
  // Neutral Slate: Crowd data unavailable
  let crowdColor = '#10b981'; // Green (Low crowd)
  let crowdAccent = '#34d399';
  let crowdBadge = 'Low';
  if (occ === null) {
    crowdColor = '#64748b'; // Slate (Neutral)
    crowdAccent = '#94a3b8';
    crowdBadge = 'N/A';
  } else if (occ > 80) {
    crowdColor = '#ef4444'; // Red (High crowd)
    crowdAccent = '#f87171';
    crowdBadge = `${occ}%`;
  } else if (occ >= 50) {
    crowdColor = '#f59e0b'; // Amber (Moderate crowd)
    crowdAccent = '#fbbf24';
    crowdBadge = `${occ}%`;
  }

  // Heading bearing in degrees for vehicle alignment (fallback to 0° upright)
  const heading = typeof bus.currentLocation?.heading === 'number' ? Math.round(bus.currentLocation.heading) : 0;
  // Compact bus plate tag (e.g. "B-101" or "101")
  const plateLabel = (bus.busNumber || 'Bus').replace(/Bus\s*/i, '').substring(0, 6);

  const glowStyle = isSelected
    ? `filter: drop-shadow(0 0 8px #0284c7) drop-shadow(0 4px 8px rgba(0,0,0,0.55));`
    : `filter: drop-shadow(0 2px 6px rgba(0,0,0,0.45));`;

  return L.divIcon({
    className: 'realistic-bus-vehicle-marker',
    html: `
      <div style="
        width: 38px;
        height: 60px;
        position: relative;
        cursor: pointer;
        ${glowStyle}
      ">
        <div style="
          width: 38px;
          height: 60px;
          transform: rotate(${heading}deg);
          transform-origin: 19px 30px;
          transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        ">
          <svg width="38" height="60" viewBox="0 0 38 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Front Headlight Beams -->
            <polygon points="7,5 1,0 12,0" fill="#fef08a" opacity="0.35"/>
            <polygon points="31,5 26,0 37,0" fill="#fef08a" opacity="0.35"/>

            <!-- Side Rearview Mirrors (Distinctive Large Bus Ears) -->
            <rect x="0" y="8" width="3.5" height="7" rx="1.5" fill="#0f172a" stroke="#ffffff" stroke-width="0.8"/>
            <rect x="34.5" y="8" width="3.5" height="7" rx="1.5" fill="#0f172a" stroke="#ffffff" stroke-width="0.8"/>

            <!-- Heavy Commercial Bus Body (Long Boxy Transit Coach) -->
            <rect x="3" y="4" width="32" height="52" rx="4" fill="#0f172a" stroke="#ffffff" stroke-width="1.8"/>

            <!-- Main Coach Roof in Dynamic Crowd Color -->
            <rect x="4.5" y="5.5" width="29" height="49" rx="3" fill="${crowdColor}"/>

            <!-- Flat Bus Front Bumper with Destination LED Sign -->
            <rect x="7" y="5.5" width="24" height="4" rx="1" fill="#090d16"/>
            <text x="19" y="8.7" fill="#38bdf8" font-size="3.5" font-weight="900" text-anchor="middle" font-family="monospace">BUS &bull; GNTA</text>

            <!-- Large Panoramic Front Windshield with Center Divider -->
            <rect x="6.5" y="10.5" width="25" height="9" rx="1.5" fill="#0284c7" stroke="#0f172a" stroke-width="1"/>
            <line x1="19" y1="10.5" x2="19" y2="19.5" stroke="#ffffff" stroke-width="0.8"/>

            <!-- Passenger Windows (Series of 5 Long Side Windows on each side) -->
            <rect x="4.8" y="21" width="2" height="4.5" rx="0.5" fill="#0f172a"/>
            <rect x="31.2" y="21" width="2" height="4.5" rx="0.5" fill="#0f172a"/>
            <rect x="4.8" y="27" width="2" height="4.5" rx="0.5" fill="#0f172a"/>
            <rect x="31.2" y="27" width="2" height="4.5" rx="0.5" fill="#0f172a"/>
            <rect x="4.8" y="33" width="2" height="4.5" rx="0.5" fill="#0f172a"/>
            <rect x="31.2" y="33" width="2" height="4.5" rx="0.5" fill="#0f172a"/>
            <rect x="4.8" y="39" width="2" height="4.5" rx="0.5" fill="#0f172a"/>
            <rect x="31.2" y="39" width="2" height="4.5" rx="0.5" fill="#0f172a"/>

            <!-- Large Dual Commercial Roof AC Hatch Units -->
            <rect x="11.5" y="22" width="15" height="8" rx="1.5" fill="#0f172a" stroke="#ffffff" stroke-width="0.8"/>
            <line x1="13.5" y1="24.5" x2="24.5" y2="24.5" stroke="${crowdAccent}" stroke-width="0.8"/>
            <line x1="13.5" y1="27.5" x2="24.5" y2="27.5" stroke="${crowdAccent}" stroke-width="0.8"/>

            <rect x="11.5" y="32" width="15" height="8" rx="1.5" fill="#0f172a" stroke="#ffffff" stroke-width="0.8"/>
            <line x1="13.5" y1="34.5" x2="24.5" y2="34.5" stroke="${crowdAccent}" stroke-width="0.8"/>
            <line x1="13.5" y1="37.5" x2="24.5" y2="37.5" stroke="${crowdAccent}" stroke-width="0.8"/>

            <!-- Rear High-Contrast Bus Number Badge -->
            <rect x="8" y="42" width="22" height="9" rx="2" fill="#0f172a" stroke="#ffffff" stroke-width="1"/>
            <text x="19" y="48.5" fill="#ffffff" font-size="7" font-weight="900" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, monospace">${plateLabel}</text>

            <!-- Dual Headlights (Yellow) -->
            <circle cx="7" cy="5" r="1.5" fill="#fef08a" stroke="#ca8a04" stroke-width="0.5"/>
            <circle cx="31" cy="5" r="1.5" fill="#fef08a" stroke="#ca8a04" stroke-width="0.5"/>

            <!-- Dual Taillights (Red) -->
            <circle cx="7.5" cy="54.5" r="1.4" fill="#dc2626"/>
            <circle cx="30.5" cy="54.5" r="1.4" fill="#dc2626"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [38, 60],
    iconAnchor: [19, 30],
    popupAnchor: [0, -32],
    tooltipAnchor: [0, -32]
  });
};

// Smooth animated bus marker that linearly interpolates position between 3s telemetry ticks
const SmoothBusMarker = ({ bus, isSelected, onClick }) => {
  const targetLat = bus.currentLocation?.latitude;
  const targetLng = bus.currentLocation?.longitude;
  const [currentPos, setCurrentPos] = useState([targetLat, targetLng]);
  const prevPosRef = useRef([targetLat, targetLng]);
  const targetPosRef = useRef([targetLat, targetLng]);
  const animStartTimeRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!targetLat || !targetLng) return;
    const newTarget = [targetLat, targetLng];
    const prev = targetPosRef.current;

    // Skip if position hasn't changed
    if (prev && prev[0] === newTarget[0] && prev[1] === newTarget[1]) return;

    // If large jump (e.g. initial render or route switch > 0.01 deg ~ 1km), snap immediately
    const dist = prev ? Math.hypot(newTarget[0] - prev[0], newTarget[1] - prev[1]) : 0;
    if (dist > 0.01 || !prev || !prev[0]) {
      setCurrentPos(newTarget);
      prevPosRef.current = newTarget;
      targetPosRef.current = newTarget;
      return;
    }

    prevPosRef.current = currentPos;
    targetPosRef.current = newTarget;
    animStartTimeRef.current = performance.now();
    const duration = 2800; // Linear glide across 2.8s of the 3s update tick

    const animate = (now) => {
      const elapsed = now - animStartTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth linear interpolation along road coordinates
      const lat = prevPosRef.current[0] + (targetPosRef.current[0] - prevPosRef.current[0]) * progress;
      const lng = prevPosRef.current[1] + (targetPosRef.current[1] - prevPosRef.current[1]) * progress;
      setCurrentPos([lat, lng]);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetLat, targetLng]);

  const hasOcc = typeof bus.occupancyPercentage === 'number' && typeof bus.capacity === 'number';
  const occ = hasOcc ? bus.occupancyPercentage : null;
  const availableSeats = hasOcc ? Math.max(0, (bus.capacity || 0) - (bus.currentPassengers || 0)) : null;
  let crowdBadgeText = 'Crowd data unavailable';
  if (occ !== null) {
    crowdBadgeText = occ < 50 ? 'Low Crowd (Seats Available)' : occ <= 80 ? 'Moderate Crowd' : 'High Crowd';
  }

  return (
    <Marker
      position={currentPos}
      icon={createBusIcon(bus, isSelected)}
      eventHandlers={{
        click: () => onClick && onClick(bus)
      }}
    >
      <Tooltip direction="top" offset={[0, -26]} opacity={0.95}>
        <div className="font-sans text-[11px] font-bold text-slate-900 flex items-center gap-1.5 py-0.5">
          <span>{bus.busNumber}</span>
          <span>&bull;</span>
          <span className={occ === null ? 'text-slate-500' : occ > 80 ? 'text-red-600' : occ >= 50 ? 'text-amber-600' : 'text-emerald-600'}>
            {crowdBadgeText}
          </span>
          <span>&bull;</span>
          <span className="text-slate-500">{bus.speed || 20} km/h</span>
        </div>
      </Tooltip>
      <Popup>
        <div className="text-xs p-0.5 space-y-1.5 min-w-[210px] text-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm">{bus.busNumber}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  bus.busType === 'government' ? 'bg-blue-100 text-blue-800' :
                  bus.busType === 'private' ? 'bg-purple-100 text-purple-800' :
                  'bg-teal-100 text-[#0F766E]'
                }`}>
                  {bus.busType || 'college'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {bus.operatorName || 'Campus Transit Fleet'} &bull; {bus.fare === 0 || !bus.fare ? 'Free/Subsidized' : `Fare: ₹${bus.fare}`}
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {bus.speed || 20} km/h
            </span>
          </div>
          <div className="text-[11px] space-y-1 text-slate-600">
            <p>Route: <strong className="text-slate-900">{bus.route?.name || 'Greater Noida Corridor'}</strong></p>
            <p>
              Crowd: {hasOcc ? (
                <>
                  <strong className="text-slate-900">{bus.currentPassengers}/{bus.capacity}</strong> ({occ}% &bull; {crowdBadgeText})
                  {availableSeats !== null && (
                    <span className="block text-emerald-600 font-semibold mt-0.5">
                      Available Seats: {availableSeats}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-500 italic">Crowd data unavailable</span>
              )}
            </p>
            <p>
              Next Stop ETA: <strong className="text-sky-700">~{bus.nextStopEtaMinutes ? `${bus.nextStopEtaMinutes} mins` : 'Calculating...'}</strong>
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Plate: {bus.plateNumber || 'UP-16-CB-1012'}
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
              <span className={`px-1.5 py-0.5 rounded font-bold border ${
                bus.currentLocation?.isSimulated
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {bus.currentLocation?.isSimulated ? 'Simulated Road Telemetry' : 'Live Physical GPS'}
              </span>
              <span className="text-slate-500 font-mono font-semibold">
                {bus.currentLocation?.heading ?? 0}° {getCompassDirection(bus.currentLocation?.heading)}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

// User Location Marker
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="
        background: #0284c7;
        border: 3px solid #ffffff;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.35);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12]
  });
};

/**
 * Controller to capture Leaflet map instance and handle route-fitting ONCE
 * Preserves user manual zoom stability against background telemetry re-renders
 */
function MapLifecycleController({
  activeBounds,
  routeKey,
  onMapReady
}) {
  const map = useMap();
  const lastFittedRouteKey = useRef(null);
  const initialMountDone = useRef(false);

  // Expose map instance to parent controls
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // Handle container resizing and navigation tab restores
  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 150);

    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch {}
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  // Only fit route when routeKey changes (new route selected) - NEVER on bus/timer/occupancy updates
  useEffect(() => {
    if (routeKey && routeKey !== lastFittedRouteKey.current) {
      if (activeBounds && activeBounds.length >= 2) {
        try {
          const leafletBounds = L.latLngBounds(activeBounds);
          if (leafletBounds.isValid()) {
            map.fitBounds(leafletBounds, { padding: [50, 50], maxZoom: 15 });
            lastFittedRouteKey.current = routeKey;
          }
        } catch (e) {
          console.warn('Notice on fitting route bounds:', e);
        }
      }
    } else if (!routeKey && !initialMountDone.current) {
      // First mount default view
      initialMountDone.current = true;
      map.setView(GREATER_NOIDA_CENTER, 12);
    }
  }, [routeKey, activeBounds, map]);

  return null;
}

export default function TransitMap({
  buses = [],
  stops = [],
  routes = [],
  selectedBus = null,
  recommendedRoute = null,
  alternativeRoutes = [],
  sourceStop = null,
  destinationStop = null,
  userLocation = null,
  destinationLocation = null,
  center = GREATER_NOIDA_CENTER,
  zoom = 12,
  height = '520px',
  onSelectDeparture = null,
  onSelectDestination = null,
  onOpenStopBoard = null,
  onLocateUser = null
}) {
  const { isDark } = useTheme();
  // OpenStreetMap standard is the permanent default layer showing all Greater Noida roads, sectors, and stops clearly
  const [activeTileLayer, setActiveTileLayer] = useState('osm');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  // Road geometry states
  const [roadBusPath, setRoadBusPath] = useState([]);
  const [walkingStartPath, setWalkingStartPath] = useState([]);
  const [walkingEndPath, setWalkingEndPath] = useState([]);
  const [alternativeRoadPaths, setAlternativeRoadPaths] = useState([]);
  const [isLoadingRoads, setIsLoadingRoads] = useState(false);
  const [activeBounds, setActiveBounds] = useState(null);

  // Available clean map tile providers
  const TILE_PROVIDERS = {
    osm: {
      name: 'OpenStreetMap Standard (Default)',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    },
    cartoLight: {
      name: 'Clean Transit (Positron)',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO &copy; OpenStreetMap'
    },
    cartoVoyager: {
      name: 'Detailed Roads (Voyager)',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO &copy; OpenStreetMap'
    }
  };

  // Determine source & destination stop objects
  const sourceStopObj = stops.find(
    (s) => (s._id || s.id)?.toString() === (sourceStop?._id || sourceStop)?.toString()
  );
  const destStopObj = stops.find(
    (s) => (s._id || s.id)?.toString() === (destinationStop?._id || destinationStop)?.toString()
  );

  // Unique route identity key: only changes when user selects a different route or changes stops
  const currentRouteKey = recommendedRoute
    ? (recommendedRoute.candidateId || recommendedRoute._id || `${sourceStopObj?._id}_${destStopObj?._id}`)
    : (sourceStopObj && destStopObj ? `${sourceStopObj._id}_${destStopObj._id}` : null);

  // Fetch real road geometry whenever recommendedRoute or stops change
  useEffect(() => {
    let isCancelled = false;

    async function computeRealRoadGeometry() {
      setIsLoadingRoads(true);
      const allCollectedPoints = [];

      // 1. Calculate Bus Road Geometry
      if (recommendedRoute && recommendedRoute.legs && recommendedRoute.legs.length > 0) {
        try {
          const waypoints = [];

          recommendedRoute.legs.forEach((leg) => {
            (leg.stopsList || []).forEach((st) => {
              const stopObj = stops.find(
                (s) => (s._id || s.id)?.toString() === (st.stop?._id || st.stop || '')?.toString()
              );
              if (stopObj && typeof stopObj.latitude === 'number' && typeof stopObj.longitude === 'number') {
                waypoints.push([stopObj.latitude, stopObj.longitude]);
              }
            });
          });

          // Fallback if stopsList was not provided
          if (waypoints.length < 2 && sourceStopObj && destStopObj) {
            waypoints.push([sourceStopObj.latitude, sourceStopObj.longitude]);
            waypoints.push([destStopObj.latitude, destStopObj.longitude]);
          }

          if (waypoints.length >= 2) {
            const roadResult = await getDrivingRoadRoute(waypoints);
            if (!isCancelled) {
              setRoadBusPath(roadResult.positions);
              allCollectedPoints.push(...roadResult.positions);
            }
          } else {
            setRoadBusPath([]);
          }
        } catch (err) {
          console.warn('Road routing error:', err);
          setRoadBusPath([]);
        }
      } else if (sourceStopObj && destStopObj) {
        // Direct stop-to-stop search road geometry
        try {
          const roadResult = await getDrivingRoadRoute([
            [sourceStopObj.latitude, sourceStopObj.longitude],
            [destStopObj.latitude, destStopObj.longitude]
          ]);
          if (!isCancelled) {
            setRoadBusPath(roadResult.positions);
            allCollectedPoints.push(...roadResult.positions);
          }
        } catch {
          setRoadBusPath([]);
        }
      } else if (selectedBus) {
        // Road geometry for selected bus corridor
        const busRouteId = (selectedBus.route?._id || selectedBus.route)?.toString();
        const cachedPath = cachedRouteRoadGeometries[busRouteId]?.positions || [];
        if (cachedPath.length >= 2) {
          setRoadBusPath(cachedPath);
          allCollectedPoints.push(...cachedPath);
        } else {
          setRoadBusPath([]);
        }
      } else {
        setRoadBusPath([]);
      }

      // 2. Calculate Walking Route to Boarding Stop
      if (userLocation && sourceStopObj) {
        const distFromStop = Math.hypot(
          userLocation[0] - sourceStopObj.latitude,
          userLocation[1] - sourceStopObj.longitude
        ) * 111000;

        if (distFromStop > 30) {
          try {
            const walkRes = await getWalkingRoadRoute([
              userLocation,
              [sourceStopObj.latitude, sourceStopObj.longitude]
            ]);
            if (!isCancelled) {
              setWalkingStartPath(walkRes.positions);
              allCollectedPoints.push(...walkRes.positions);
            }
          } catch {
            setWalkingStartPath([userLocation, [sourceStopObj.latitude, sourceStopObj.longitude]]);
          }
        } else {
          setWalkingStartPath([]);
        }
      } else {
        setWalkingStartPath([]);
      }

      // 3. Calculate Walking Route from Destination Stop to Destination
      if (destinationLocation && destStopObj) {
        const distFromDest = Math.hypot(
          destinationLocation[0] - destStopObj.latitude,
          destinationLocation[1] - destStopObj.longitude
        ) * 111000;

        if (distFromDest > 30) {
          try {
            const walkRes = await getWalkingRoadRoute([
              [destStopObj.latitude, destStopObj.longitude],
              destinationLocation
            ]);
            if (!isCancelled) {
              setWalkingEndPath(walkRes.positions);
              allCollectedPoints.push(...walkRes.positions);
            }
          } catch {
            setWalkingEndPath([[destStopObj.latitude, destStopObj.longitude], destinationLocation]);
          }
        } else {
          setWalkingEndPath([]);
        }
      } else {
        setWalkingEndPath([]);
      }

      // 4. Calculate Alternative routes road geometry if available
      if (alternativeRoutes && alternativeRoutes.length > 0) {
        const altPaths = [];
        for (const alt of alternativeRoutes.slice(0, 2)) {
          const altWaypoints = [];
          (alt.legs || []).forEach((leg) => {
            (leg.stopsList || []).forEach((st) => {
              const stopObj = stops.find(
                (s) => (s._id || s.id)?.toString() === (st.stop?._id || st.stop || '')?.toString()
              );
              if (stopObj) altWaypoints.push([stopObj.latitude, stopObj.longitude]);
            });
          });
          if (altWaypoints.length >= 2) {
            try {
              const res = await getDrivingRoadRoute(altWaypoints);
              altPaths.push({ id: alt.candidateId, positions: res.positions });
            } catch {}
          }
        }
        if (!isCancelled) setAlternativeRoadPaths(altPaths);
      } else {
        setAlternativeRoadPaths([]);
      }

      // 5. Update map zoom bounds state
      if (!isCancelled) {
        setIsLoadingRoads(false);
        if (allCollectedPoints.length >= 2) {
          setActiveBounds(allCollectedPoints);
        } else if (sourceStopObj && destStopObj) {
          setActiveBounds([
            [sourceStopObj.latitude, sourceStopObj.longitude],
            [destStopObj.latitude, destStopObj.longitude]
          ]);
        } else {
          setActiveBounds(null);
        }
      }
    }

    computeRealRoadGeometry();

    return () => {
      isCancelled = true;
    };
  }, [
    recommendedRoute,
    sourceStop,
    destinationStop,
    userLocation,
    destinationLocation,
    stops,
    alternativeRoutes,
    selectedBus?.route?._id || selectedBus?.route || selectedBus?._id || selectedBus?.id
  ]);

  // Center / pan map on selected bus when changed
  useEffect(() => {
    if (mapInstance && selectedBus?.currentLocation?.latitude && selectedBus?.currentLocation?.longitude) {
      try {
        mapInstance.flyTo(
          [selectedBus.currentLocation.latitude, selectedBus.currentLocation.longitude],
          Math.max(mapInstance.getZoom(), 13),
          { animate: true, duration: 0.8 }
        );
      } catch (err) {
        console.warn('Error focusing selected bus:', err);
      }
    }
  }, [selectedBus?.id, selectedBus?._id, mapInstance]);

  // Explicit User Control Handlers (Honors manual zoom stability)
  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.zoomOut();
    }
  };

  const handleFitRoute = () => {
    if (mapInstance && activeBounds && activeBounds.length >= 2) {
      try {
        const bounds = L.latLngBounds(activeBounds);
        if (bounds.isValid()) {
          mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      } catch (err) {
        console.warn('Error fitting bounds:', err);
      }
    }
  };

  const handleResetView = () => {
    if (mapInstance) {
      mapInstance.setView(GREATER_NOIDA_CENTER, 12);
    }
  };

  const handleLocateUserClick = () => {
    if (userLocation && mapInstance) {
      mapInstance.setView(userLocation, 15);
    } else if (onLocateUser) {
      onLocateUser();
    }
  };

  const activeTile = TILE_PROVIDERS[activeTileLayer] || TILE_PROVIDERS.osm;

  return (
    <div
      style={{ height }}
      className="w-full rounded-xl overflow-hidden border border-slate-200 bg-white shadow-subtle relative z-10 isolate"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false} // Disable Leaflet default so our custom, accessible zoom buttons have exclusive control
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <MapLifecycleController
          activeBounds={activeBounds}
          routeKey={currentRouteKey}
          onMapReady={setMapInstance}
        />

        {/* Base Tile Layer */}
        <TileLayer
          key={activeTileLayer}
          attribution={activeTile.attribution}
          url={activeTile.url}
          maxZoom={19}
        />

        {/* Alternative Routes (Dashed road lines) */}
        {alternativeRoadPaths.map((alt) => (
          <Polyline
            key={`alt_${alt.id}`}
            positions={alt.positions}
            pathOptions={{
              color: '#94a3b8',
              weight: 4,
              opacity: 0.7,
              dashArray: '6, 6'
            }}
          />
        ))}

        {/* Network Corridor Road Lines (Subtle road network shown when no specific bus or search route is active) */}
        {roadBusPath.length === 0 && !recommendedRoute && Object.entries(cachedRouteRoadGeometries).map(([rId, data]) => {
          if (!data?.positions || data.positions.length < 2) return null;
          return (
            <Polyline
              key={`net_corridor_${rId}`}
              positions={data.positions}
              pathOptions={{
                color: '#0284c7',
                weight: 2.5,
                opacity: 0.35,
                dashArray: '4, 6'
              }}
            />
          );
        })}

        {/* Recommended Main Bus Route (Following real roads via OSRM) */}
        {roadBusPath.length > 0 && (
          <>
            {/* Outer road highlight casing */}
            <Polyline
              positions={roadBusPath}
              pathOptions={{
                color: '#0369a1',
                weight: 7,
                opacity: 0.35
              }}
            />
            {/* Inner vibrant transit road line */}
            <Polyline
              positions={roadBusPath}
              pathOptions={{
                color: '#0284c7',
                weight: 4.5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}

        {/* Walking Route 1: From user location to boarding stop */}
        {walkingStartPath.length > 0 && (
          <Polyline
            positions={walkingStartPath}
            pathOptions={{
              color: '#0f766e',
              weight: 3.5,
              opacity: 0.9,
              dashArray: '5, 8'
            }}
          />
        )}

        {/* Walking Route 2: From drop-off stop to destination */}
        {walkingEndPath.length > 0 && (
          <Polyline
            positions={walkingEndPath}
            pathOptions={{
              color: '#1e3a8a',
              weight: 3.5,
              opacity: 0.9,
              dashArray: '5, 8'
            }}
          />
        )}

        {/* All Greater Noida Bus Stops */}
        {stops.map((stop) => {
          const isSource =
            sourceStopObj && (sourceStopObj._id || sourceStopObj.id) === (stop._id || stop.id);
          const isDest =
            destStopObj && (destStopObj._id || destStopObj.id) === (stop._id || stop.id);

          return (
            <Marker
              key={stop._id || stop.id}
              position={[stop.latitude, stop.longitude]}
              icon={createStopIcon(stop, isSource, isDest)}
            >
              <Popup>
                <div className="text-xs space-y-2 p-0.5 min-w-[210px] text-slate-800">
                  <div className="border-b border-slate-100 pb-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 text-sm">{stop.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-mono font-bold">
                        {stop.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{stop.zone}</p>
                  </div>

                  <div className="pt-1 space-y-1.5">
                    {onOpenStopBoard && (
                      <button
                        onClick={() => onOpenStopBoard(stop._id || stop.id, stop.name)}
                        className="w-full py-1 px-2 rounded bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-semibold text-[11px] flex items-center justify-center gap-1.5"
                      >
                        <Radio className="h-3 w-3 text-sky-600" />
                        <span>Live Departures Board</span>
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-1.5">
                      {onSelectDeparture && (
                        <button
                          onClick={() => onSelectDeparture(stop._id || stop.id)}
                          className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium text-center"
                        >
                          Set Departure
                        </button>
                      )}
                      {onSelectDestination && (
                        <button
                          onClick={() => onSelectDestination(stop._id || stop.id)}
                          className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium text-center"
                        >
                          Set Destination
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Live Active Buses with Smooth Road Linear Interpolation */}
        {buses.map((bus) => {
          if (!bus.currentLocation?.latitude || !bus.currentLocation?.longitude) return null;
          const busIdStr = (bus._id || bus.id)?.toString();
          const selectedBusIdStr = (selectedBus?._id || selectedBus?.id)?.toString();
          const isSelected = !!selectedBus && (
            (selectedBusIdStr && selectedBusIdStr === busIdStr) ||
            (selectedBus.busNumber && selectedBus.busNumber === bus.busNumber)
          );

          return (
            <SmoothBusMarker
              key={bus.id || bus._id}
              bus={bus}
              isSelected={isSelected}
              onClick={(b) => setSelectedBus && setSelectedBus(b)}
            />
          );
        })}

        {/* User GPS Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={createUserLocationIcon()}>
            <Popup>
              <div className="text-xs p-1 text-slate-800">
                <span className="font-bold text-sky-800 block">Your Current Location</span>
                <span className="text-[11px] text-slate-600">
                  {userLocation[0].toFixed(4)}°N, {userLocation[1].toFixed(4)}°E
                </span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* STABLE MAP CONTROLS OVERLAY (Zoom In +, Zoom Out -, My Location, Fit Route, Reset View) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
        {/* Zoom In & Out Cluster */}
        <div className="flex flex-col rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition"
            title="Zoom In (+)"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition"
            title="Zoom Out (-)"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Functional Control Pill Buttons */}
        <div className="flex flex-col gap-1.5 items-end">
          {/* My Location */}
          <button
            type="button"
            onClick={handleLocateUserClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-md transition"
            title="Center on My Location"
          >
            <Crosshair className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">My Location</span>
          </button>

          {/* Fit Route */}
          {activeBounds && activeBounds.length >= 2 && (
            <button
              type="button"
              onClick={handleFitRoute}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/80 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 text-xs font-semibold text-sky-800 dark:text-sky-300 shadow-md transition"
              title="Fit map view to route bounds"
            >
              <Maximize2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Fit Route</span>
            </button>
          )}

          {/* Reset View */}
          <button
            type="button"
            onClick={handleResetView}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-md transition"
            title="Reset to Greater Noida Center"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Reset View</span>
          </button>

          {/* Map Layer Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-md transition"
              title="Change Map Style"
            >
              <Layers className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Style</span>
            </button>

            {showLayerMenu && (
              <div className="absolute right-0 mt-1 w-44 rounded-lg bg-white border border-slate-200 shadow-lg p-1 space-y-0.5 z-30">
                {Object.entries(TILE_PROVIDERS).map(([key, provider]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveTileLayer(key);
                      setShowLayerMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                      activeTileLayer === key
                        ? 'bg-sky-50 text-sky-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {provider.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Status Indicator for OSRM Road Computation */}
      {isLoadingRoads && (
        <div className="absolute top-3 left-3 z-20 bg-white/95 border border-sky-200 px-3 py-1.5 rounded-md text-[11px] font-medium text-sky-800 shadow-sm flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-600 animate-pulse"></span>
          <span>Computing road geometry via OSRM...</span>
        </div>
      )}

      {/* Clean Compact Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-[11px] space-y-1.5 shadow-sm hidden sm:block text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-4 bg-sky-600 rounded"></div>
          <span>Active Road Route (OSRM)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-4 border-t-2 border-dashed border-teal-700"></div>
          <span>Walking Segment</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">&lt;50% Low</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">50-80% Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">&gt;80% High</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500"></span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">N/A</span>
          </div>
        </div>
      </div>
    </div>
  );
}
