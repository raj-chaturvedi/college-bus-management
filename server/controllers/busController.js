const store = require('../services/store');

exports.getAllBuses = async (req, res, next) => {
  try {
    const buses = await store.getAllBuses();
    res.status(200).json({
      success: true,
      count: buses.length,
      buses
    });
  } catch (error) {
    next(error);
  }
};

exports.getLiveBuses = async (req, res, next) => {
  try {
    const buses = await store.getAllBuses();
    const liveTelemetry = buses.map(b => ({
      id: b._id,
      busNumber: b.busNumber,
      plateNumber: b.plateNumber,
      status: b.status,
      currentLocation: b.currentLocation,
      capacity: b.capacity,
      currentPassengers: b.currentPassengers,
      occupancyPercentage: b.occupancyPercentage,
      crowdLevel: b.crowdLevel,
      route: b.route,
      driver: b.driver,
      direction: b.direction,
      currentStopIndex: b.currentStopIndex,
      nextStopEtaMinutes: b.nextStopEtaMinutes,
      delayMinutes: b.delayMinutes,
      speed: b.currentLocation?.speed || 30,
      heading: b.currentLocation?.heading || 0
    }));

    res.status(200).json({
      success: true,
      timestamp: new Date(),
      count: liveTelemetry.length,
      buses: liveTelemetry
    });
  } catch (error) {
    next(error);
  }
};

exports.getBusById = async (req, res, next) => {
  try {
    const bus = await store.getBusById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found.' });
    }
    res.status(200).json({
      success: true,
      bus
    });
  } catch (error) {
    next(error);
  }
};

exports.createBus = async (req, res, next) => {
  try {
    const { busNumber, plateNumber, capacity, route, driver, status } = req.body;

    if (!busNumber) {
      return res.status(400).json({ success: false, message: 'Bus number is required.' });
    }

    // Default coordinates around Greater Noida Central Hub (Pari Chowk)
    const defaultCoords = {
      latitude: 28.4682 + (Math.random() - 0.5) * 0.02,
      longitude: 77.5098 + (Math.random() - 0.5) * 0.02,
      heading: 90,
      speed: 30
    };

    const newBus = await store.createBus({
      busNumber: busNumber.toUpperCase(),
      plateNumber: plateNumber || `UP-16-CB-${Math.floor(1000 + Math.random() * 9000)}`,
      capacity: capacity ? Number(capacity) : 50,
      currentPassengers: 0,
      currentLocation: req.body.currentLocation || defaultCoords,
      route: route || null,
      driver: driver || null,
      status: status || 'active'
    });

    // If driver assigned, update driver
    if (driver) {
      await store.updateDriver(driver, { assignedBus: newBus._id });
    }

    res.status(201).json({
      success: true,
      message: 'Bus created successfully.',
      bus: newBus
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBus = async (req, res, next) => {
  try {
    const updated = await store.updateBus(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Bus not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Bus updated successfully.',
      bus: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOccupancy = async (req, res, next) => {
  try {
    const { currentPassengers, capacity } = req.body;
    const bus = await store.getBusById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found.' });
    }

    const newCapacity = capacity ? Number(capacity) : bus.capacity;
    const newPassengers = Math.min(newCapacity, Math.max(0, Number(currentPassengers)));
    const occPercentage = Math.round((newPassengers / newCapacity) * 100);

    const updated = await store.updateBus(req.params.id, {
      capacity: newCapacity,
      currentPassengers: newPassengers
    });

    // Record historical occupancy for analytics & prediction
    const now = new Date();
    await store.addOccupancyRecord({
      bus: bus._id,
      timestamp: now,
      passengerCount: newPassengers,
      occupancyPercentage: occPercentage,
      hourOfDay: now.getHours(),
      dayOfWeek: now.getDay()
    });

    res.status(200).json({
      success: true,
      message: 'Occupancy updated successfully.',
      bus: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBus = async (req, res, next) => {
  try {
    const deleted = await store.deleteBus(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Bus not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
