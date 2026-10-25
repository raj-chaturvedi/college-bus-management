const store = require('../services/store');

exports.getAllRoutes = async (req, res, next) => {
  try {
    const routes = await store.getAllRoutes();
    res.status(200).json({
      success: true,
      count: routes.length,
      routes
    });
  } catch (error) {
    next(error);
  }
};

exports.getRouteById = async (req, res, next) => {
  try {
    const route = await store.getRouteById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }
    res.status(200).json({
      success: true,
      route
    });
  } catch (error) {
    next(error);
  }
};

exports.createRoute = async (req, res, next) => {
  try {
    const { name, code, description, color, stops, distance, estimatedTime, frequencyMinutes } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and route code are required.' });
    }

    const newRoute = await store.createRoute({
      name,
      code: code.toUpperCase(),
      description: description || '',
      color: color || '#0c87eb',
      stops: stops || [],
      distance: distance ? Number(distance) : 12,
      estimatedTime: estimatedTime ? Number(estimatedTime) : 35,
      frequencyMinutes: frequencyMinutes ? Number(frequencyMinutes) : 15
    });

    res.status(201).json({
      success: true,
      message: 'Route created successfully.',
      route: newRoute
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRoute = async (req, res, next) => {
  try {
    const updated = await store.updateRoute(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Route updated successfully.',
      route: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteRoute = async (req, res, next) => {
  try {
    const deleted = await store.deleteRoute(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Route deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
