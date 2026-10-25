const { getDbStatus } = require('../config/db');
const User = require('../models/User');
const Stop = require('../models/Stop');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Favorite = require('../models/Favorite');
const OccupancyRecord = require('../models/OccupancyRecord');
const ReliabilityRecord = require('../models/ReliabilityRecord');
const Pass = require('../models/Pass');
const Incident = require('../models/Incident');

// Memory store fallback collections
const memoryStore = {
  users: [],
  stops: [],
  routes: [],
  buses: [],
  drivers: [],
  trips: [],
  favorites: [],
  occupancyRecords: [],
  reliabilityRecords: [],
  passes: [],
  incidents: []
};

// Generate mock ObjectId-compatible string
const generateId = () => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const random = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16));
  return (timestamp + random).substring(0, 24);
};

const store = {
  memory: memoryStore,
  generateId,

  // Users
  async findUserByEmail(email) {
    if (getDbStatus().isConnected) {
      return await User.findOne({ email: email.toLowerCase() });
    }
    return memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id) {
    if (getDbStatus().isConnected) {
      return await User.findById(id).select('-password');
    }
    const user = memoryStore.users.find(u => u._id.toString() === id.toString());
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async createUser(userData) {
    if (getDbStatus().isConnected) {
      const user = new User(userData);
      return await user.save();
    }
    const newUser = {
      _id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      favoriteRoutes: [],
      favoriteBuses: [],
      preferences: {
        mode: 'BALANCED',
        travelTimePriority: 'MEDIUM',
        walkingPriority: 'HIGH',
        crowdPriority: 'HIGH',
        waitingPriority: 'MEDIUM',
        reliabilityPriority: 'HIGH',
        maxWalkingMeters: 800,
        maxWaitMinutes: 20,
        avoidTransfers: false
      },
      ...userData
    };
    memoryStore.users.push(newUser);
    return newUser;
  },

  async updateUser(id, updateData) {
    if (getDbStatus().isConnected) {
      return await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    }
    const idx = memoryStore.users.findIndex(u => u._id.toString() === id.toString());
    if (idx === -1) return null;
    memoryStore.users[idx] = {
      ...memoryStore.users[idx],
      ...updateData,
      updatedAt: new Date()
    };
    const { password, ...safeUser } = memoryStore.users[idx];
    return safeUser;
  },

  async findUserByVerificationToken(tokenOrCode) {
    const val = String(tokenOrCode).trim();
    if (getDbStatus().isConnected) {
      return await User.findOne({
        $or: [
          { verificationToken: val, verificationTokenExpires: { $gt: new Date() } },
          { verificationCode: val, verificationCodeExpires: { $gt: new Date() } }
        ]
      });
    }
    return memoryStore.users.find(u =>
      (
        (u.verificationToken === val && (!u.verificationTokenExpires || new Date(u.verificationTokenExpires) > new Date())) ||
        (u.verificationCode === val && (!u.verificationCodeExpires || new Date(u.verificationCodeExpires) > new Date()))
      )
    ) || null;
  },

  async findUserByResetToken(token) {
    if (getDbStatus().isConnected) {
      return await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });
    }
    return memoryStore.users.find(u =>
      u.resetPasswordToken === token &&
      (!u.resetPasswordExpires || new Date(u.resetPasswordExpires) > new Date())
    ) || null;
  },

  async updateUserRaw(id, updateData) {
    if (getDbStatus().isConnected) {
      return await User.findByIdAndUpdate(id, updateData, { new: true });
    }
    const idx = memoryStore.users.findIndex(u => u._id.toString() === id.toString());
    if (idx === -1) return null;
    memoryStore.users[idx] = {
      ...memoryStore.users[idx],
      ...updateData,
      updatedAt: new Date()
    };
    return memoryStore.users[idx];
  },

  async getAllUsers() {
    if (getDbStatus().isConnected) {
      return await User.find().select('-password');
    }
    return memoryStore.users.map(({ password, ...u }) => u);
  },

  // Stops
  async getAllStops() {
    if (getDbStatus().isConnected) {
      return await Stop.find({ isActive: true }).sort({ name: 1 });
    }
    return [...memoryStore.stops.filter(s => s.isActive !== false)].sort((a, b) => a.name.localeCompare(b.name));
  },

  async getStopById(id) {
    if (getDbStatus().isConnected) {
      return await Stop.findById(id);
    }
    return memoryStore.stops.find(s => s._id.toString() === id.toString()) || null;
  },

  async createStop(data) {
    if (getDbStatus().isConnected) {
      const stop = new Stop(data);
      return await stop.save();
    }
    const stop = { _id: generateId(), isActive: true, createdAt: new Date(), ...data };
    memoryStore.stops.push(stop);
    return stop;
  },

  async updateStop(id, data) {
    if (getDbStatus().isConnected) {
      return await Stop.findByIdAndUpdate(id, data, { new: true });
    }
    const idx = memoryStore.stops.findIndex(s => s._id.toString() === id.toString());
    if (idx === -1) return null;
    memoryStore.stops[idx] = { ...memoryStore.stops[idx], ...data, updatedAt: new Date() };
    return memoryStore.stops[idx];
  },

  async deleteStop(id) {
    if (getDbStatus().isConnected) {
      return await Stop.findByIdAndDelete(id);
    }
    const idx = memoryStore.stops.findIndex(s => s._id.toString() === id.toString());
    if (idx === -1) return null;
    return memoryStore.stops.splice(idx, 1)[0];
  },

  // Routes
  async getAllRoutes() {
    if (getDbStatus().isConnected) {
      return await Route.find({ isActive: true })
        .populate('stops.stop')
        .populate('buses');
    }
    return memoryStore.routes.map(r => ({
      ...r,
      stops: r.stops.map(st => {
        const stopObj = memoryStore.stops.find(s => s._id.toString() === (st.stop?._id || st.stop).toString());
        return { ...st, stop: stopObj || st.stop };
      }),
      buses: (r.buses || []).map(bId => {
        const busObj = memoryStore.buses.find(b => b._id.toString() === (bId?._id || bId).toString());
        return busObj || bId;
      })
    }));
  },

  async getRouteById(id) {
    if (getDbStatus().isConnected) {
      return await Route.findById(id).populate('stops.stop').populate('buses');
    }
    const r = memoryStore.routes.find(route => route._id.toString() === id.toString());
    if (!r) return null;
    return {
      ...r,
      stops: r.stops.map(st => {
        const stopObj = memoryStore.stops.find(s => s._id.toString() === (st.stop?._id || st.stop).toString());
        return { ...st, stop: stopObj || st.stop };
      }),
      buses: (r.buses || []).map(bId => {
        return memoryStore.buses.find(b => b._id.toString() === (bId?._id || bId).toString()) || bId;
      })
    };
  },

  async createRoute(data) {
    if (getDbStatus().isConnected) {
      const route = new Route(data);
      return await route.save();
    }
    const route = { _id: generateId(), isActive: true, buses: [], createdAt: new Date(), ...data };
    memoryStore.routes.push(route);
    return route;
  },

  async updateRoute(id, data) {
    if (getDbStatus().isConnected) {
      return await Route.findByIdAndUpdate(id, data, { new: true }).populate('stops.stop').populate('buses');
    }
    const idx = memoryStore.routes.findIndex(r => r._id.toString() === id.toString());
    if (idx === -1) return null;
    memoryStore.routes[idx] = { ...memoryStore.routes[idx], ...data, updatedAt: new Date() };
    return this.getRouteById(id);
  },

  async deleteRoute(id) {
    if (getDbStatus().isConnected) {
      return await Route.findByIdAndDelete(id);
    }
    const idx = memoryStore.routes.findIndex(r => r._id.toString() === id.toString());
    if (idx === -1) return null;
    return memoryStore.routes.splice(idx, 1)[0];
  },

  // Buses
  async getAllBuses() {
    if (getDbStatus().isConnected) {
      return await Bus.find()
        .populate('route')
        .populate('driver');
    }
    return memoryStore.buses.map(b => {
      const routeObj = memoryStore.routes.find(r => r._id.toString() === (b.route?._id || b.route || '').toString());
      const driverObj = memoryStore.drivers.find(d => d._id.toString() === (b.driver?._id || b.driver || '').toString());
      const occPercent = Math.min(100, Math.round(((b.currentPassengers || 0) / (b.capacity || 50)) * 100));
      const crowd = occPercent < 50 ? 'LOW' : occPercent <= 80 ? 'MEDIUM' : 'HIGH';
      return {
        ...b,
        route: routeObj || b.route,
        driver: driverObj || b.driver,
        occupancyPercentage: occPercent,
        crowdLevel: crowd
      };
    });
  },

  async getBusById(id) {
    if (getDbStatus().isConnected) {
      return await Bus.findById(id).populate('route').populate('driver');
    }
    const b = memoryStore.buses.find(bus => bus._id.toString() === id.toString());
    if (!b) return null;
    const routeObj = memoryStore.routes.find(r => r._id.toString() === (b.route?._id || b.route || '').toString());
    const driverObj = memoryStore.drivers.find(d => d._id.toString() === (b.driver?._id || b.driver || '').toString());
    const occPercent = Math.min(100, Math.round(((b.currentPassengers || 0) / (b.capacity || 50)) * 100));
    return {
      ...b,
      route: routeObj || b.route,
      driver: driverObj || b.driver,
      occupancyPercentage: occPercent,
      crowdLevel: occPercent < 50 ? 'LOW' : occPercent <= 80 ? 'MEDIUM' : 'HIGH'
    };
  },

  async createBus(data) {
    if (getDbStatus().isConnected) {
      const bus = new Bus(data);
      return await bus.save();
    }
    const bus = {
      _id: generateId(),
      status: 'active',
      currentPassengers: 0,
      currentStopIndex: 0,
      delayMinutes: 0,
      nextStopEtaMinutes: 5,
      direction: 'outbound',
      createdAt: new Date(),
      ...data
    };
    memoryStore.buses.push(bus);
    return bus;
  },

  async updateBus(id, data) {
    if (getDbStatus().isConnected) {
      return await Bus.findByIdAndUpdate(id, data, { new: true }).populate('route').populate('driver');
    }
    const idx = memoryStore.buses.findIndex(b => b._id.toString() === id.toString());
    if (idx === -1) return null;
    memoryStore.buses[idx] = { ...memoryStore.buses[idx], ...data, updatedAt: new Date() };
    return this.getBusById(id);
  },

  async deleteBus(id) {
    if (getDbStatus().isConnected) {
      return await Bus.findByIdAndDelete(id);
    }
    const idx = memoryStore.buses.findIndex(b => b._id.toString() === id.toString());
    if (idx === -1) return null;
    return memoryStore.buses.splice(idx, 1)[0];
  },

  // Drivers
  async getAllDrivers() {
    if (getDbStatus().isConnected) {
      return await Driver.find().populate('assignedBus');
    }
    return memoryStore.drivers.map(d => {
      const bus = memoryStore.buses.find(b => b._id.toString() === (d.assignedBus?._id || d.assignedBus || '').toString());
      return { ...d, assignedBus: bus || d.assignedBus };
    });
  },

  async getDriverById(id) {
    if (getDbStatus().isConnected) {
      return await Driver.findById(id).populate('assignedBus');
    }
    const d = memoryStore.drivers.find(driver => driver._id.toString() === id.toString());
    if (!d) return null;
    const bus = memoryStore.buses.find(b => b._id.toString() === (d.assignedBus?._id || d.assignedBus || '').toString());
    return { ...d, assignedBus: bus || d.assignedBus };
  },

  async createDriver(data) {
    if (getDbStatus().isConnected) {
      const driver = new Driver(data);
      return await driver.save();
    }
    const driver = { _id: generateId(), createdAt: new Date(), ...data };
    memoryStore.drivers.push(driver);
    return driver;
  },

  async updateDriver(id, data) {
    if (getDbStatus().isConnected) {
      return await Driver.findByIdAndUpdate(id, data, { new: true }).populate('assignedBus');
    }
    const idx = memoryStore.drivers.findIndex(d => d._id.toString() === id.toString());
    if (idx === -1) return null;
    memoryStore.drivers[idx] = { ...memoryStore.drivers[idx], ...data, updatedAt: new Date() };
    return this.getDriverById(id);
  },

  async deleteDriver(id) {
    if (getDbStatus().isConnected) {
      return await Driver.findByIdAndDelete(id);
    }
    const idx = memoryStore.drivers.findIndex(d => d._id.toString() === id.toString());
    if (idx === -1) return null;
    return memoryStore.drivers.splice(idx, 1)[0];
  },

  // Favorites
  async getFavoritesByStudent(studentId) {
    if (getDbStatus().isConnected) {
      return await Favorite.find({ student: studentId })
        .populate('route')
        .populate('bus')
        .populate('destinationStop');
    }
    return memoryStore.favorites
      .filter(f => f.student.toString() === studentId.toString())
      .map(f => {
        const route = memoryStore.routes.find(r => r._id.toString() === (f.route?._id || f.route || '').toString());
        const bus = memoryStore.buses.find(b => b._id.toString() === (f.bus?._id || f.bus || '').toString());
        const dest = memoryStore.stops.find(s => s._id.toString() === (f.destinationStop?._id || f.destinationStop || '').toString());
        return { ...f, route, bus, destinationStop: dest };
      });
  },

  async createFavorite(data) {
    if (getDbStatus().isConnected) {
      const fav = new Favorite(data);
      return await fav.save();
    }
    const fav = { _id: generateId(), createdAt: new Date(), ...data };
    memoryStore.favorites.push(fav);
    return fav;
  },

  async deleteFavorite(id, studentId) {
    if (getDbStatus().isConnected) {
      return await Favorite.findOneAndDelete({ _id: id, student: studentId });
    }
    const idx = memoryStore.favorites.findIndex(f => f._id.toString() === id.toString() && f.student.toString() === studentId.toString());
    if (idx === -1) return null;
    return memoryStore.favorites.splice(idx, 1)[0];
  },

  // Trips / Search History
  async getTripsByStudent(studentId, limit = 10) {
    if (getDbStatus().isConnected) {
      return await Trip.find({ student: studentId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('source')
        .populate('destination')
        .populate('bus')
        .populate('route');
    }
    return memoryStore.trips
      .filter(t => t.student.toString() === studentId.toString())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
      .map(t => {
        const source = memoryStore.stops.find(s => s._id.toString() === (t.source?._id || t.source || '').toString());
        const destination = memoryStore.stops.find(s => s._id.toString() === (t.destination?._id || t.destination || '').toString());
        const bus = memoryStore.buses.find(b => b._id.toString() === (t.bus?._id || t.bus || '').toString());
        const route = memoryStore.routes.find(r => r._id.toString() === (t.route?._id || t.route || '').toString());
        return { ...t, source, destination, bus, route };
      });
  },

  async createTrip(data) {
    if (getDbStatus().isConnected) {
      const trip = new Trip(data);
      return await trip.save();
    }
    const trip = { _id: generateId(), timestamp: new Date(), ...data };
    memoryStore.trips.push(trip);
    return trip;
  },

  // Occupancy & Reliability Records
  async getOccupancyRecords() {
    if (getDbStatus().isConnected) {
      return await OccupancyRecord.find().populate('bus');
    }
    return memoryStore.occupancyRecords;
  },

  async addOccupancyRecord(data) {
    if (getDbStatus().isConnected) {
      const rec = new OccupancyRecord(data);
      return await rec.save();
    }
    const rec = { _id: generateId(), timestamp: new Date(), ...data };
    memoryStore.occupancyRecords.push(rec);
    return rec;
  },

  async getReliabilityRecords() {
    if (getDbStatus().isConnected) {
      return await ReliabilityRecord.find().populate('bus').populate('route');
    }
    return memoryStore.reliabilityRecords;
  },

  async addReliabilityRecord(data) {
    if (getDbStatus().isConnected) {
      const rec = new ReliabilityRecord(data);
      return await rec.save();
    }
    const rec = { _id: generateId(), timestamp: new Date(), ...data };
    memoryStore.reliabilityRecords.push(rec);
    return rec;
  },

  // Digital Bus Passes
  async createPass(data) {
    if (getDbStatus().isConnected) {
      const pass = new Pass(data);
      return await pass.save();
    }
    const pass = {
      _id: generateId(),
      createdAt: new Date(),
      status: 'active',
      ...data
    };
    memoryStore.passes.push(pass);
    return pass;
  },

  async getPassesByStudent(studentId) {
    if (getDbStatus().isConnected) {
      return await Pass.find({ student: studentId }).sort({ createdAt: -1 });
    }
    return memoryStore.passes
      .filter(p => p.student.toString() === studentId.toString())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getPassByCode(passCode) {
    if (getDbStatus().isConnected) {
      return await Pass.findOne({ passCode });
    }
    return memoryStore.passes.find(p => p.passCode === passCode || p.tokenHash === passCode || String(p._id) === passCode) || null;
  },

  async updatePassStatus(passCode, status, extra = {}) {
    if (getDbStatus().isConnected) {
      return await Pass.findOneAndUpdate(
        { $or: [{ passCode }, { tokenHash: passCode }] },
        { status, ...extra },
        { new: true }
      );
    }
    const pass = memoryStore.passes.find(p => p.passCode === passCode || p.tokenHash === passCode || String(p._id) === passCode);
    if (pass) {
      pass.status = status;
      Object.assign(pass, extra);
    }
    return pass || null;
  },

  // Incident & Traffic Reports
  async createIncident(data) {
    if (getDbStatus().isConnected) {
      const inc = new Incident(data);
      return await inc.save();
    }
    const inc = {
      _id: generateId(),
      createdAt: new Date(),
      status: 'open',
      ...data
    };
    memoryStore.incidents.push(inc);
    return inc;
  },

  async getAllIncidents() {
    if (getDbStatus().isConnected) {
      return await Incident.find().sort({ createdAt: -1 });
    }
    return [...memoryStore.incidents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Aliases for convenience
  async getBuses() {
    return this.getAllBuses();
  },
  async getStops() {
    return this.getAllStops();
  },
  async getRoutes() {
    return this.getAllRoutes();
  },
  async getIncidents() {
    return this.getAllIncidents();
  }
};

module.exports = store;
