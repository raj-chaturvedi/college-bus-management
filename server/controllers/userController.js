const store = require('../services/store');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await store.getAllUsers();
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await store.findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updated = await store.updateUser(req.params.id, {
      isActive: req.body.isActive !== undefined ? req.body.isActive : !user.isActive
    });

    res.status(200).json({
      success: true,
      message: `User ${updated.isActive ? 'activated' : 'deactivated'} successfully.`,
      user: updated
    });
  } catch (error) {
    next(error);
  }
};
