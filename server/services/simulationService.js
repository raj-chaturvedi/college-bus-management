const store = require('./store');

let simulationInterval = null;

// Interpolate between two coordinates
function interpolate(p1, p2, fraction) {
  return {
    latitude: p1.latitude + (p2.latitude - p1.latitude) * fraction,
    longitude: p1.longitude + (p2.longitude - p1.longitude) * fraction
  };
}

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

class BusSimulationEngine {
  constructor() {
    this.busProgress = new Map(); // busId -> { currentStopIdx, fraction, direction }
    this.isRunning = false;
  }

  async start(intervalMs = 3000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Simulation] Live Bus GPS Telemetry Simulator started (Interval: 3s).');

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

      if (!state) {
        state = {
          stopIdx: Math.floor(Math.random() * (route.stops.length - 1)),
          fraction: Math.random() * 0.8,
          direction: 'outbound'
        };
        this.busProgress.set(busId, state);
      }

      // Advance fraction
      state.fraction += 0.08; // smooth step advance

      if (state.fraction >= 1.0) {
        state.fraction = 0;
        if (state.direction === 'outbound') {
          state.stopIdx++;
          if (state.stopIdx >= route.stops.length - 1) {
            state.direction = 'inbound';
          }
        } else {
          state.stopIdx--;
          if (state.stopIdx <= 0) {
            state.direction = 'outbound';
          }
        }

        // Passenger turnover at stops
        const passengerShift = Math.floor((Math.random() - 0.45) * 6);
        const newCount = Math.max(8, Math.min(bus.capacity, (bus.currentPassengers || 25) + passengerShift));
        bus.currentPassengers = newCount;
      }

      // Get stops for current leg
      const stopsInRoute = route.stops;
      let fromIdx = state.stopIdx;
      let toIdx = state.direction === 'outbound' ? state.stopIdx + 1 : state.stopIdx - 1;

      if (toIdx < 0) toIdx = 1;
      if (toIdx >= stopsInRoute.length) toIdx = stopsInRoute.length - 2;

      const fromStopRef = stopsInRoute[fromIdx]?.stop;
      const toStopRef = stopsInRoute[toIdx]?.stop;

      const fromStop = stops.find(s => s._id.toString() === (fromStopRef?._id || fromStopRef || '').toString());
      const toStop = stops.find(s => s._id.toString() === (toStopRef?._id || toStopRef || '').toString());

      if (fromStop && toStop) {
        const nextLoc = interpolate(
          { latitude: fromStop.latitude, longitude: fromStop.longitude },
          { latitude: toStop.latitude, longitude: toStop.longitude },
          state.fraction
        );

        const heading = calculateBearing(
          fromStop.latitude,
          fromStop.longitude,
          toStop.latitude,
          toStop.longitude
        );

        const eta = Math.max(1, Math.round((1 - state.fraction) * 6));

        // Update bus
        await store.updateBus(bus._id, {
          currentLocation: {
            latitude: Number(nextLoc.latitude.toFixed(6)),
            longitude: Number(nextLoc.longitude.toFixed(6)),
            heading,
            speed: Math.round(28 + Math.random() * 12)
          },
          currentStopIndex: fromIdx,
          nextStopEtaMinutes: eta,
          direction: state.direction,
          currentPassengers: bus.currentPassengers
        });
      }
    }
  }
}

const simulationEngine = new BusSimulationEngine();

module.exports = simulationEngine;
