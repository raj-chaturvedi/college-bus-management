const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public authentication endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.loginWithGoogle);

// Email verification endpoints
router.post('/verify-email', authController.verifyEmail);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Password recovery endpoints
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Configuration & profile endpoints
router.post('/configure-gmail', authController.configureGmail);
router.get('/email-status', authController.getEmailConfig);
router.get('/me', verifyToken, authController.getMe);
router.put('/preferences', verifyToken, authController.updatePreferences);

module.exports = router;
