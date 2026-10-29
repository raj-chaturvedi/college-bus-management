const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
const bcrypt = require('bcryptjs');
const fs = require('fs');
const mongoose = require('mongoose');

// Relative paths for models
const User = require('../server/models/User');
const Stop = require('../server/models/Stop');
const Route = require('../server/models/Route');
const Bus = require('../server/models/Bus');
const Driver = require('../server/models/Driver');
const Trip = require('../server/models/Trip');
const Favorite = require('../server/models/Favorite');
const OccupancyRecord = require('../server/models/OccupancyRecord');
const ReliabilityRecord = require('../server/models/ReliabilityRecord');
const store = require('../server/services/store');

async function seedData() {
  console.log('[Seed] Starting Greater Noida database seeding process...');

  const salt = await bcrypt.genSalt(10);
  const studentPassword = await bcrypt.hash('student123', salt);
  const adminPassword = await bcrypt.hash('admin123', salt);

  // 1. Users (Empty: All commuters register securely via /register with email verification)
  const usersData = [];

  // 2. Real Greater Noida Stops (21 stops across Greater Noida & Knowledge Park)
  const stopsData = [
    { _id: '65e100000000000000000001', name: 'Pari Chowk Central Interchange', code: 'PCK', latitude: 28.4682, longitude: 77.5098, zone: 'Pari Chowk Central' },
    { _id: '65e100000000000000000002', name: 'Knowledge Park II (KP-2 Metro)', code: 'KP2', latitude: 28.4615, longitude: 77.4985, zone: 'Knowledge Park Corridor' },
    { _id: '65e100000000000000000003', name: 'GL Bajaj & Knowledge Park III', code: 'GLB', latitude: 28.4727, longitude: 77.4890, zone: 'Knowledge Park Corridor' },
    { _id: '65e100000000000000000004', name: 'Gautam Buddha University (GBU Main Gate)', code: 'GBU', latitude: 28.4215, longitude: 77.5270, zone: 'GBU University Campus' },
    { _id: '65e100000000000000000005', name: 'Bennett University (Tech Zone 2)', code: 'BNT', latitude: 28.4510, longitude: 77.5835, zone: 'Tech Zone Corridor' },
    { _id: '65e100000000000000000006', name: 'Alpha 1 Commercial & Metro', code: 'AL1', latitude: 28.4760, longitude: 77.5110, zone: 'Alpha Sector' },
    { _id: '65e100000000000000000007', name: 'Alpha 2 Commercial Centre', code: 'AL2', latitude: 28.4795, longitude: 77.5190, zone: 'Alpha Sector' },
    { _id: '65e100000000000000000008', name: 'Beta 1 Central Market', code: 'BT1', latitude: 28.4840, longitude: 77.5080, zone: 'Beta Sector' },
    { _id: '65e100000000000000000009', name: 'Beta 2 Omaxe NRI City Center', code: 'BT2', latitude: 28.4890, longitude: 77.5020, zone: 'Beta Sector' },
    { _id: '65e100000000000000000010', name: 'Gamma 1 & 2 Green Avenue', code: 'GM1', latitude: 28.4800, longitude: 77.5010, zone: 'Gamma Sector' },
    { _id: '65e100000000000000000011', name: 'Delta 1 Metro Station (Aqua Line)', code: 'DL1', latitude: 28.4975, longitude: 77.5180, zone: 'Delta Sector' },
    { _id: '65e100000000000000000012', name: 'Delta 2 Senior Citizen Park', code: 'DL2', latitude: 28.4940, longitude: 77.5260, zone: 'Delta Sector' },
    { _id: '65e100000000000000000013', name: 'Surajpur Police Lines & Collectorate', code: 'SPJ', latitude: 28.5250, longitude: 77.4850, zone: 'Surajpur Corridor' },
    { _id: '65e100000000000000000014', name: 'Greater Noida West (Gaur City / Gaur Chowk)', code: 'GNW', latitude: 28.5980, longitude: 77.4280, zone: 'Gr. Noida West' },
    { _id: '65e100000000000000000015', name: 'Ecotech III Industrial & Tech Hub', code: 'ECO', latitude: 28.5520, longitude: 77.4720, zone: 'Ecotech Zone' },
    { _id: '65e100000000000000000016', name: 'Kasna Transit Terminal & Heritage Village', code: 'KSN', latitude: 28.4410, longitude: 77.5420, zone: 'Kasna Junction' },
    { _id: '65e100000000000000000017', name: 'Yamuna Expressway Zero Point', code: 'YEX', latitude: 28.4520, longitude: 77.5180, zone: 'Expressway Corridor' },
    { _id: '65e100000000000000000018', name: 'Wipro Knowledge Park IV Campus', code: 'WPR', latitude: 28.4550, longitude: 77.4850, zone: 'Knowledge Park Corridor' },
    { _id: '65e100000000000000000019', name: 'India Expo Mart & Convention Centre', code: 'IEM', latitude: 28.4600, longitude: 77.5030, zone: 'Expo Mart Corridor' },
    { _id: '65e100000000000000000020', name: 'Aqua Line Metro Depot & Sector 148', code: 'DEP', latitude: 28.4850, longitude: 77.5250, zone: 'Metro Depot Junction' },
    { _id: '65e100000000000000000021', name: 'Greater Noida Sector 62 Link', code: 'S62', latitude: 28.6255, longitude: 77.3725, zone: 'Sector 62 Transit Corridor' },
    { _id: '65e100000000000000000022', name: 'Jagat Farm Commercial Hub', code: 'JGT', latitude: 28.4792, longitude: 77.5014, zone: 'Gamma Sector' },
    { _id: '65e100000000000000000023', name: 'City Park & Alpha 2 Avenue', code: 'CPK', latitude: 28.4733, longitude: 77.5209, zone: 'Alpha Sector' },
    { _id: '65e100000000000000000024', name: 'Knowledge Park I (KP-1 Hub)', code: 'KP1', latitude: 28.4650, longitude: 77.5020, zone: 'Knowledge Park Corridor' },
    { _id: '65e100000000000000000025', name: 'Sharda University (KP-3 Campus Gate)', code: 'SHU', latitude: 28.4734, longitude: 77.4829, zone: 'Knowledge Park Corridor' },
    { _id: '65e100000000000000000026', name: 'Galgotias University (Yamuna Expressway Campus)', code: 'GLU', latitude: 28.3671, longitude: 77.5405, zone: 'Yamuna Expressway Corridor' }
  ];

  // 3. Drivers (Greater Noida operators)
  const driversData = [
    { _id: '65e200000000000000000001', name: 'Rajesh Kumar (Noida Depot)', phone: '+91 98451 22341', licenseNumber: 'UP-16-2018-8831', experienceYears: 7, safetyRating: 4.9 },
    { _id: '65e200000000000000000002', name: 'Suresh Bhati (Pari Chowk)', phone: '+91 97412 88472', licenseNumber: 'UP-16-2016-1942', experienceYears: 9, safetyRating: 4.8 },
    { _id: '65e200000000000000000003', name: 'Mohammed Irfan (Knowledge Park)', phone: '+91 99014 33921', licenseNumber: 'UP-16-2019-4821', experienceYears: 6, safetyRating: 4.7 },
    { _id: '65e200000000000000000004', name: 'Anil Sharma (Gaur City)', phone: '+91 94481 99234', licenseNumber: 'UP-16-2015-3029', experienceYears: 10, safetyRating: 5.0 },
    { _id: '65e200000000000000000005', name: 'Ramesh Gurjar (Surajpur)', phone: '+91 96112 00192', licenseNumber: 'UP-16-2020-7712', experienceYears: 5, safetyRating: 4.6 },
    { _id: '65e200000000000000000006', name: 'Vikram Singh (Kasna Hub)', phone: '+91 98860 44812', licenseNumber: 'UP-16-2017-9104', experienceYears: 8, safetyRating: 4.8 },
    { _id: '65e200000000000000000007', name: 'Manoj Nagar (Beta 2)', phone: '+91 97391 66201', licenseNumber: 'UP-16-2021-3918', experienceYears: 4, safetyRating: 4.9 },
    { _id: '65e200000000000000000008', name: 'Devendra Yadav (Ecotech)', phone: '+91 94821 77319', licenseNumber: 'UP-16-2014-6629', experienceYears: 12, safetyRating: 4.9 },
    { _id: '65e200000000000000000009', name: 'Pawan Verma (Alpha Depot)', phone: '+91 98112 34567', licenseNumber: 'UP-16-2016-5541', experienceYears: 11, safetyRating: 4.9 },
    { _id: '65e200000000000000000010', name: 'Satish Chand (KP-3 Terminal)', phone: '+91 97188 23411', licenseNumber: 'UP-16-2019-2189', experienceYears: 6, safetyRating: 4.8 },
    { _id: '65e200000000000000000011', name: 'Arun Kumar Kasana (GBU Gate)', phone: '+91 99531 88412', licenseNumber: 'UP-16-2017-7723', experienceYears: 8, safetyRating: 4.9 },
    { _id: '65e200000000000000000012', name: 'Deepak Bhati (Tech Zone 2)', phone: '+91 98711 44521', licenseNumber: 'UP-16-2020-6619', experienceYears: 5, safetyRating: 4.7 },
    { _id: '65e200000000000000000013', name: 'Rajendra Prasad (Gaur City)', phone: '+91 98102 99431', licenseNumber: 'UP-16-2015-8842', experienceYears: 13, safetyRating: 5.0 },
    { _id: '65e200000000000000000014', name: 'Mohit Rawat (Sector 148)', phone: '+91 96541 33219', licenseNumber: 'UP-16-2021-1102', experienceYears: 4, safetyRating: 4.8 },
    { _id: '65e200000000000000000015', name: 'Kuldeep Bhati (Surajpur)', phone: '+91 97115 66782', licenseNumber: 'UP-16-2018-3490', experienceYears: 7, safetyRating: 4.9 },
    { _id: '65e200000000000000000016', name: 'Sunil Chauhan (Yamuna Exp)', phone: '+91 99991 22841', licenseNumber: 'UP-16-2013-9012', experienceYears: 14, safetyRating: 5.0 }
  ];

  // 4. Greater Noida Corridors & Routes (6 routes)
  const routesData = [
    {
      _id: '65e300000000000000000001',
      name: 'KP-3 University Express (Sharda & GL Bajaj -> Pari Chowk -> Jagat Farm)',
      code: 'ROUTE-101',
      description: 'Major student corridor connecting Knowledge Park 3 universities, KP-2 Metro, Pari Chowk, Alpha 1, City Park, and Jagat Farm.',
      color: '#0284c7',
      distance: 12.5,
      estimatedTime: 28,
      frequencyMinutes: 10,
      stops: [
        { stop: '65e100000000000000000025', order: 1, scheduledMinutesFromStart: 0 },  // SHU
        { stop: '65e100000000000000000003', order: 2, scheduledMinutesFromStart: 3 },  // GLB
        { stop: '65e100000000000000000002', order: 3, scheduledMinutesFromStart: 8 },  // KP2
        { stop: '65e100000000000000000024', order: 4, scheduledMinutesFromStart: 11 }, // KP1
        { stop: '65e100000000000000000019', order: 5, scheduledMinutesFromStart: 14 }, // Expo Mart
        { stop: '65e100000000000000000001', order: 6, scheduledMinutesFromStart: 18 }, // Pari Chowk
        { stop: '65e100000000000000000006', order: 7, scheduledMinutesFromStart: 22 }, // Alpha 1
        { stop: '65e100000000000000000023', order: 8, scheduledMinutesFromStart: 25 }, // City Park
        { stop: '65e100000000000000000007', order: 9, scheduledMinutesFromStart: 28 }, // Alpha 2
        { stop: '65e100000000000000000022', order: 10, scheduledMinutesFromStart: 32 } // Jagat Farm
      ],
      buses: ['65e400000000000000000001', '65e400000000000000000002', '65e400000000000000000009', '65e400000000000000000010']
    },
    {
      _id: '65e300000000000000000002',
      name: 'Sector 62 - Greater Noida West Express (Sector 62 -> Gaur City -> Pari Chowk -> GL Bajaj)',
      code: 'ROUTE-102',
      description: 'Direct transit corridor connecting Sector 62, Greater Noida West, Surajpur, Pari Chowk, and GL Bajaj Institute.',
      color: '#059669',
      distance: 24.5,
      estimatedTime: 42,
      frequencyMinutes: 15,
      stops: [
        { stop: '65e100000000000000000021', order: 1, scheduledMinutesFromStart: 0 },  // Sector 62 Link
        { stop: '65e100000000000000000014', order: 2, scheduledMinutesFromStart: 12 }, // Gaur City
        { stop: '65e100000000000000000015', order: 3, scheduledMinutesFromStart: 20 }, // Ecotech III
        { stop: '65e100000000000000000013', order: 4, scheduledMinutesFromStart: 28 }, // Surajpur
        { stop: '65e100000000000000000001', order: 5, scheduledMinutesFromStart: 36 }, // Pari Chowk
        { stop: '65e100000000000000000003', order: 6, scheduledMinutesFromStart: 42 }  // GL Bajaj & KP3
      ],
      buses: ['65e400000000000000000003', '65e400000000000000000012']
    },
    {
      _id: '65e300000000000000000003',
      name: 'Aqua Line Metro Orbit (KP-2 Metro -> Jagat Farm -> City Park -> Delta 1)',
      code: 'ROUTE-103',
      description: 'Feeder shuttle along Greater Noida Aqua Line metro corridor and residential sectors.',
      color: '#8b5cf6',
      distance: 13.5,
      estimatedTime: 30,
      frequencyMinutes: 12,
      stops: [
        { stop: '65e100000000000000000002', order: 1, scheduledMinutesFromStart: 0 },  // KP2 Metro
        { stop: '65e100000000000000000001', order: 2, scheduledMinutesFromStart: 7 },  // Pari Chowk
        { stop: '65e100000000000000000006', order: 3, scheduledMinutesFromStart: 12 }, // Alpha 1
        { stop: '65e100000000000000000022', order: 4, scheduledMinutesFromStart: 16 }, // Jagat Farm
        { stop: '65e100000000000000000023', order: 5, scheduledMinutesFromStart: 20 }, // City Park
        { stop: '65e100000000000000000007', order: 6, scheduledMinutesFromStart: 23 }, // Alpha 2
        { stop: '65e100000000000000000008', order: 7, scheduledMinutesFromStart: 27 }, // Beta 1
        { stop: '65e100000000000000000011', order: 8, scheduledMinutesFromStart: 34 }  // Delta 1 Metro
      ],
      buses: ['65e400000000000000000004', '65e400000000000000000005', '65e400000000000000000014']
    },
    {
      _id: '65e300000000000000000004',
      name: 'Yamuna Expressway - GBU & Galgotias Campus Shuttle (Zero Point -> GBU -> Galgotias -> Kasna)',
      code: 'ROUTE-104',
      description: 'Express highway corridor catering to Gautam Buddha University, Galgotias University, Kasna terminal, and Zero Point.',
      color: '#f59e0b',
      distance: 18.2,
      estimatedTime: 35,
      frequencyMinutes: 20,
      stops: [
        { stop: '65e100000000000000000017', order: 1, scheduledMinutesFromStart: 0 },  // Zero Point
        { stop: '65e100000000000000000001', order: 2, scheduledMinutesFromStart: 8 },  // Pari Chowk
        { stop: '65e100000000000000000004', order: 3, scheduledMinutesFromStart: 18 }, // GBU
        { stop: '65e100000000000000000026', order: 4, scheduledMinutesFromStart: 26 }, // Galgotias Univ
        { stop: '65e100000000000000000016', order: 5, scheduledMinutesFromStart: 35 }  // Kasna
      ],
      buses: ['65e400000000000000000006', '65e400000000000000000011']
    },
    {
      _id: '65e300000000000000000005',
      name: 'Bennett University Tech Link (Bennett -> Wipro KP4 -> Pari Chowk)',
      code: 'ROUTE-105',
      description: 'Direct transit line connecting Bennett University in Tech Zone 2 with Knowledge Park 4 and Pari Chowk.',
      color: '#f43f5e',
      distance: 12.8,
      estimatedTime: 25,
      frequencyMinutes: 15,
      stops: [
        { stop: '65e100000000000000000005', order: 1, scheduledMinutesFromStart: 0 },  // Bennett Univ
        { stop: '65e100000000000000000018', order: 2, scheduledMinutesFromStart: 11 }, // Wipro KP4
        { stop: '65e100000000000000000002', order: 3, scheduledMinutesFromStart: 18 }, // KP2 Metro
        { stop: '65e100000000000000000001', order: 4, scheduledMinutesFromStart: 25 }  // Pari Chowk
      ],
      buses: ['65e400000000000000000007', '65e400000000000000000013', '65e400000000000000000015']
    },
    {
      _id: '65e300000000000000000006',
      name: 'Delta - Gamma Residential Shuttle (Delta 2 -> Jagat Farm -> Alpha 1 -> Pari Chowk)',
      code: 'ROUTE-106',
      description: 'Internal residential link serving Greater Noida central sectors and markets.',
      color: '#06b6d4',
      distance: 10.4,
      estimatedTime: 23,
      frequencyMinutes: 15,
      stops: [
        { stop: '65e100000000000000000012', order: 1, scheduledMinutesFromStart: 0 },  // Delta 2
        { stop: '65e100000000000000000010', order: 2, scheduledMinutesFromStart: 6 },  // Gamma 1
        { stop: '65e100000000000000000022', order: 3, scheduledMinutesFromStart: 10 }, // Jagat Farm
        { stop: '65e100000000000000000009', order: 4, scheduledMinutesFromStart: 14 }, // Beta 2
        { stop: '65e100000000000000000006', order: 5, scheduledMinutesFromStart: 18 }, // Alpha 1
        { stop: '65e100000000000000000001', order: 6, scheduledMinutesFromStart: 23 }  // Pari Chowk
      ],
      buses: ['65e400000000000000000008', '65e400000000000000000016']
    }
  ];

  // 5. Buses (16 Greater Noida multimodal transit buses: College, Government & Private)
  const busesData = [
    {
      _id: '65e400000000000000000001',
      busNumber: 'Bus 12 (KP-Express)',
      plateNumber: 'UP-16-CB-1012',
      busType: 'college',
      operatorName: 'Campus Transit Fleet',
      fare: 0,
      capacity: 50,
      currentPassengers: 28, // 56% occupancy
      currentLocation: { latitude: 28.4682, longitude: 77.5015, heading: 90, speed: 38 },
      route: '65e300000000000000000001',
      driver: '65e200000000000000000001',
      status: 'active',
      currentStopIndex: 2,
      delayMinutes: 0,
      nextStopEtaMinutes: 4,
      direction: 'outbound'
    },
    {
      _id: '65e400000000000000000002',
      busNumber: 'Bus 4 (Sharda-Galgotias)',
      plateNumber: 'UP-16-CB-1004',
      busType: 'college',
      operatorName: 'Campus Transit Fleet',
      fare: 0,
      capacity: 50,
      currentPassengers: 44, // 88% occupancy (high crowd)
      currentLocation: { latitude: 28.4720, longitude: 77.4910, heading: 180, speed: 32 },
      route: '65e300000000000000000001',
      driver: '65e200000000000000000002',
      status: 'active',
      currentStopIndex: 1,
      delayMinutes: 2,
      nextStopEtaMinutes: 3,
      direction: 'inbound'
    },
    {
      _id: '65e400000000000000000003',
      busNumber: 'UPSRTC City Bus 102 (Govt)',
      plateNumber: 'UP-16-GB-2107',
      busType: 'government',
      operatorName: 'UPSRTC City Transport',
      fare: 25,
      capacity: 50,
      currentPassengers: 22, // 44% occupancy (low crowd)
      currentLocation: { latitude: 28.5600, longitude: 77.4500, heading: 140, speed: 45 },
      route: '65e300000000000000000002',
      driver: '65e200000000000000000003',
      status: 'active',
      currentStopIndex: 2,
      delayMinutes: 3,
      nextStopEtaMinutes: 8,
      direction: 'outbound'
    },
    {
      _id: '65e400000000000000000004',
      busNumber: 'NMRC Metro Feeder 9 (Govt)',
      plateNumber: 'UP-16-GB-2109',
      busType: 'government',
      operatorName: 'NMRC Aqua Line Feeder',
      fare: 15,
      capacity: 50,
      currentPassengers: 32, // 64% occupancy (medium)
      currentLocation: { latitude: 28.4750, longitude: 77.5120, heading: 45, speed: 34 },
      route: '65e300000000000000000003',
      driver: '65e200000000000000000004',
      status: 'active',
      currentStopIndex: 2,
      delayMinutes: 0,
      nextStopEtaMinutes: 5,
      direction: 'outbound'
    },
    {
      _id: '65e400000000000000000005',
      busNumber: 'StarLine Pvt Shuttle 15',
      plateNumber: 'UP-16-PB-3015',
      busType: 'private',
      operatorName: 'StarLine Charters Pvt',
      fare: 30,
      capacity: 50,
      currentPassengers: 36, // 72% occupancy
      currentLocation: { latitude: 28.4860, longitude: 77.5050, heading: 260, speed: 28 },
      route: '65e300000000000000000003',
      driver: '65e200000000000000000005',
      status: 'active',
      currentStopIndex: 3,
      delayMinutes: 0,
      nextStopEtaMinutes: 7,
      direction: 'inbound'
    },
    {
      _id: '65e400000000000000000006',
      busNumber: 'UPSRTC Express 104 (Govt)',
      plateNumber: 'UP-16-GB-2121',
      busType: 'government',
      operatorName: 'UPSRTC Intercity Services',
      fare: 30,
      capacity: 50,
      currentPassengers: 19, // 38% occupancy (low crowd)
      currentLocation: { latitude: 28.4350, longitude: 77.5220, heading: 195, speed: 42 },
      route: '65e300000000000000000004',
      driver: '65e200000000000000000006',
      status: 'active',
      currentStopIndex: 2,
      delayMinutes: 0,
      nextStopEtaMinutes: 6,
      direction: 'outbound'
    },
    {
      _id: '65e400000000000000000007',
      busNumber: 'Bus 3 (Bennett Tech Shuttle)',
      plateNumber: 'UP-16-CB-1003',
      busType: 'college',
      operatorName: 'Campus Transit Fleet',
      fare: 0,
      capacity: 50,
      currentPassengers: 31, // 62% occupancy
      currentLocation: { latitude: 28.4530, longitude: 77.5500, heading: 280, speed: 36 },
      route: '65e300000000000000000005',
      driver: '65e200000000000000000007',
      status: 'active',
      currentStopIndex: 2,
      delayMinutes: 1,
      nextStopEtaMinutes: 5,
      direction: 'outbound'
    },
    {
      _id: '65e400000000000000000008',
      busNumber: 'CityShuttle Pvt Express 18',
      plateNumber: 'UP-16-PB-3018',
      busType: 'private',
      operatorName: 'CityShuttle Mobility Pvt Ltd',
      fare: 35,
      capacity: 50,
      currentPassengers: 24, // 48% occupancy
      currentLocation: { latitude: 28.4870, longitude: 77.5090, heading: 340, speed: 30 },
      route: '65e300000000000000000006',
      driver: '65e200000000000000000008',
      status: 'active',
      currentStopIndex: 1,
      delayMinutes: 0,
      nextStopEtaMinutes: 4,
      direction: 'outbound'
    },
    {
      _id: '65e400000000000000000009',
      busNumber: 'Bus 5 (KP3-Alpha Direct)',
      plateNumber: 'UP-16-CB-1005',
      busType: 'college',
      operatorName: 'Campus Transit Fleet',
      fare: 0,
      capacity: 52,
      currentPassengers: 20, // 38% occupancy
      currentLocation: { latitude: 28.4710, longitude: 77.4950, heading: 110, speed: 35 },
      route: '65e300000000000000000001',
      driver: '65e200000000000000000009',
      status: 'active',
      currentStopIndex: 1,
      delayMinutes: 0,
      nextStopEtaMinutes: 3,
      direction: 'outbound'
    },
    {
      _id: '65e400000000000000000010',
      busNumber: 'Bus 8 (Knowledge Park Campus Cruiser)',
      plateNumber: 'UP-16-CB-1008',
      busType: 'college',
      operatorName: 'Campus Transit Fleet',
      fare: 0,
      capacity: 48,
      currentPassengers: 35, // 73% occupancy
      currentLocation: { latitude: 28.4650, longitude: 77.5040, heading: 85, speed: 40 },
      route: '65e300000000000000000001',
      driver: '65e200000000000000000010',
      status: 'active',
      currentStopIndex: 3,
      delayMinutes: 1,
      nextStopEtaMinutes: 2,
      direction: 'inbound'
    },
    {
      _id: '65e400000000000000000011',
      busNumber: 'Bus 11 (GBU Expressway Swift)',
      plateNumber: 'UP-16-CB-1011',
      busType: 'college',
      operatorName: 'Campus Transit Fleet',
      fare: 0,
      capacity: 55,
      currentPassengers: 18, // 32% occupancy
      currentLocation: { latitude: 28.4420, longitude: 77.5300, heading: 210, speed: 44 },
      route: '65e300000000000000000004',
      driver: '65e200000000000000000011',
      status: 'active',
      currentStopIndex: 2,
      delayMinutes: 0,
      nextStopEtaMinutes: 4,
      direction: 'outbound'
    },
    {
      _id: '65e400000000000000000012',
      busNumber: 'FastTrack Pvt Shuttle 14',
      plateNumber: 'UP-16-PB-3014',
      busType: 'private',
      operatorName: 'FastTrack Commuters Pvt',
      fare: 25,
      capacity: 50,
      currentPassengers: 29, // 58% occupancy
      currentLocation: { latitude: 28.5750, longitude: 77.4410, heading: 135, speed: 42 },
      route: '65e300000000000000000002',
      driver: '65e200000000000000000012',
      status: 'active',
      currentStopIndex: 1,
      delayMinutes: 0,
      nextStopEtaMinutes: 5,
      direction: 'outbound'
    },
    {
      _id: '65e400000000000000000013',
      busNumber: 'Bus 16 (Bennett-Pari Chowk FastTrack)',
      plateNumber: 'UP-16-CB-1016',
      busType: 'college',
      operatorName: 'Campus Transit Fleet',
      fare: 0,
      capacity: 50,
      currentPassengers: 26, // 52% occupancy
      currentLocation: { latitude: 28.4590, longitude: 77.5250, heading: 275, speed: 38 },
      route: '65e300000000000000000005',
      driver: '65e200000000000000000013',
      status: 'active',
      currentStopIndex: 3,
      delayMinutes: 0,
      nextStopEtaMinutes: 4,
      direction: 'inbound'
    },
    {
      _id: '65e400000000000000000014',
      busNumber: 'NMRC Aqua Feeder 20 (Govt)',
      plateNumber: 'UP-16-GB-2120',
      busType: 'government',
      operatorName: 'NMRC Metro Feeder',
      fare: 15,
      capacity: 45,
      currentPassengers: 15, // 33% occupancy
      currentLocation: { latitude: 28.4810, longitude: 77.5150, heading: 50, speed: 32 },
      route: '65e300000000000000000003',
      driver: '65e200000000000000000014',
      status: 'active',
      currentStopIndex: 3,
      delayMinutes: 0,
      nextStopEtaMinutes: 3,
      direction: 'outbound'
    },
    {
      _id: '65e400000000000000000015',
      busNumber: 'Bus 22 (Expo Mart & Tech Zone Link)',
      plateNumber: 'UP-16-CB-1022',
      busType: 'college',
      operatorName: 'Campus Transit Fleet',
      fare: 0,
      capacity: 50,
      currentPassengers: 33, // 66% occupancy
      currentLocation: { latitude: 28.4560, longitude: 77.5600, heading: 95, speed: 36 },
      route: '65e300000000000000000005',
      driver: '65e200000000000000000015',
      status: 'active',
      currentStopIndex: 1,
      delayMinutes: 0,
      nextStopEtaMinutes: 6,
      direction: 'outbound'
    },
    {
      _id: '65e400000000000000000016',
      busNumber: 'Metro CityLink Pvt 25',
      plateNumber: 'UP-16-PB-3025',
      busType: 'private',
      operatorName: 'Metro CityLink Charters',
      fare: 20,
      capacity: 50,
      currentPassengers: 21, // 42% occupancy
      currentLocation: { latitude: 28.4910, longitude: 77.5140, heading: 320, speed: 31 },
      route: '65e300000000000000000006',
      driver: '65e200000000000000000016',
      status: 'active',
      currentStopIndex: 2,
      delayMinutes: 0,
      nextStopEtaMinutes: 4,
      direction: 'outbound'
    }
  ];

  // 6. Favorites
  const favoritesData = [
    {
      _id: '65e500000000000000000001',
      student: '65e000000000000000000001',
      itemType: 'route',
      route: '65e300000000000000000001',
      label: 'KP3 Universities to Pari Chowk'
    },
    {
      _id: '65e500000000000000000002',
      student: '65e000000000000000000001',
      itemType: 'bus',
      bus: '65e400000000000000000001',
      label: 'Bus 12 (KP-Express)'
    }
  ];

  // 7. Trips / Recent Searches in Greater Noida
  const tripsData = [
    {
      _id: '65e600000000000000000001',
      student: '65e000000000000000000001',
      source: '65e100000000000000000003', // KP3 (Sharda & Galgotias)
      destination: '65e100000000000000000001', // Pari Chowk
      bus: '65e400000000000000000001',
      route: '65e300000000000000000001',
      travelTime: 18,
      walkingDistance: 220,
      status: 'completed',
      timestamp: new Date(Date.now() - 3600000 * 2)
    },
    {
      _id: '65e600000000000000000002',
      student: '65e000000000000000000001',
      source: '65e100000000000000000014', // Gaur City
      destination: '65e100000000000000000001', // Pari Chowk
      bus: '65e400000000000000000003',
      route: '65e300000000000000000002',
      travelTime: 34,
      walkingDistance: 280,
      status: 'completed',
      timestamp: new Date(Date.now() - 86400000)
    }
  ];

  // 8. Historical Occupancy Records
  const occupancyRecordsData = [];
  const hoursList = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  for (let i = 0; i < 50; i++) {
    const bus = busesData[i % busesData.length];
    const hour = hoursList[i % hoursList.length];
    const isPeak = hour === 8 || hour === 9 || hour === 16 || hour === 17;
    const baseOcc = isPeak ? 75 + (i % 20) : 35 + (i % 30);
    const passCount = Math.round((baseOcc / 100) * bus.capacity);
    occupancyRecordsData.push({
      _id: `65e7000000000000000000${(i + 1).toString().padStart(2, '0')}`,
      bus: bus._id,
      timestamp: new Date(Date.now() - (i * 3600000)),
      passengerCount: passCount,
      occupancyPercentage: baseOcc,
      hourOfDay: hour,
      dayOfWeek: (i % 5) + 1
    });
  }

  // 9. Historical Reliability Records
  const reliabilityRecordsData = [];
  for (let i = 0; i < 60; i++) {
    const bus = busesData[i % busesData.length];
    const route = routesData[i % routesData.length];
    const isDelayed = i % 8 === 0;
    const isCancelled = i === 47;
    const delay = isDelayed ? Math.floor(4 + (i % 6)) : Math.floor(i % 3);
    reliabilityRecordsData.push({
      _id: `65e8000000000000000000${(i + 1).toString().padStart(2, '0')}`,
      bus: bus._id,
      route: route._id,
      delay,
      onTime: !isDelayed && !isCancelled,
      tripStatus: isCancelled ? 'cancelled' : isDelayed ? 'delayed' : 'on_time',
      timestamp: new Date(Date.now() - (i * 7200000))
    });
  }

  // Populate into memory store
  store.memory.users = usersData;
  store.memory.stops = stopsData;
  store.memory.drivers = driversData;
  store.memory.routes = routesData;
  store.memory.buses = busesData;
  store.memory.favorites = favoritesData;
  store.memory.trips = tripsData;
  store.memory.occupancyRecords = occupancyRecordsData;
  store.memory.reliabilityRecords = reliabilityRecordsData;

  // Persist JSON dump to server/data/seedData.json
  const dataDir = path.join(__dirname, '../server/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dumpPath = path.join(dataDir, 'seedData.json');
  fs.writeFileSync(dumpPath, JSON.stringify(store.memory, null, 2), 'utf-8');
  console.log(`[Seed] Greater Noida snapshot saved to: ${dumpPath}`);

  // Sync to MongoDB if connected
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    console.log('[Seed] Syncing Greater Noida records directly into MongoDB...');
    await Promise.all([
      User.deleteMany({}),
      Stop.deleteMany({}),
      Route.deleteMany({}),
      Bus.deleteMany({}),
      Driver.deleteMany({}),
      Favorite.deleteMany({}),
      Trip.deleteMany({}),
      OccupancyRecord.deleteMany({}),
      ReliabilityRecord.deleteMany({})
    ]);

    await User.insertMany(usersData);
    await Stop.insertMany(stopsData);
    await Driver.insertMany(driversData);
    await Route.insertMany(routesData);
    await Bus.insertMany(busesData);
    await Favorite.insertMany(favoritesData);
    await Trip.insertMany(tripsData);
    await OccupancyRecord.insertMany(occupancyRecordsData);
    await ReliabilityRecord.insertMany(reliabilityRecordsData);
    console.log('[Seed] Successfully updated MongoDB with Greater Noida network!');
  }

  console.log('==================================================');
  console.log('GREATER NOIDA TRANSIT NETWORK SEEDED SUCCESSFULLY!');
  console.log(`- Buses: ${busesData.length} active UP-16 Greater Noida buses`);
  console.log(`- Stops: ${stopsData.length} Greater Noida sectors & university hubs`);
  console.log(`- Corridors: Pari Chowk, Knowledge Park 2 & 3, GBU, Bennett, Gaur City`);
  console.log('==================================================');

  return store.memory;
}

if (require.main === module) {
  const { connectDB } = require('../server/config/db');
  require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

  connectDB().then(() => {
    seedData().then(() => {
      console.log('[Seed] Script finished.');
      process.exit(0);
    }).catch(err => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
  });
}

module.exports = seedData;
