const { getSmartAlertsForUser } = require('../services/alertService');

exports.getAlerts = async (req, res, next) => {
  try {
    const alerts = await getSmartAlertsForUser(req.user);
    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    next(error);
  }
};
