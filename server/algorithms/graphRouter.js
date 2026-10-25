/**
 * Graph-based route calculation, Dijkstra/multi-path search, and multi-criteria scoring
 */

// Haversine formula to compute great-circle distance between two GPS coordinates in meters
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // meters
}

class TransitGraph {
  constructor(stops, routes) {
    this.stops = stops;
    this.routes = routes;
    this.adjacencyList = new Map();
    this.stopsMap = new Map();
    for (const stop of this.stops) {
      const stopId = (stop._id || stop.id).toString();
      this.stopsMap.set(stopId, stop);
      if (stop.code) this.stopsMap.set(stop.code.toUpperCase(), stop);
    }
    this.buildGraph();
  }

  // Calculate actual road distance (km) between an array of stops
  computeRoadDistanceKm(stopsList, fallbackRatio = 1) {
    if (!stopsList || stopsList.length < 2) return 1.5;
    let totalMeters = 0;
    for (let i = 0; i < stopsList.length - 1; i++) {
      const uId = (stopsList[i].stop?._id || stopsList[i].stop || '').toString();
      const vId = (stopsList[i + 1].stop?._id || stopsList[i + 1].stop || '').toString();
      const u = this.stopsMap.get(uId);
      const v = this.stopsMap.get(vId);

      if (u?.latitude && u?.longitude && v?.latitude && v?.longitude) {
        // Greater Noida road network factor: ~1.28x road distance over straight-line
        totalMeters += getHaversineDistance(u.latitude, u.longitude, v.latitude, v.longitude) * 1.28;
      } else {
        totalMeters += 2200; // Average 2.2 km per stop in Greater Noida
      }
    }
    return Math.round((totalMeters / 1000) * 10) / 10;
  }

  buildGraph() {
    // Initialize node buckets for all stops
    for (const stop of this.stops) {
      const stopId = (stop._id || stop.id).toString();
      this.adjacencyList.set(stopId, []);
    }

    // Add transit edges along route stops
    for (const route of this.routes) {
      const stops = route.stops || [];
      for (let i = 0; i < stops.length - 1; i++) {
        const uStop = stops[i].stop?._id ? stops[i].stop._id.toString() : stops[i].stop.toString();
        const vStop = stops[i + 1].stop?._id ? stops[i + 1].stop._id.toString() : stops[i + 1].stop.toString();

        const timeDiff = Math.max(3, (stops[i + 1].scheduledMinutesFromStart || 0) - (stops[i].scheduledMinutesFromStart || 0));

        if (this.adjacencyList.has(uStop)) {
          this.adjacencyList.get(uStop).push({
            to: vStop,
            type: 'bus',
            routeId: (route._id || route.id).toString(),
            routeName: route.name,
            routeCode: route.code,
            routeColor: route.color || '#0c87eb',
            durationMinutes: timeDiff,
            distanceKm: route.distance ? route.distance / stops.length : 2
          });
        }
      }
    }
  }

  // Find candidate paths between source stop and destination stop
  findCandidateRoutes(sourceStopId, destinationStopId) {
    const candidates = [];
    const srcStr = sourceStopId.toString();
    const dstStr = destinationStopId.toString();

    // 1. Check direct bus routes serving both source and destination in correct order
    for (const route of this.routes) {
      const stops = route.stops || [];
      const srcIndex = stops.findIndex(s => (s.stop?._id || s.stop).toString() === srcStr);
      const dstIndex = stops.findIndex(s => (s.stop?._id || s.stop).toString() === dstStr);

      if (srcIndex !== -1 && dstIndex !== -1 && srcIndex < dstIndex) {
        // Direct route exists!
        const intermediateStops = stops.slice(srcIndex, dstIndex + 1);
        const startMin = intermediateStops[0].scheduledMinutesFromStart || 0;
        const endMin = intermediateStops[intermediateStops.length - 1].scheduledMinutesFromStart || 25;
        const travelTime = Math.max(8, endMin - startMin);
        const distance = this.computeRoadDistanceKm(intermediateStops);

        candidates.push({
          type: 'DIRECT',
          transfers: 0,
          legs: [
            {
              routeId: route._id.toString(),
              routeName: route.name,
              routeCode: route.code,
              routeColor: route.color || '#0c87eb',
              fromStopIndex: srcIndex,
              toStopIndex: dstIndex,
              stopsCount: dstIndex - srcIndex,
              travelTimeMinutes: travelTime,
              distanceKm: distance,
              stopsList: intermediateStops
            }
          ],
          totalTravelTime: travelTime,
          totalDistanceKm: distance,
          walkingMeters: 250 // Typical campus stop walk
        });
      }
    }

    // 2. Check 1-transfer connections (Interchange hub)
    if (candidates.length < 3) {
      for (const route1 of this.routes) {
        const stops1 = route1.stops || [];
        const srcIndex = stops1.findIndex(s => (s.stop?._id || s.stop).toString() === srcStr);
        if (srcIndex === -1) continue;

        for (let i = srcIndex + 1; i < stops1.length; i++) {
          const transferStopId = (stops1[i].stop?._id || stops1[i].stop).toString();

          for (const route2 of this.routes) {
            if ((route1._id || route1.id).toString() === (route2._id || route2.id).toString()) continue;

            const stops2 = route2.stops || [];
            const transferIndex = stops2.findIndex(s => (s.stop?._id || s.stop).toString() === transferStopId);
            const dstIndex = stops2.findIndex(s => (s.stop?._id || s.stop).toString() === dstStr);

            if (transferIndex !== -1 && dstIndex !== -1 && transferIndex < dstIndex) {
              const leg1Time = Math.max(5, (stops1[i].scheduledMinutesFromStart || 15) - (stops1[srcIndex].scheduledMinutesFromStart || 0));
              const leg2Time = Math.max(5, (stops2[dstIndex].scheduledMinutesFromStart || 20) - (stops2[transferIndex].scheduledMinutesFromStart || 0));
              const leg1Stops = stops1.slice(srcIndex, i + 1);
              const leg2Stops = stops2.slice(transferIndex, dstIndex + 1);
              const leg1Dist = this.computeRoadDistanceKm(leg1Stops);
              const leg2Dist = this.computeRoadDistanceKm(leg2Stops);
              const totalDistance = Math.round((leg1Dist + leg2Dist) * 10) / 10;
              const totalTravelTime = leg1Time + leg2Time + 5; // 5 min transfer walking & boarding buffer

              candidates.push({
                type: 'TRANSFER',
                transfers: 1,
                transferStopId,
                legs: [
                  {
                    routeId: route1._id.toString(),
                    routeName: route1.name,
                    routeCode: route1.code,
                    routeColor: route1.color || '#0c87eb',
                    fromStopIndex: srcIndex,
                    toStopIndex: i,
                    stopsCount: i - srcIndex,
                    travelTimeMinutes: leg1Time,
                    distanceKm: leg1Dist,
                    stopsList: leg1Stops
                  },
                  {
                    routeId: route2._id.toString(),
                    routeName: route2.name,
                    routeCode: route2.code,
                    routeColor: route2.color || '#8b5cf6',
                    fromStopIndex: transferIndex,
                    toStopIndex: dstIndex,
                    stopsCount: dstIndex - transferIndex,
                    travelTimeMinutes: leg2Time,
                    distanceKm: leg2Dist,
                    stopsList: leg2Stops
                  }
                ],
                totalTravelTime,
                totalDistanceKm: totalDistance,
                walkingMeters: 450 // Campus transfer walking distance
              });
            }
          }
        }
      }
    }

    return candidates;
  }
}

module.exports = {
  TransitGraph,
  getHaversineDistance
};
