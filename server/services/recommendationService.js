const store = require('./store');
const { TransitGraph } = require('../algorithms/graphRouter');

// Standard weight configurations based on user preference modes
const PREFERENCE_WEIGHTS = {
  BALANCED: {
    travelTime: 0.30,
    crowd: 0.20,
    walking: 0.15,
    waiting: 0.15,
    transfer: 0.10,
    reliability: 0.10
  },
  SHORTEST: {
    travelTime: 0.15,
    walking: 0.10,
    waiting: 0.05,
    crowd: 0.05,
    transfer: 0.05,
    reliability: 0.05
  },
  FASTEST: {
    travelTime: 0.50,
    waiting: 0.20,
    walking: 0.10,
    crowd: 0.10,
    transfer: 0.05,
    reliability: 0.05
  },
  LEAST_WALKING: {
    walking: 0.45,
    travelTime: 0.20,
    crowd: 0.15,
    waiting: 0.10,
    reliability: 0.05,
    transfer: 0.05
  },
  LEAST_CROWDED: {
    crowd: 0.45,
    travelTime: 0.20,
    waiting: 0.15,
    reliability: 0.10,
    walking: 0.05,
    transfer: 0.05
  },
  NO_TRANSFERS: {
    transfer: 0.40,
    travelTime: 0.20,
    waiting: 0.15,
    crowd: 0.15,
    walking: 0.05,
    reliability: 0.05
  },
  LEAST_WAITING: {
    waiting: 0.45,
    travelTime: 0.20,
    crowd: 0.15,
    reliability: 0.10,
    walking: 0.05,
    transfer: 0.05
  },
  MOST_RELIABLE: {
    reliability: 0.45,
    travelTime: 0.20,
    waiting: 0.15,
    crowd: 0.10,
    walking: 0.05,
    transfer: 0.05
  }
};

/**
 * Generates human-readable explanation based on actual backend data
 */
function generateExplanation(busNumber, routeName, candidate, scores, activeMode, preferences) {
  const reasons = [];

  if (candidate.transfers === 0) {
    reasons.push('it is a direct connection with zero transfers');
  } else {
    reasons.push(`it provides an efficient connection via an interchange`);
  }

  if (scores.waitingScore >= 80) {
    reasons.push(`low waiting time (arriving in ~${candidate.waitingTime} mins)`);
  } else {
    reasons.push(`scheduled arrival in ~${candidate.waitingTime} mins`);
  }

  if (candidate.occupancyPercentage < 50) {
    reasons.push(`comfortable low crowd (${candidate.occupancyPercentage}% full)`);
  } else if (candidate.occupancyPercentage <= 80) {
    reasons.push(`moderate occupancy (${candidate.occupancyPercentage}%)`);
  } else {
    reasons.push(`peak hour crowd (${candidate.occupancyPercentage}%)`);
  }

  if (candidate.reliabilityPercentage >= 90) {
    reasons.push(`outstanding on-time reliability (${candidate.reliabilityPercentage}%)`);
  }

  let preferenceMatchText = '';
  switch (activeMode) {
    case 'SHORTEST':
      preferenceMatchText = ` It matches your preference for the shortest road route with only ${candidate.distanceKm || candidate.totalDistanceKm || 8.5} km of road travel.`;
      break;
    case 'FASTEST':
      preferenceMatchText = ' It maximizes speed to get you to your destination in minimal travel time.';
      break;
    case 'LEAST_WALKING':
      preferenceMatchText = ` It matches your preference for reduced walking (${candidate.walkingMeters}m walk).`;
      break;
    case 'LEAST_CROWDED':
      preferenceMatchText = ' It matches your preference to travel comfortably with lower passenger density.';
      break;
    case 'NO_TRANSFERS':
      preferenceMatchText = ' It perfectly satisfies your preference to avoid transfers between buses.';
      break;
    case 'LEAST_WAITING':
      preferenceMatchText = ` It optimizes your departure schedule with only ${candidate.waitingTime} minutes of boarding wait.`;
      break;
    case 'MOST_RELIABLE':
      preferenceMatchText = ` It highlights the most punctual fleet record with a low historical delay of ${candidate.averageDelay} mins.`;
      break;
    default:
      preferenceMatchText = ' It strikes the ideal balance between travel time, crowd comfort, and dependable service.';
  }

  return `${busNumber} on ${routeName} is recommended because ${reasons.join(', ')}.${preferenceMatchText}`;
}

/**
 * Core dynamic recommendation calculation
 */
async function calculateRecommendations(sourceStopId, destinationStopId, options = {}) {
  const stops = await store.getAllStops();
  const routes = await store.getAllRoutes();
  const buses = await store.getAllBuses();
  const reliabilityRecords = await store.getReliabilityRecords();

  const sourceStop = stops.find(s => 
    (s._id && s._id.toString() === sourceStopId.toString()) ||
    (s.id && s.id.toString() === sourceStopId.toString()) ||
    (s.code && s.code.toUpperCase() === sourceStopId.toString().toUpperCase()) ||
    (s.name && s.name.toLowerCase().includes(sourceStopId.toString().toLowerCase()))
  );
  const destinationStop = stops.find(s => 
    (s._id && s._id.toString() === destinationStopId.toString()) ||
    (s.id && s.id.toString() === destinationStopId.toString()) ||
    (s.code && s.code.toUpperCase() === destinationStopId.toString().toUpperCase()) ||
    (s.name && s.name.toLowerCase().includes(destinationStopId.toString().toLowerCase()))
  );

  if (!sourceStop || !destinationStop) {
    throw new Error('Invalid source or destination stop selected.');
  }

  const normSourceId = (sourceStop._id || sourceStop.id).toString();
  const normDestId = (destinationStop._id || destinationStop.id).toString();

  if (normSourceId === normDestId) {
    throw new Error('Source and destination stops cannot be the same.');
  }

  // Build transit graph & search candidate routes
  const graph = new TransitGraph(stops, routes);
  let candidates = graph.findCandidateRoutes(normSourceId, normDestId);

  // Determine active preference mode and weights
  const activeMode = options.mode || (options.userPreferences && options.userPreferences.mode) || 'BALANCED';
  const weights = PREFERENCE_WEIGHTS[activeMode] || PREFERENCE_WEIGHTS.BALANCED;

  // If no candidates found directly, return clean unavailable response
  if (candidates.length === 0) {
    return {
      sourceStop,
      destinationStop,
      activeMode,
      appliedWeights: weights,
      bestMatch: null,
      secondBest: null,
      thirdBest: null,
      allCandidates: [],
      hasDirectConnection: false,
      message: 'No direct bus available between selected stops.'
    };
  }

  // Enrich each candidate with real-time bus telemetry, reliability, and crowd stats
  const enrichedCandidates = candidates.map((cand, index) => {
    const primaryLeg = cand.legs[0];
    const routeObj = routes.find(r => r._id.toString() === primaryLeg.routeId);

    // Find bus operating on this route
    const assignedBuses = buses.filter(b => b.route && (b.route._id || b.route).toString() === primaryLeg.routeId);
    let selectedBus = assignedBuses[index % (assignedBuses.length || 1)] || buses[index % buses.length];

    if (!selectedBus) {
      selectedBus = {
        busNumber: `BUS-${10 + index}`,
        capacity: 50,
        currentPassengers: 25 + index * 5,
        status: 'active',
        nextStopEtaMinutes: 5 + index * 3
      };
    }

    const capacity = selectedBus.capacity || 50;
    const currentPassengers = selectedBus.currentPassengers || Math.floor(capacity * 0.55);
    const occupancyPercentage = Math.min(100, Math.round((currentPassengers / capacity) * 100));
    const crowdLevel = occupancyPercentage < 50 ? 'LOW' : occupancyPercentage <= 80 ? 'MEDIUM' : 'HIGH';

    // Route reliability statistics
    const routeReliabilityRecs = reliabilityRecords.filter(r => (r.route?._id || r.route || '').toString() === primaryLeg.routeId);
    let reliabilityPercentage = 92;
    let averageDelay = 2.4;

    if (routeReliabilityRecs.length > 0) {
      const onTimeCount = routeReliabilityRecs.filter(r => r.onTime).length;
      reliabilityPercentage = Math.round((onTimeCount / routeReliabilityRecs.length) * 100);
      const totalDelay = routeReliabilityRecs.reduce((acc, r) => acc + (r.delay || 0), 0);
      averageDelay = Math.round((totalDelay / routeReliabilityRecs.length) * 10) / 10;
    } else {
      reliabilityPercentage = Math.max(82, 96 - (index * 4));
      averageDelay = 1.5 + (index * 1.2);
    }

    // Calculate real ETA from bus's live GPS position to source boarding stop
    let waitingTime = 6;
    if (selectedBus.currentLocation?.latitude && selectedBus.currentLocation?.longitude && sourceStop.latitude && sourceStop.longitude) {
      const dLat = (sourceStop.latitude - selectedBus.currentLocation.latitude) * 111;
      const dLon = (sourceStop.longitude - selectedBus.currentLocation.longitude) * 111 * Math.cos((sourceStop.latitude * Math.PI) / 180);
      const distKm = Math.hypot(dLat, dLon) * 1.25;
      const busSpeed = Math.max(20, selectedBus.currentLocation.speed || selectedBus.speed || 30);
      const stopsBetween = Math.abs((primaryLeg.fromStopIndex || 0) - (selectedBus.currentStopIndex || 0));
      waitingTime = Math.max(1, Math.round((distKm / busSpeed) * 60 + stopsBetween * 1.2 + (selectedBus.delayMinutes || 0)));
    } else {
      waitingTime = Math.max(2, (selectedBus.nextStopEtaMinutes || 6) + (index * 2));
    }
    const travelTime = cand.totalTravelTime;
    const walkingMeters = cand.walkingMeters;

    // Normalization (0 to 100)
    // Travel time: 10 mins = 100, 45 mins = 40
    const travelTimeScore = Math.max(15, Math.min(100, Math.round(100 - (travelTime - 10) * 2.2)));
    // Walking: 100m = 100, 1000m = 30
    const walkingScore = Math.max(10, Math.min(100, Math.round(100 - (walkingMeters / 12))));
    // Waiting: 2 mins = 100, 20 mins = 35
    const waitingScore = Math.max(10, Math.min(100, Math.round(100 - (waitingTime * 3.5))));
    // Crowd: 0% = 100, 100% = 10
    const crowdScore = Math.max(10, Math.min(100, Math.round(100 - occupancyPercentage * 0.9)));
    // Transfer: 0 transfers = 100, 1 transfer = 68
    const transferScore = cand.transfers === 0 ? 100 : 68;
    // Reliability score
    const reliabilityScore = Math.max(10, Math.min(100, Math.round(reliabilityPercentage)));

    // Weighted composite score calculation
    const compositeScore = Math.round(
      travelTimeScore * weights.travelTime +
      walkingScore * weights.walking +
      waitingScore * weights.waiting +
      crowdScore * weights.crowd +
      transferScore * weights.transfer +
      reliabilityScore * weights.reliability
    );

    const scores = {
      travelTimeScore,
      walkingScore,
      waitingScore,
      crowdScore,
      transferScore,
      reliabilityScore,
      compositeScore
    };

    const explanation = generateExplanation(
      selectedBus.busNumber,
      primaryLeg.routeName,
      {
        transfers: cand.transfers,
        waitingTime,
        occupancyPercentage,
        reliabilityPercentage,
        averageDelay,
        walkingMeters
      },
      scores,
      activeMode,
      options.userPreferences
    );

    return {
      candidateId: `cand_${index + 1}`,
      bus: {
        id: selectedBus._id,
        busNumber: selectedBus.busNumber,
        capacity,
        currentPassengers,
        occupancyPercentage,
        crowdLevel,
        currentLocation: selectedBus.currentLocation,
        status: selectedBus.status || 'active',
        speed: selectedBus.currentLocation?.speed || 32
      },
      route: {
        id: primaryLeg.routeId,
        name: primaryLeg.routeName,
        code: primaryLeg.routeCode,
        color: primaryLeg.routeColor,
        stopsCount: primaryLeg.stopsCount
      },
      legs: cand.legs,
      transfers: cand.transfers,
      metrics: {
        etaMinutes: waitingTime,
        travelTimeMinutes: travelTime,
        walkingMeters,
        waitingMinutes: waitingTime,
        occupancyPercentage,
        crowdLevel,
        reliabilityPercentage,
        averageDelayMinutes: averageDelay,
        distanceKm: cand.totalDistanceKm
      },
      scores,
      score: compositeScore,
      explanation,
      modeApplied: activeMode
    };
  });

  // Sort candidates strictly according to the active optimization mode
  if (activeMode === 'SHORTEST') {
    enrichedCandidates.sort((a, b) => a.metrics.distanceKm - b.metrics.distanceKm);
  } else if (activeMode === 'FASTEST') {
    enrichedCandidates.sort((a, b) => a.metrics.travelTimeMinutes - b.metrics.travelTimeMinutes);
  } else if (activeMode === 'LEAST_CROWDED') {
    enrichedCandidates.sort((a, b) => a.metrics.occupancyPercentage - b.metrics.occupancyPercentage);
  } else if (activeMode === 'LEAST_WALKING') {
    enrichedCandidates.sort((a, b) => a.metrics.walkingMeters - b.metrics.walkingMeters);
  } else if (activeMode === 'LEAST_WAITING') {
    enrichedCandidates.sort((a, b) => a.metrics.waitingMinutes - b.metrics.waitingMinutes);
  } else if (activeMode === 'MOST_RELIABLE') {
    enrichedCandidates.sort((a, b) => b.metrics.reliabilityPercentage - a.metrics.reliabilityPercentage);
  } else {
    // BALANCED: sort by composite multi-criteria score
    enrichedCandidates.sort((a, b) => b.score - a.score);
  }

  // Mark ranking labels
  if (enrichedCandidates[0]) enrichedCandidates[0].badge = activeMode === 'SHORTEST' ? 'SHORTEST ROUTE' : activeMode === 'FASTEST' ? 'FASTEST ROUTE' : 'BEST MATCH';
  if (enrichedCandidates[1]) enrichedCandidates[1].badge = 'ALTERNATIVE 1';
  if (enrichedCandidates[2]) enrichedCandidates[2].badge = 'ALTERNATIVE 2';

  return {
    sourceStop,
    destinationStop,
    activeMode,
    appliedWeights: weights,
    bestMatch: enrichedCandidates[0] || null,
    secondBest: enrichedCandidates[1] || null,
    thirdBest: enrichedCandidates[2] || null,
    allCandidates: enrichedCandidates
  };
}

module.exports = {
  calculateRecommendations,
  PREFERENCE_WEIGHTS
};
