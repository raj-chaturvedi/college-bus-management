const fs = require('fs');
const path = require('path');
const store = require('./store');

let simulationInterval = null;

// Calculate compass heading in degrees from coord 1 to coord 2
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

// Haversine distance in meters
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class BusSimulationEngine {
  constructor() {
    this.busProgress = new Map(); // busId -> { coordIndex, direction, speed }
    this.routeGeometries = new Map(); // routeId -> [[lat, lon], ...]
    this.isRunning = false;
    this.loadGeometries();
  }

  loadGeometries() {
    try {
      const geomPath = path.join(__dirname, '../data/routeRoadGeometries.json');
      if (fs.existsSync(geomPath)) {
        const raw = fs.readFileSync(geomPath, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [routeId, data] of Object.entries(parsed)) {
          if (data && Array.isArray(data.positions) && data.positions.length > 1) {
            this.routeGeometries.set(routeId.toString(), data.positions);
          }
        }
        console.log(`[Simulation] Loaded road geometries for ${this.routeGeometries.size} Greater Noida transit corridors.`);
      }
    } catch (err) {
      console.warn('[Simulation] Notice on loading road geometries cache:', err.message);
    }
  }

  async start(intervalMs = 3000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Simulation] Road-Constrained Live Bus GPS Telemetry Simulator started (Interval: 3s).');

    simulationInterval = setInterval(async () => {
      try {
        await this.step();
      } catch (err) {
        console.error('[Simulation Error]:', err.message);
      }
    }, intervalMs);
  }

  stop() {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
      this.isRunning = false;
      console.log('[Simulation] Live Bus Simulation stopped.');
    }
  }

  async step() {
    const buses = await store.getAllBuses();
    const routes = await store.getAllRoutes();
    const stops = await store.getAllStops();

    if (!buses.length || !routes.length) return;

    for (const bus of buses) {
      if (bus.status === 'maintenance' || bus.status === 'idle') continue;

      const routeId = (bus.route?._id || bus.route || '').toString();
      const route = routes.find(r => r._id.toString() === routeId);

      if (!route || !route.stops || route.stops.length < 2) continue;

      const busId = bus._id.toString();
      let state = this.busProgress.get(busId);

      // Get verified road path for this route
      let roadPath = this.routeGeometries.get(routeId);

      // Fallback: If road path not yet cached in map, build straight-edge segments from stops
      if (!roadPath || roadPath.length < 2) {
        roadPath = [];
        for (const sRef of route.stops) {
          const stId = (sRef.stop?._id || sRef.stop || '').toString();
          const stopObj = stops.find(s => s._id.toString() === stId);
          if (stopObj?.latitude && stopObj?.longitude) {
            roadPath.push([stopObj.latitude, stopObj.longitude]);
          }
        }
      }

      if (!roadPath || roadPath.length < 2) continue;

      if (!state) {
        // Initialize at a sensible spaced position along the route
        const initialIndex = Math.floor(Math.random() * (roadPath.length - 5));
        state = {
          coordIndex: initialIndex,
          direction: Math.random() > 0.4 ? 'outbound' : 'inbound',
          speed: Math.round(26 + Math.random() * 12) // Realistic city bus speed 26-38 km/h
        };
        this.busProgress.set(busId, state);
      }

      // Progress along road geometry by 2-4 coordinate points per 3-second cycle (realistic bus progress ~25m)
      const stepDelta = Math.max(1, Math.min(4, Math.round(state.speed / 10)));

      if (state.direction === 'outbound') {
        state.coordIndex += stepDelta;
        if (state.coordIndex >= roadPath.length - 1) {
          state.coordIndex = roadPath.length - 1;
          state.direction = 'inbound';
          // Slight turnaround delay
          state.speed = Math.round(24 + Math.random() * 8);
        }
      } else {
        state.coordIndex -= stepDelta;
        if (state.coordIndex <= 0) {
          state.coordIndex = 0;
          state.direction = 'outbound';
          state.speed = Math.round(26 + Math.random() * 10);
        }
      }

      const currentCoord = roadPath[state.coordIndex];
      const nextCoord = state.direction === 'outbound'
        ? roadPath[Math.min(roadPath.length - 1, state.coordIndex + 1)]
        : roadPath[Math.max(0, state.coordIndex - 1)];

      const heading = calculateBearing(
        currentCoord[0],
        currentCoord[1],
        nextCoord[0],
        nextCoord[1]
      );

      // Find approaching stop along route
      let nearestStopIdx = 0;
      let minStopDist = Infinity;
      const stopsInRoute = route.stops || [];

      stopsInRoute.forEach((stRef, sIdx) => {
        const sId = (stRef.stop?._id || stRef.stop || '').toString();
        const stObj = stops.find(s => s._id.toString() === sId);
        if (stObj?.latitude && stObj?.longitude) {
          const d = haversineMeters(currentCoord[0], currentCoord[1], stObj.latitude, stObj.longitude);
          if (d < minStopDist) {
            minStopDist = d;
            nearestStopIdx = sIdx;
          }
        }
      });

      // Target the upcoming stop in current travel direction
      let upcomingStopIdx = state.direction === 'outbound'
        ? Math.min(stopsInRoute.length - 1, nearestStopIdx + 1)
        : Math.max(0, nearestStopIdx - 1);

      // If very close to a stop (<60m), simulate realistic passenger board/alight turnover
      if (minStopDist < 60) {
        const delta = Math.floor((Math.random() - 0.45) * 5);
        const newCount = Math.max(6, Math.min(bus.capacity || 50, (bus.currentPassengers || 20) + delta));
        bus.currentPassengers = newCount;
      }

      // Calculate realistic ETA to upcoming stop based on remaining road distance
      const upcomingStopRef = stopsInRoute[upcomingStopIdx]?.stop;
      const upcomingStop = stops.find(s => s._id.toString() === (upcomingStopRef?._id || upcomingStopRef || '').toString());

      let nextEtaMinutes = 4;
      if (upcomingStop?.latitude && upcomingStop?.longitude) {
        const distMeters = haversineMeters(currentCoord[0], currentCoord[1], upcomingStop.latitude, upcomingStop.longitude);
        const speedMps = (state.speed * 1000) / 3600;
        nextEtaMinutes = Math.max(1, Math.round(distMeters / (speedMps * 60)));
      }

      // Add dynamic slight speed variation
      state.speed = Math.max(20, Math.min(45, state.speed + Math.round((Math.random() - 0.5) * 4)));

      // Update bus in store / DB
      await store.updateBus(bus._id, {
        currentLocation: {
          latitude: Number(currentCoord[0].toFixed(6)),
          longitude: Number(currentCoord[1].toFixed(6)),
          heading,
          speed: state.speed,
          isSimulated: true
        },
        currentStopIndex: upcomingStopIdx,
        nextStopEtaMinutes: nextEtaMinutes,
        direction: state.direction,
        currentPassengers: bus.currentPassengers,
        delayMinutes: bus.delayMinutes || 0
      });
    }
  }
}

const simulationEngine = new BusSimulationEngine();

module.exports = simulationEngine;
