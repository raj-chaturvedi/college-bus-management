const { calculateRecommendations } = require('../services/recommendationService');
const store = require('../services/store');

exports.getRecommendations = async (req, res, next) => {
  try {
    const { sourceStopId, destinationStopId, mode, preferences } = req.body;

    if (!sourceStopId || !destinationStopId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both sourceStopId and destinationStopId.'
      });
    }

    const userPrefs = preferences || (req.user ? req.user.preferences : null);

    const result = await calculateRecommendations(sourceStopId, destinationStopId, {
      mode: mode || (userPrefs ? userPrefs.mode : 'BALANCED'),
      userPreferences: userPrefs
    });

    // If user is authenticated, log search into trips history
    if (req.user && result.bestMatch) {
      store.createTrip({
        student: req.user._id,
        source: sourceStopId,
        destination: destinationStopId,
        bus: result.bestMatch.bus?.id || null,
        route: result.bestMatch.route?.id || null,
        travelTime: result.bestMatch.metrics.travelTimeMinutes,
        walkingDistance: result.bestMatch.metrics.walkingMeters,
        status: 'searched'
      }).catch(err => console.error('Failed to log search trip:', err.message));
    }

    res.status(200).json({
      success: true,
      recommendation: result
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('cannot be the same')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};
