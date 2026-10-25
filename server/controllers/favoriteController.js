const store = require('../services/store');

exports.getFavorites = async (req, res, next) => {
  try {
    const favorites = await store.getFavoritesByStudent(req.user._id);
    res.status(200).json({
      success: true,
      count: favorites.length,
      favorites
    });
  } catch (error) {
    next(error);
  }
};

exports.addFavorite = async (req, res, next) => {
  try {
    const { itemType, routeId, busId, destinationStopId, label } = req.body;

    const favorite = await store.createFavorite({
      student: req.user._id,
      itemType: itemType || 'route',
      route: routeId || null,
      bus: busId || null,
      destinationStop: destinationStopId || null,
      label: label || 'Saved Favorite'
    });

    res.status(201).json({
      success: true,
      message: 'Added to favorites.',
      favorite
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteFavorite = async (req, res, next) => {
  try {
    const removed = await store.deleteFavorite(req.params.id, req.user._id);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Favorite not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Favorite removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};
