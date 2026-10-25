/**
 * Geolocation & Geocoding Service
 * Dedicated to GREATER NOIDA, Uttar Pradesh, India.
 * Validates service area boundaries and eliminates hardcoded fallbacks to other cities.
 */

export const GREATER_NOIDA_CENTER = [28.4744, 77.5040]; // Pari Chowk / Knowledge Park junction
export const GREATER_NOIDA_BOUNDS = {
  minLat: 28.3000,
  maxLat: 28.6600,
  minLon: 77.3000,
  maxLon: 77.6500
};

export const POPULAR_GREATER_NOIDA_DESTINATIONS = [
  {
    id: 'dest_glbajaj',
    name: 'GL Bajaj Institute of Technology & Management',
    zone: 'Knowledge Park III',
    coords: [28.4727, 77.4890],
    isCollege: true
  },
  {
    id: 'dest_sec62',
    name: 'Greater Noida Sector 62 Link',
    zone: 'Sector 62 Corridor',
    coords: [28.6255, 77.3725],
    isCollege: false
  },
  {
    id: 'dest_parichowk',
    name: 'Pari Chowk Central Interchange',
    zone: 'Pari Chowk',
    coords: [28.4682, 77.5098],
    isCollege: false
  },
  {
    id: 'dest_kp2_metro',
    name: 'Knowledge Park II (KP-2 Metro Station)',
    zone: 'Knowledge Park II',
    coords: [28.4615, 77.4985],
    isCollege: false
  },
  {
    id: 'dest_gbu',
    name: 'Gautam Buddha University (GBU Main Gate)',
    zone: 'GBU Campus',
    coords: [28.4215, 77.5270],
    isCollege: true
  },
  {
    id: 'dest_bennett',
    name: 'Bennett University (Tech Zone 2)',
    zone: 'Tech Zone Corridor',
    coords: [28.4510, 77.5835],
    isCollege: true
  },
  {
    id: 'dest_gaur_city',
    name: 'Gaur City / Greater Noida West',
    zone: 'Greater Noida West',
    coords: [28.5980, 77.4280],
    isCollege: false
  },
  {
    id: 'dest_alpha1',
    name: 'Alpha 1 Commercial & Metro',
    zone: 'Alpha Sector',
    coords: [28.4760, 77.5110],
    isCollege: false
  },
  {
    id: 'dest_delta1',
    name: 'Delta 1 Metro Station (Aqua Line)',
    zone: 'Delta Sector',
    coords: [28.4975, 77.5180],
    isCollege: false
  },
  {
    id: 'dest_expomart',
    name: 'India Expo Mart & Convention Centre',
    zone: 'Expo Mart Corridor',
    coords: [28.4600, 77.5030],
    isCollege: false
  }
];

/**
 * Checks whether coordinates lie within the Greater Noida transit zone
 */
export function isInGreaterNoidaServiceArea(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  return (
    lat >= GREATER_NOIDA_BOUNDS.minLat &&
    lat <= GREATER_NOIDA_BOUNDS.maxLat &&
    lon >= GREATER_NOIDA_BOUNDS.minLon &&
    lon <= GREATER_NOIDA_BOUNDS.maxLon
  );
}

/**
 * High-accuracy device geolocation with OpenStreetMap reverse-geocoding
 */
export async function detectCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'UNSUPPORTED',
        message: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const inServiceArea = isInGreaterNoidaServiceArea(latitude, longitude);

        let address = '';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              const parts = data.display_name.split(',');
              address = parts.slice(0, 3).join(', ').trim();
            }
          }
        } catch {
          address = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
        }

        resolve({
          success: true,
          coords: [latitude, longitude],
          accuracy: Math.round(accuracy),
          address: address || 'Current Location',
          inServiceArea,
          rawLatitude: latitude,
          rawLongitude: longitude
        });
      },
      (err) => {
        let message = 'Location access unavailable.';
        if (err.code === 1) message = 'Location permission was denied.';
        else if (err.code === 2) message = 'Location could not be determined.';
        else if (err.code === 3) message = 'Location request timed out.';

        resolve({
          success: false,
          error: err.code === 1 ? 'PERMISSION_DENIED' : 'UNAVAILABLE',
          message,
          coords: null
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 15000
      }
    );
  });
}

/**
 * Reverse geocode a latitude and longitude to a human address
 */
export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const data = await res.json();
    if (data.display_name) {
      const parts = data.display_name.split(',');
      return parts.slice(0, 3).join(', ').trim();
    }
  } catch {}
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

/**
 * Forward geocode a search string within Greater Noida
 */
export async function searchGreaterNoidaPlaces(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const sanitizedQuery = encodeURIComponent(`${query.trim()}, Greater Noida`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${sanitizedQuery}&limit=5`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return [];
    const list = await res.json();
    return list.map(item => ({
      name: item.display_name.split(',').slice(0, 2).join(', '),
      fullName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon)
    }));
  } catch {
    return [];
  }
}
