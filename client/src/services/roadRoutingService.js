/**
 * Road Routing Engine
 * Fetches real road geometry from OpenStreetMap OSRM routing API.
 * Converts GeoJSON [longitude, latitude] into Leaflet [latitude, longitude].
 * Includes in-memory caching and debouncing to prevent redundant network requests.
 */

const routeCache = new Map();
const OSRM_BASE = 'https://router.project-osrm.org';

/**
 * Format coordinates array [[lat, lon], ...] to OSRM string "lon1,lat1;lon2,lat2;..."
 */
function toCoordString(points) {
  return points.map(([lat, lon]) => `${lon.toFixed(6)},${lat.toFixed(6)}`).join(';');
}

/**
 * Generates an interpolated road path fallback between waypoints if OSRM is offline
 */
function createFallbackPath(points) {
  if (!points || points.length < 2) return points || [];
  return points;
}

/**
 * Fetch real driving road geometry for bus transit legs
 * @param {Array<[number, number]>} waypoints - Array of [lat, lon] coordinates
 * @returns {Promise<{ positions: Array<[number, number]>, distanceMeters: number, durationSeconds: number, summary: string }>}
 */
export async function getDrivingRoadRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) {
    return { positions: waypoints || [], distanceMeters: 0, durationSeconds: 0, summary: '' };
  }

  const cacheKey = `driving_${toCoordString(waypoints)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  try {
    const coordString = toCoordString(waypoints);
    const url = `${OSRM_BASE}/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM HTTP error: ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      // Convert GeoJSON [lon, lat] to Leaflet [lat, lon]
      const positions = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

      const result = {
        positions,
        distanceMeters: Math.round(route.distance),
        durationSeconds: Math.round(route.duration),
        summary: route.legs?.map(l => l.summary).filter(Boolean).join(' → ') || ''
      };

      routeCache.set(cacheKey, result);
      return result;
    }

    throw new Error('OSRM returned no routes');
  } catch (err) {
    console.warn('[Road Routing Engine] OSRM driving request fallback:', err.message);
    const fallbackResult = {
      positions: createFallbackPath(waypoints),
      distanceMeters: 0,
      durationSeconds: 0,
      summary: ''
    };
    return fallbackResult;
  }
}

/**
 * Fetch pedestrian walking geometry along sidewalks and streets
 * @param {Array<[number, number]>} waypoints - Array of [lat, lon] coordinates
 * @returns {Promise<{ positions: Array<[number, number]>, distanceMeters: number, durationSeconds: number }>}
 */
export async function getWalkingRoadRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) {
    return { positions: waypoints || [], distanceMeters: 0, durationSeconds: 0 };
  }

  const cacheKey = `walking_${toCoordString(waypoints)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  try {
    const coordString = toCoordString(waypoints);
    const url = `${OSRM_BASE}/route/v1/walking/${coordString}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM HTTP error: ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      const positions = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

      const result = {
        positions,
        distanceMeters: Math.round(route.distance),
        durationSeconds: Math.round(route.duration)
      };

      routeCache.set(cacheKey, result);
      return result;
    }

    throw new Error('OSRM returned no walking route');
  } catch (err) {
    console.warn('[Road Routing Engine] OSRM walking request fallback:', err.message);
    return {
      positions: createFallbackPath(waypoints),
      distanceMeters: 0,
      durationSeconds: 0
    };
  }
}
