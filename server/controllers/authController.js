const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const store = require('../services/store');
const { JWT_SECRET } = require('../middleware/auth');
const {
  sendLoginNotificationEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  configureLiveGmail,
  getEmailStatus,
  isPlaceholderEmail
} = require('../services/emailService');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      username: user.username || null,
      email: user.email || null
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

/**
 * Normal Registration: ONLY Username and Password.
 * Email is strictly NOT shown or required.
 * Normal registration creates verified 'student' accounts only.
 */
exports.register = async (req, res, next) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const cleanUsername = String(username).trim().toLowerCase();

    if (!USERNAME_REGEX.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters long and can contain only letters, numbers, underscores, and hyphens.'
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
        message: 'Passwords do not match.'
      });
    }

    // Check if username already exists
    const existingUser = await store.findUserByUsername(cleanUsername);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken. Please choose another username.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with verified status, no fabricated email, role strictly 'student'
    const user = await store.createUser({
      username: cleanUsername,
      name: cleanUsername,
      password: hashedPassword,
      role: 'student',
      authProvider: 'local',
      isActive: true,
      isVerified: true
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please sign in with your credentials.',
      username: user.username
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken. Please choose another username.'
      });
    }
    next(error);
  }
};

/**
 * Universal Login: Supports both Username and Email + Password.
 * Backward compatible with existing email-based accounts.
 */
exports.login = async (req, res, next) => {
  try {
    const rawIdentifier = (req.body.identifier || req.body.username || req.body.email || '').trim();
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your username or email, and password.'
      });
    }

    const cleanIdentifier = rawIdentifier.toLowerCase();
    const user = await store.findUserByIdentifier(cleanIdentifier);

    // Generic error message if user not found to prevent user enumeration
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Account active check
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact the campus transport desk.'
      });
    }

    // Password comparison
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Block unverified accounts (applicable only to legacy accounts with email)
    if (user.email && user.isVerified === false && user.authProvider !== 'google') {
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

    // Dispatches asynchronous login alert email ONLY if user has a verified non-placeholder email
    if (user.email && !isPlaceholderEmail(user.email)) {
      setImmediate(async () => {
        try {
          const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
          const userAgent = req.headers['user-agent'] || 'Campus Web Browser';
          await sendLoginNotificationEmail({
            toEmail: user.email,
            userName: user.name || user.username,
            loginTime: new Date(),
            ipAddress: clientIp,
            userAgent
          });
        } catch (err) {
          // Non-blocking background notification log
          console.warn('[Email Service] Background login notification error:', err.message);
        }
      });
    }

    return res.status(200).json({
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
 * Request Password Reset Link.
 * Supports email or username.
 * For username-only accounts without recovery email, returns a secure guidance message.
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const rawIdentifier = (req.body.identifier || req.body.email || req.body.username || '').trim();
    if (!rawIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered username or email address.'
      });
    }

    const cleanIdentifier = rawIdentifier.toLowerCase();
    const user = await store.findUserByIdentifier(cleanIdentifier);

    if (user) {
      const targetEmail = user.recoveryEmail || user.email;

      if (targetEmail && !isPlaceholderEmail(targetEmail)) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await store.updateUserRaw(user._id, {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires
        });

        await sendPasswordResetEmail({
          toEmail: targetEmail,
          userName: user.name || user.username,
          token: resetToken
        });

        return res.status(200).json({
          success: true,
          message: 'If an eligible account exists with this address, a password reset link has been dispatched to your email.'
        });
      } else {
        // Explicit Requirement: Username-only account or no verified recovery email attached
        return res.status(200).json({
          success: true,
          isUsernameOnly: true,
          message: 'This account does not have a verified recovery email configured. For institutional security, please contact the campus transport desk with your student or staff ID to verify identity and reset your credentials.'
        });
      }
    }

    // Generic response if user not found to prevent account enumeration
    res.status(200).json({
      success: true,
      message: 'If an account exists with these details, recovery instructions have been processed.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password with Token.
 * Also verifies account state upon successful password reset.
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
      isVerified: true, // Resetting via verified email link ensures account is verified
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
 * Google Sign-In with server-side OAuth2 verification.
 * Verifies signature, issuer, audience, and expiry.
 * Safe account handling without privilege escalation.
 */
exports.loginWithGoogle = async (req, res, next) => {
  try {
    const { credential, access_token } = req.body;

    if (!credential && !access_token) {
      return res.status(400).json({
        success: false,
        message: 'Google authentication credential or access token is required.'
      });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '73675269967-lfa9pvdffpl8gf5nfd8bm1ro6va1bmc0.apps.googleusercontent.com';

    let payload = null;

    if (credential) {
      // Cryptographically verify ID token signature, issuer, audience, and expiration using google-auth-library
      try {
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: googleClientId
        });
        payload = ticket.getPayload();
      } catch (clientErr) {
        console.warn('[Google Auth] OAuth2Client verification failed:', clientErr.message);
        // Secondary verification via Google's official tokeninfo endpoint
        try {
          const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
          if (tokenInfoRes.ok) {
            const info = await tokenInfoRes.json();
            if (info.aud === googleClientId && (info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com')) {
              payload = info;
            }
          }
        } catch (netErr) {
          console.warn('[Google Auth] tokeninfo endpoint check failed:', netErr.message);
        }
      }

      if (!payload) {
        return res.status(401).json({
          success: false,
          message: 'Google authentication credential could not be verified.'
        });
      }

      // Verify issuer & audience
      const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
      if (!validIssuers.includes(payload.iss) || payload.aud !== googleClientId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Google token issuer or audience.'
        });
      }
    } else if (access_token) {
      // Verify access token using Google's userinfo API
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` }
        });

        if (!userInfoRes.ok) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired Google access token.'
          });
        }

        const userInfo = await userInfoRes.json();
        if (userInfo.email_verified === false) {
          return res.status(401).json({
            success: false,
            message: 'Google account email is not verified.'
          });
        }

        payload = {
          email: userInfo.email,
          sub: userInfo.sub,
          name: userInfo.name || userInfo.given_name || 'Transit Commuter',
          iss: 'https://accounts.google.com',
          aud: googleClientId
        };
      } catch (accessErr) {
        console.warn('[Google Auth] Access token verification failed:', accessErr.message);
        return res.status(401).json({
          success: false,
          message: 'Google access token verification failed.'
        });
      }
    }

    const userEmail = payload?.email ? String(payload.email).trim().toLowerCase() : '';
    const googleId = payload?.sub ? String(payload.sub).trim() : '';
    const userName = payload?.name || payload?.given_name || 'Transit Commuter';

    if (!userEmail || !EMAIL_REGEX.test(userEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Google email could not be resolved from credential.'
      });
    }

    // Lookup user by Google ID or existing email
    let user = null;
    if (googleId) {
      user = await store.findUserByGoogleId(googleId);
    }
    if (!user) {
      user = await store.findUserByEmail(userEmail);
    }

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const randomPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), salt);
      const baseUsername = userEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
      const uniqueUsername = `${baseUsername || 'user'}_${Math.floor(100 + Math.random() * 900)}`;

      user = await store.createUser({
        username: uniqueUsername,
        name: userName,
        email: userEmail,
        password: randomPassword,
        authProvider: 'google',
        googleId,
        role: 'student', // Never grant admin automatically from Google Sign-In
        isActive: true,
        isVerified: true
      });
    } else {
      // Existing user: attach Google ID and ensure verified
      const updates = {};
      if (!user.googleId && googleId) updates.googleId = googleId;
      if (!user.isVerified) updates.isVerified = true;
      if (Object.keys(updates).length > 0) {
        await store.updateUserRaw(user._id, updates);
        Object.assign(user, updates);
      }
    }

    const token = generateToken(user);
    const safeUser = await store.findUserById(user._id);

    // Asynchronous notification email only if non-placeholder
    if (user.email && !isPlaceholderEmail(user.email)) {
      setImmediate(async () => {
        try {
          const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
          const userAgent = req.headers['user-agent'] || 'Campus Web Browser';
          await sendLoginNotificationEmail({
            toEmail: user.email,
            userName: user.name || user.username,
            loginTime: new Date(),
            ipAddress: clientIp,
            userAgent
          });
        } catch (err) {
          console.warn('[Email Service] Google Sign-In notification notice:', err.message);
        }
      });
    }

    return res.status(200).json({
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
