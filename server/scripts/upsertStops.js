const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const newStops = [
  {
    _id: new mongoose.Types.ObjectId('65e100000000000000000022'),
    name: 'Jagat Farm Commercial Hub',
    code: 'JGT',
    latitude: 28.4792,
    longitude: 77.5014,
    zone: 'Gamma Sector',
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('65e100000000000000000023'),
    name: 'City Park & Alpha 2 Avenue',
    code: 'CPK',
    latitude: 28.4733,
    longitude: 77.5209,
    zone: 'Alpha Sector',
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('65e100000000000000000024'),
    name: 'Knowledge Park I (KP-1 Hub)',
    code: 'KP1',
    latitude: 28.4650,
    longitude: 77.5020,
    zone: 'Knowledge Park Corridor',
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('65e100000000000000000025'),
    name: 'Sharda University (KP-3 Campus Gate)',
    code: 'SHU',
    latitude: 28.4734,
    longitude: 77.4829,
    zone: 'Knowledge Park Corridor',
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId('65e100000000000000000026'),
    name: 'Galgotias University (Yamuna Expressway Campus)',
    code: 'GLU',
    latitude: 28.3671,
    longitude: 77.5405,
    zone: 'Yamuna Expressway Corridor',
    isActive: true
  }
];

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_bus_ai';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  const Stop = mongoose.model('Stop', new mongoose.Schema({}, { strict: false }));
  const Route = mongoose.model('Route', new mongoose.Schema({}, { strict: false }));

  for (const stop of newStops) {
    await Stop.updateOne({ _id: stop._id }, { $set: stop }, { upsert: true });
    console.log('Upserted stop:', stop.name, `(${stop.code})`);
  }

  // Update Route 101 stops (KP-3 University Express)
  await Route.updateOne({ _id: new mongoose.Types.ObjectId('65e300000000000000000001') }, {
    $set: {
      stops: [
        { stop: new mongoose.Types.ObjectId('65e100000000000000000025'), order: 1, scheduledMinutesFromStart: 0 },  // SHU
        { stop: new mongoose.Types.ObjectId('65e100000000000000000003'), order: 2, scheduledMinutesFromStart: 3 },  // GLB
        { stop: new mongoose.Types.ObjectId('65e100000000000000000002'), order: 3, scheduledMinutesFromStart: 8 },  // KP2
        { stop: new mongoose.Types.ObjectId('65e100000000000000000024'), order: 4, scheduledMinutesFromStart: 11 }, // KP1
        { stop: new mongoose.Types.ObjectId('65e100000000000000000019'), order: 5, scheduledMinutesFromStart: 14 }, // IEM
        { stop: new mongoose.Types.ObjectId('65e100000000000000000001'), order: 6, scheduledMinutesFromStart: 18 }, // PCK
        { stop: new mongoose.Types.ObjectId('65e100000000000000000006'), order: 7, scheduledMinutesFromStart: 22 }, // AL1
        { stop: new mongoose.Types.ObjectId('65e100000000000000000023'), order: 8, scheduledMinutesFromStart: 25 }, // CPK
        { stop: new mongoose.Types.ObjectId('65e100000000000000000007'), order: 9, scheduledMinutesFromStart: 28 }, // AL2
        { stop: new mongoose.Types.ObjectId('65e100000000000000000022'), order: 10, scheduledMinutesFromStart: 32 } // JGT
      ]
    }
  });

  // Update Route 103 stops (Aqua Line Metro Orbit)
  await Route.updateOne({ _id: new mongoose.Types.ObjectId('65e300000000000000000003') }, {
    $set: {
      stops: [
        { stop: new mongoose.Types.ObjectId('65e100000000000000000002'), order: 1, scheduledMinutesFromStart: 0 },  // KP2
        { stop: new mongoose.Types.ObjectId('65e100000000000000000001'), order: 2, scheduledMinutesFromStart: 7 },  // PCK
        { stop: new mongoose.Types.ObjectId('65e100000000000000000006'), order: 3, scheduledMinutesFromStart: 12 }, // AL1
        { stop: new mongoose.Types.ObjectId('65e100000000000000000022'), order: 4, scheduledMinutesFromStart: 16 }, // JGT
        { stop: new mongoose.Types.ObjectId('65e100000000000000000023'), order: 5, scheduledMinutesFromStart: 20 }, // CPK
        { stop: new mongoose.Types.ObjectId('65e100000000000000000007'), order: 6, scheduledMinutesFromStart: 23 }, // AL2
        { stop: new mongoose.Types.ObjectId('65e100000000000000000008'), order: 7, scheduledMinutesFromStart: 27 }, // BT1
        { stop: new mongoose.Types.ObjectId('65e100000000000000000011'), order: 8, scheduledMinutesFromStart: 34 }  // DL1
      ]
    }
  });

  // Update Route 104 stops (Yamuna Expressway - GBU & Galgotias)
  await Route.updateOne({ _id: new mongoose.Types.ObjectId('65e300000000000000000004') }, {
    $set: {
      stops: [
        { stop: new mongoose.Types.ObjectId('65e100000000000000000017'), order: 1, scheduledMinutesFromStart: 0 },  // YEX
        { stop: new mongoose.Types.ObjectId('65e100000000000000000001'), order: 2, scheduledMinutesFromStart: 8 },  // PCK
        { stop: new mongoose.Types.ObjectId('65e100000000000000000004'), order: 3, scheduledMinutesFromStart: 18 }, // GBU
        { stop: new mongoose.Types.ObjectId('65e100000000000000000026'), order: 4, scheduledMinutesFromStart: 26 }, // GLU
        { stop: new mongoose.Types.ObjectId('65e100000000000000000016'), order: 5, scheduledMinutesFromStart: 35 }  // KSN
      ]
    }
  });

  // Update Route 106 stops (Delta - Gamma Residential Shuttle)
  await Route.updateOne({ _id: new mongoose.Types.ObjectId('65e300000000000000000006') }, {
    $set: {
      stops: [
        { stop: new mongoose.Types.ObjectId('65e100000000000000000012'), order: 1, scheduledMinutesFromStart: 0 },  // DL2
        { stop: new mongoose.Types.ObjectId('65e100000000000000000010'), order: 2, scheduledMinutesFromStart: 6 },  // GM1
        { stop: new mongoose.Types.ObjectId('65e100000000000000000022'), order: 3, scheduledMinutesFromStart: 10 }, // JGT
        { stop: new mongoose.Types.ObjectId('65e100000000000000000009'), order: 4, scheduledMinutesFromStart: 14 }, // BT2
        { stop: new mongoose.Types.ObjectId('65e100000000000000000006'), order: 5, scheduledMinutesFromStart: 18 }, // AL1
        { stop: new mongoose.Types.ObjectId('65e100000000000000000001'), order: 6, scheduledMinutesFromStart: 23 }  // PCK
      ]
    }
  });

  const total = await Stop.countDocuments();
  console.log('Done! Total stops in MongoDB now:', total);
  process.exit(0);
}

run().catch(err => {
  console.error('Error upserting stops:', err);
  process.exit(1);
});
