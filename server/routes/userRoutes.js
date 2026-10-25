const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('admin'), userController.getAllUsers);
router.put('/:id/status', verifyToken, requireRole('admin'), userController.toggleUserStatus);

module.exports = router;
