const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const {
  registerLimiter,
  loginLimiter,
  verifyEmailLimiter,
  resendVerificationLimiter,
  passwordResetLimiter
} = require('../middleware/rateLimiter');

// Public authentication endpoints with rate limits
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/google', loginLimiter, authController.loginWithGoogle);

// Email verification endpoints with rate limits
router.post('/verify-email', verifyEmailLimiter, authController.verifyEmail);
router.get('/verify-email/:token', verifyEmailLimiter, authController.verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, authController.resendVerification);

// Password recovery endpoints with rate limits
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, authController.resetPassword);

// Configuration & profile endpoints
router.post('/configure-gmail', authController.configureGmail);
router.get('/email-status', authController.getEmailConfig);
router.get('/me', verifyToken, authController.getMe);
router.put('/preferences', verifyToken, authController.updatePreferences);

module.exports = router;

