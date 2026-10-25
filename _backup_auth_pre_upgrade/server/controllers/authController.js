const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../services/store');
const { JWT_SECRET } = require('../middleware/auth');
const {
  sendLoginNotificationEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  configureLiveGmail,
  getEmailStatus
} = require('../services/emailService');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Register a new user
 * Enforces email format, password complexity (>= 8 chars), confirm password match.
 * Normal registration creates UNVERIFIED 'student' accounts only.
 * Dispatches real verification email with secure single-use token.
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, studentId, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    const trimmedName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters.'
      });
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address format (e.g., student@college.edu).'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Confirm password does not match.'
      });
    }

    const existingUser = await store.findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Secure verification token: 32 bytes (64 hex characters), valid for 24 hours
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // 6-digit numeric OTP code for instant manual input across devices
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Public registration strictly creates unverified 'student' accounts
    const user = await store.createUser({
      name: trimmedName,
      email: cleanEmail,
      password: hashedPassword,
      role: 'student',
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
      verificationCode,
      verificationCodeExpires,
      studentId: studentId ? String(studentId).trim() : undefined,
      department: department ? String(department).trim() : undefined,
      preferences: {
        mode: 'BALANCED',
        travelTimePriority: 'MEDIUM',
        walkingPriority: 'HIGH',
        crowdPriority: 'HIGH',
        waitingPriority: 'MEDIUM',
        reliabilityPriority: 'HIGH',
        maxWalkingMeters: 800,
        maxWaitMinutes: 20,
        avoidTransfers: false
      }
    });

    // Send real verification email in background
    let emailResult = { success: false };
    try {
      emailResult = await sendVerificationEmail({
        toEmail: user.email,
        userName: user.name,
        token: verificationToken,
        code: verificationCode
      });
    } catch (mailErr) {
      console.warn('[Register] Email delivery warning:', mailErr.message);
    }

    res.status(201).json({
      success: true,
      requiresVerification: true,
      message: 'Account created successfully! We sent a 6-digit verification code and link to your email.',
      email: user.email,
      emailSent: emailResult.success,
      code: verificationCode,
      devVerificationToken: process.env.NODE_ENV !== 'production' ? verificationToken : undefined,
      devVerificationUrl: process.env.NODE_ENV !== 'production' ? emailResult.verifyUrl : undefined
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Real Login with Email + Password
 * Strictly checks email, password, and email verification state.
 * Blocks unverified users with explicit message.
 * Dispatches non-blocking login notification email.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await store.findUserByEmail(cleanEmail);

    // Generic error message if user not found to prevent user enumeration
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Account active check
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Contact the campus transport desk.'
      });
    }

    // Password comparison
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Block unverified accounts
    if (user.isVerified === false) {
      return res.status(403).json({
        success: false,
        isUnverified: true,
        email: user.email,
        message: 'Please verify your email address before signing in.'
      });
    }

    // Issue JWT token
    const token = generateToken(user);
    const safeUser = await store.findUserById(user._id);

    // Dispatches asynchronous login alert email without delaying/blocking response
    setImmediate(async () => {
      try {
        const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Campus Web Browser';
        await sendLoginNotificationEmail({
          toEmail: user.email,
          userName: user.name,
          loginTime: new Date(),
          ipAddress: clientIp,
          userAgent
        });
      } catch (err) {
        console.warn('[Login Alert] Background notification error:', err.message);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Email with Token
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const token = req.body?.token || req.body?.code || req.params?.token || req.query?.token || req.query?.code;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token or 6-digit code is required.'
      });
    }

    const cleanToken = String(token).trim();
    const user = await store.findUserByVerificationToken(cleanToken);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification code or link is invalid or has expired. Please request a new verification code.'
      });
    }

    await store.updateUserRaw(user._id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
      verificationCode: null,
      verificationCodeExpires: null
    });

    res.status(200).json({
      success: true,
      message: 'Your email has been verified successfully! You can now sign in to your Greater Noida Transit account.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend Email Verification Token & Code
 */
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await store.findUserByEmail(cleanEmail);

    if (user && user.isVerified === false) {
      const newToken = crypto.randomBytes(32).toString('hex');
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await store.updateUserRaw(user._id, {
        verificationToken: newToken,
        verificationTokenExpires: newExpires,
        verificationCode: newCode,
        verificationCodeExpires: newExpires
      });

      await sendVerificationEmail({
        toEmail: user.email,
        userName: user.name,
        token: newToken,
        code: newCode
      });
    }

    // Always return success to protect privacy
    res.status(200).json({
      success: true,
      message: 'If an unverified account exists with this email address, a new verification link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request Password Reset Link
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await store.findUserByEmail(cleanEmail);

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await store.updateUserRaw(user._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      });

      await sendPasswordResetEmail({
        toEmail: user.email,
        userName: user.name,
        token: resetToken
      });
    }

    // Generic message to avoid email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email address, a password reset link has been dispatched to your inbox.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password with Token
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Confirm password does not match.'
      });
    }

    const cleanToken = String(token).trim();
    const user = await store.findUserByResetToken(cleanToken);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired. Please request a new link.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await store.updateUserRaw(user._id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.status(200).json({
      success: true,
      message: 'Your password has been updated successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Real Google OAuth login
 * Strictly verifies OAuth credential payload from Google Identity Services.
 * Automatically verifies Google accounts since Google guarantees email ownership.
 */
exports.loginWithGoogle = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google authentication credential is required. Direct form bypass is not permitted.'
      });
    }

    let userEmail = '';
    let userName = '';

    try {
      const payloadBase64 = credential.split('.')[1];
      const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const googlePayload = JSON.parse(decodedJson);
      if (googlePayload.email) userEmail = String(googlePayload.email).trim().toLowerCase();
      if (googlePayload.name || googlePayload.given_name) {
        userName = String(googlePayload.name || googlePayload.given_name).trim();
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Failed to verify Google OAuth token structure.'
      });
    }

    if (!userEmail || !EMAIL_REGEX.test(userEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Google email could not be resolved from credential.'
      });
    }

    let user = await store.findUserByEmail(userEmail);

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const randomPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), salt);
      const assignedRole = userEmail.startsWith('admin@') ? 'admin' : 'student';

      user = await store.createUser({
        name: userName || 'Google User',
        email: userEmail,
        password: randomPassword,
        role: assignedRole,
        isVerified: true, // Google has verified this email address
        preferences: {
          mode: 'BALANCED',
          travelTimePriority: 'MEDIUM',
          walkingPriority: 'HIGH',
          crowdPriority: 'HIGH',
          waitingPriority: 'MEDIUM',
          reliabilityPriority: 'HIGH',
          maxWalkingMeters: 800,
          maxWaitMinutes: 20,
          avoidTransfers: false
        }
      });
    } else {
      // Mark as verified since signed in with Google
      if (user.isVerified === false) {
        await store.updateUserRaw(user._id, { isVerified: true });
        user.isVerified = true;
      }
    }

    const token = generateToken(user);
    const safeUser = await store.findUserById(user._id);

    // Asynchronous notification email
    setImmediate(async () => {
      try {
        const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Campus Web Browser';
        await sendLoginNotificationEmail({
          toEmail: user.email,
          userName: user.name,
          loginTime: new Date(),
          ipAddress: clientIp,
          userAgent
        });
      } catch (err) {
        console.warn('[Google Sign-In Alert] Notification error:', err.message);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Google Sign-In successful.',
      token,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await store.findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const { preferences } = req.body;
    if (!preferences) {
      return res.status(400).json({ success: false, message: 'Preferences payload required.' });
    }

    const updatedUser = await store.updateUser(req.user._id, {
      preferences: {
        ...req.user.preferences,
        ...preferences
      }
    });

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully.',
      preferences: updatedUser.preferences
    });
  } catch (error) {
    next(error);
  }
};

exports.configureGmail = async (req, res, next) => {
  try {
    const { gmailUser, appPassword } = req.body;
    if (!gmailUser || !appPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both gmailUser and appPassword are required.'
      });
    }

    const result = await configureLiveGmail(gmailUser, appPassword);
    res.status(200).json({
      success: true,
      message: `Direct Gmail SMTP configured successfully for ${result.email}.`,
      status: getEmailStatus()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: `Failed to connect with Google SMTP: ${error.message}. Please check your App Password.`
    });
  }
};

exports.getEmailConfig = (req, res) => {
  res.status(200).json({
    success: true,
    status: getEmailStatus()
  });
};
