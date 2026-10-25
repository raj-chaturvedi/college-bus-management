const store = require('../services/store');

exports.getHistory = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const history = await store.getTripsByStudent(req.user._id, limit);
    res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    next(error);
  }
};
