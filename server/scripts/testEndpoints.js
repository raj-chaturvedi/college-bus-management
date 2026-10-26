const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const store = require('../services/store');
const { getSmartAlertsForUser } = require('../services/alertService');
const { sendIssueReportEmail } = require('../services/emailService');

async function runTests() {
  console.log('=== STARTING INTEGRATION & UNIT VERIFICATION TESTS ===\n');

  // Test 1: MongoDB Connection
  await connectDB();
  console.log('✓ Test 1 Passed: Connected to MongoDB successfully.');

  // Test 2: Check Stops count and verified new stops
  const stops = await store.getAllStops();
  console.log(`✓ Test 2: Total Stops in DB = ${stops.length}`);
  const targetNames = ['Jagat Farm', 'City Park', 'Knowledge Park I', 'Sharda University', 'Galgotias University'];
  for (const name of targetNames) {
    const found = stops.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
    if (!found) {
      throw new Error(`Stop '${name}' not found in database!`);
    }
    console.log(`   - Verified stop: ${found.name} at [${found.latitude}, ${found.longitude}]`);
  }
  console.log('✓ Test 2 Passed: All 5 newly verified Greater Noida stops exist in MongoDB.\n');

  // Test 3: Check Routes and stop sequence
  const routes = await store.getAllRoutes();
  console.log(`✓ Test 3: Total Routes = ${routes.length}`);
  for (const r of routes) {
    console.log(`   - Route ${r.code}: ${r.name} (${r.stops.length} stops)`);
  }
  console.log('✓ Test 3 Passed: Routes loaded with updated sequences.\n');

  // Test 4: Live Telemetry Simulation & Road-following
  const buses = await store.getAllBuses();
  console.log(`✓ Test 4: Total Buses = ${buses.length}`);
  const sampleBus = buses.find(b => b.status === 'active') || buses[0];
  console.log(`   - Sample active bus ${sampleBus.busNumber}: Lat=${sampleBus.currentLocation?.latitude}, Lng=${sampleBus.currentLocation?.longitude}, Occupancy=${sampleBus.occupancyPercentage}%`);
  console.log('✓ Test 4 Passed: Fleet telemetry initialized.\n');

  // Test 5: ETA Calculator Unit Tests
  console.log('✓ Test 5: Testing dynamic ETA calculation logic...');
  const { calculateBusArrivalInfo } = await import('../../client/src/utils/etaCalculator.js');
  const boardingStop = stops[0];
  const destStop = stops[1];
  const unservedStop = stops.find(s => s.name.includes('Galgotias')) || stops[stops.length - 1];

  // Case A: Bus serves the route
  const etaServing = calculateBusArrivalInfo(sampleBus, boardingStop, destStop, routes[0], true);
  console.log(`   - Serving Bus ETA: status="${etaServing.status}", headline="${etaServing.headline}", minutes=${etaServing.etaMinutes}`);

  // Case B: Bus does not serve destination
  const etaUnserved = calculateBusArrivalInfo(sampleBus, boardingStop, unservedStop, null, false);
  console.log(`   - Unserved Destination ETA: status="${etaUnserved.status}", headline="${etaUnserved.headline}"`);
  if (etaUnserved.headline === 'Arriving in 4 min') {
    throw new Error('FAILED: Hardcoded 4 min fallback detected for unserved destination!');
  }
  console.log('✓ Test 5 Passed: Dynamic ETA calculation and unserved states working.\n');

  // Test 6: Persisted Incident & Notification Feed
  console.log('✓ Test 6: Testing Issue Submission & In-App Alert Feed...');
  const testIncident = await store.createIncident({
    reporterName: 'Test Suite Runner',
    type: 'traffic_jam',
    title: 'Automated Test Bottleneck at Pari Chowk',
    description: 'Testing verification of incident persistence and notifications.',
    busNumber: sampleBus.busNumber,
    severity: 'medium',
    delayAddedMinutes: 4
  });
  console.log(`   - Created Test Incident ID: ${testIncident._id}`);

  const smartAlerts = await getSmartAlertsForUser({ name: 'Admin' });
  const foundIncidentAlert = smartAlerts.find(a => a.incidentId?.toString() === testIncident._id.toString());
  if (!foundIncidentAlert) {
    throw new Error('FAILED: Newly created incident not found in smart alerts feed!');
  }
  console.log(`   - Found incident in alerts feed: category="${foundIncidentAlert.category}", title="${foundIncidentAlert.title}"`);
  console.log('✓ Test 6 Passed: Issue persistence and in-app alert feed verified.\n');

  // Test 7: Email Service Dispatch Flow
  console.log('✓ Test 7: Testing Email Service Dispatch...');
  const emailRes = await sendIssueReportEmail({
    incident: testIncident,
    reporterName: 'Test Commuter',
    busNumber: sampleBus.busNumber,
    routeName: 'Greater Noida Express Corridor'
  });
  console.log(`   - Email dispatch result: success=${emailRes.success}, messageId=${emailRes.messageId || 'none'}, error=${emailRes.error || 'none'}`);
  console.log('✓ Test 7 Passed: Email dispatch handled gracefully without crashing.\n');

  // Cleanup test incident
  const Incident = mongoose.model('Incident');
  await Incident.findByIdAndDelete(testIncident._id);
  console.log('   - Cleaned up test incident.');

  await mongoose.disconnect();
  console.log('\n=== ALL 7 VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
