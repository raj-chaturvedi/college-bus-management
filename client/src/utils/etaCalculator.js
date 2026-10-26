/**
 * ETA & Journey Arrival Calculator
 * Computes road-constrained arrival estimates using live telemetry,
 * remaining road distance, bus speed, intermediate stop dwell times, and delay records.
 */

// Haversine formula to compute distance in kilometers
export function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    return 0;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates dynamic bus arrival information for a specific boarding stop and destination.
 *
 * @param {Object} bus - Bus object with currentLocation, speed, delayMinutes, route
 * @param {Object} sourceStop - Boarding stop object { _id, name, latitude, longitude }
 * @param {Object} destStop - Destination stop object { _id, name, latitude, longitude }
 * @param {Object} route - Full route object with stops list
 * @param {Boolean} isDirectCandidate - Whether a valid route connection was found
 * @returns {Object} Arrival state and formatted user-friendly text
 */
export function calculateBusArrivalInfo(bus, sourceStop, destStop, route = null, isDirectCandidate = true) {
  // 1. Check if direct transit serves this destination
  if (!isDirectCandidate || !sourceStop || !destStop) {
    return {
      isAvailable: false,
      status: 'NO_DIRECT_BUS',
      headline: 'No direct bus available',
      badge: 'NO DIRECT ROUTE',
      badgeClass: 'bg-rose-950 border-rose-800 text-rose-400',
      subtext: 'No single-bus corridor directly connects these stops. Try selecting an interchange hub like Pari Chowk.',
      etaMinutes: null,
      delayMinutes: 0
    };
  }

  // 2. Check if bus has valid GPS telemetry
  if (!bus || !bus.currentLocation || typeof bus.currentLocation.latitude !== 'number' || typeof bus.currentLocation.longitude !== 'number') {
    return {
      isAvailable: false,
      status: 'UNAVAILABLE',
      headline: 'ETA unavailable',
      badge: 'GPS OFFLINE',
      badgeClass: 'bg-slate-800 border-slate-700 text-slate-400',
      subtext: 'Live bus telemetry or GPS coordinates currently offline.',
      etaMinutes: null,
      delayMinutes: 0
    };
  }

  const busLat = bus.currentLocation.latitude;
  const busLon = bus.currentLocation.longitude;
  const stopLat = sourceStop.latitude;
  const stopLon = sourceStop.longitude;

  // 3. Compute road distance to boarding stop
  // Greater Noida road curvature network multiplier ~ 1.25x straight-line distance
  const directDistKm = calculateHaversineKm(busLat, busLon, stopLat, stopLon);
  const roadDistKm = directDistKm * 1.25;

  // 4. Count intermediate stops between bus and boarding stop
  let intermediateStopsCount = 0;
  if (route && Array.isArray(route.stops) && route.stops.length > 0) {
    const srcId = (sourceStop._id || sourceStop.id)?.toString();
    const srcIdx = route.stops.findIndex(st => (st.stop?._id || st.stop)?.toString() === srcId);
    const busStopIdx = bus.currentStopIndex || 0;

    if (srcIdx > busStopIdx) {
      intermediateStopsCount = srcIdx - busStopIdx;
    }
  }

  // 5. Operating speed and delay
  // Realistic campus transit travel speed in Greater Noida: 28-36 km/h
  const speedKmH = Math.max(18, Math.min(55, bus.currentLocation.speed || bus.speed || 30));
  const delayMinutes = Number(bus.delayMinutes) || 0;

  // Travel time in minutes = (distance / speed) * 60 + dwell time (1.2m per intermediate stop) + delay
  const travelMinutes = (roadDistKm / speedKmH) * 60;
  const dwellMinutes = intermediateStopsCount * 1.2;
  const rawEta = travelMinutes + dwellMinutes + delayMinutes;
  const etaMinutes = Math.max(1, Math.round(rawEta));

  // 6. User-Friendly Formatted Output
  // "Arriving now" if bus is closer than 120 meters or under 1 minute away
  if (directDistKm < 0.12 || (rawEta <= 1.2 && delayMinutes <= 0)) {
    return {
      isAvailable: true,
      status: 'ARRIVING_NOW',
      headline: 'Arriving now',
      badge: 'ARRIVING NOW',
      badgeClass: 'bg-emerald-950 border-emerald-800 text-emerald-400',
      subtext: `at ${sourceStop.name}`,
      etaMinutes: 1,
      delayMinutes,
      distanceKm: roadDistKm.toFixed(1)
    };
  }

  // "Delayed — approximately X min" if delay exceeds 2 minutes
  if (delayMinutes >= 3) {
    return {
      isAvailable: true,
      status: 'DELAYED',
      headline: `Delayed — approximately ${etaMinutes} min`,
      badge: `DELAYED +${delayMinutes}m`,
      badgeClass: 'bg-amber-950 border-amber-800 text-amber-400',
      subtext: `at ${sourceStop.name}`,
      etaMinutes,
      delayMinutes,
      distanceKm: roadDistKm.toFixed(1)
    };
  }

  // Standard on-time arrival: "Arriving in X min"
  return {
    isAvailable: true,
    status: 'ON_TIME',
    headline: `Arriving in ${etaMinutes} min`,
    badge: 'ON TIME',
    badgeClass: 'bg-sky-950 border-sky-800 text-sky-400',
    subtext: `at ${sourceStop.name}`,
    etaMinutes,
    delayMinutes: 0,
    distanceKm: roadDistKm.toFixed(1)
  };
}
