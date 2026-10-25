const store = require('../services/store');

exports.getAllStops = async (req, res, next) => {
  try {
    const stops = await store.getAllStops();
    res.status(200).json({
      success: true,
      count: stops.length,
      stops
    });
  } catch (error) {
    next(error);
  }
};

exports.createStop = async (req, res, next) => {
  try {
    const { name, code, latitude, longitude, zone } = req.body;

    if (!name || !code || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, latitude, and longitude are required.'
      });
    }

    const newStop = await store.createStop({
      name,
      code: code.toUpperCase(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      zone: zone || 'Central Hub'
    });

    res.status(201).json({
      success: true,
      message: 'Bus stop created successfully.',
      stop: newStop
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStop = async (req, res, next) => {
  try {
    const updated = await store.updateStop(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Stop not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Bus stop updated successfully.',
      stop: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteStop = async (req, res, next) => {
  try {
    const deleted = await store.deleteStop(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Stop not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Bus stop deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
