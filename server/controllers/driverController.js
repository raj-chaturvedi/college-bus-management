const store = require('../services/store');

exports.getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await store.getAllDrivers();
    res.status(200).json({
      success: true,
      count: drivers.length,
      drivers
    });
  } catch (error) {
    next(error);
  }
};

exports.getDriverById = async (req, res, next) => {
  try {
    const driver = await store.getDriverById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }
    res.status(200).json({
      success: true,
      driver
    });
  } catch (error) {
    next(error);
  }
};

exports.createDriver = async (req, res, next) => {
  try {
    const { name, phone, licenseNumber, assignedBus, experienceYears, safetyRating } = req.body;

    if (!name || !phone || !licenseNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number, and license number are required.'
      });
    }

    const newDriver = await store.createDriver({
      name,
      phone,
      licenseNumber: licenseNumber.toUpperCase(),
      assignedBus: assignedBus || null,
      experienceYears: experienceYears ? Number(experienceYears) : 4,
      safetyRating: safetyRating ? Number(safetyRating) : 4.8
    });

    if (assignedBus) {
      await store.updateBus(assignedBus, { driver: newDriver._id });
    }

    res.status(201).json({
      success: true,
      message: 'Driver created successfully.',
      driver: newDriver
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDriver = async (req, res, next) => {
  try {
    const updated = await store.updateDriver(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Driver updated successfully.',
      driver: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDriver = async (req, res, next) => {
  try {
    const deleted = await store.deleteDriver(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Driver deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
