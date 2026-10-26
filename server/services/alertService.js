const store = require('./store');

async function getSmartAlertsForUser(user) {
  const buses = await store.getAllBuses();
  const routes = await store.getAllRoutes();
  const alerts = [];

  const userPrefs = user?.preferences || {
    mode: 'BALANCED',
    crowdPriority: 'HIGH',
    walkingPriority: 'HIGH'
  };

  const userFavBuses = (user?.favoriteBuses || []).map(b => (b._id || b).toString());
  const userFavRoutes = (user?.favoriteRoutes || []).map(r => (r._id || r).toString());

  // 0. User-Reported Incidents & Road Issues (Persisted in DB)
  try {
    const incidents = await store.getAllIncidents();
    for (const inc of (incidents || []).slice(0, 10)) {
      const isCritical = inc.severity === 'critical' || inc.severity === 'high';
      alerts.push({
        id: `incident_${inc._id}`,
        incidentId: inc._id,
        type: isCritical ? 'error' : 'warning',
        category: 'INCIDENT',
        title: inc.title || `Reported Issue (${inc.type})`,
        message: `${inc.description}${inc.busNumber ? ` • Bus: ${inc.busNumber}` : ''}`,
        severity: inc.severity || 'medium',
        busNumber: inc.busNumber || null,
        status: inc.status || 'open',
        reporterName: inc.reporterName || 'Commuter',
        timestamp: inc.createdAt || new Date(),
        read: false
      });
    }
  } catch (err) {
    console.warn('[Alert Service] Could not fetch incidents for alerts feed:', err.message);
  }

  // 1. High Crowd Alerts
  for (const bus of buses) {
    if (bus.occupancyPercentage >= 80) {
      const isFavorite = userFavBuses.includes(bus._id.toString());
      const altBus = buses.find(b => b._id.toString() !== bus._id.toString() && b.occupancyPercentage < 65 && b.status === 'active');
      
      let message = `${bus.busNumber} is currently at high crowd capacity (${bus.occupancyPercentage}% full).`;
      if (isFavorite && altBus) {
        message = `Your preferred ${bus.busNumber} is expected to be highly crowded today (${bus.occupancyPercentage}% full). ${altBus.busNumber} is a less crowded alternative.`;
      } else if (altBus) {
        message += ` Consider ${altBus.busNumber} for a more comfortable journey.`;
      }

      alerts.push({
        id: `alert_crowd_${bus._id}`,
        type: 'warning',
        category: 'CROWD',
        title: 'High Occupancy Alert',
        message,
        busId: bus._id,
        busNumber: bus.busNumber,
        timestamp: new Date()
      });
    }
  }

  // 2. Delay Alerts
  for (const bus of buses) {
    if (bus.delayMinutes >= 5) {
      const isFavorite = userFavBuses.includes(bus._id.toString());
      const routeName = bus.route?.name || 'Assigned Route';
      let message = `${bus.busNumber} is delayed by ${bus.delayMinutes} minutes due to traffic on ${routeName}.`;
      if (isFavorite) {
        message = `Your usual ${bus.busNumber} is delayed by ${bus.delayMinutes} minutes. Alternate buses on the corridor may reach campus earlier.`;
      }

      alerts.push({
        id: `alert_delay_${bus._id}`,
        type: 'error',
        category: 'DELAY',
        title: 'Service Delay',
        message,
        busId: bus._id,
        busNumber: bus.busNumber,
        timestamp: new Date()
      });
    }
  }

  // 3. Arriving Soon Alerts
  for (const bus of buses) {
    if (bus.status === 'active' && bus.nextStopEtaMinutes <= 4) {
      alerts.push({
        id: `alert_eta_${bus._id}`,
        type: 'info',
        category: 'ARRIVAL',
        title: 'Bus Approaching Stop',
        message: `${bus.busNumber} will arrive at the upcoming stop in approximately ${bus.nextStopEtaMinutes} minutes.`,
        busId: bus._id,
        busNumber: bus.busNumber,
        timestamp: new Date()
      });
      if (alerts.length >= 5) break;
    }
  }

  // Fallback system general notice if fleet is smooth
  if (alerts.length === 0) {
    alerts.push({
      id: 'alert_normal_ops',
      type: 'success',
      category: 'STATUS',
      title: 'Optimal Fleet Status',
      message: 'All campus transit corridors are operating on-schedule with standard seating availability.',
      timestamp: new Date()
    });
  }

  return alerts;
}

module.exports = {
  getSmartAlertsForUser
};
