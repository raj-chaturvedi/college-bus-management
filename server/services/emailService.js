const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');

let transporter = null;
let currentMode = 'INITIALIZING';

const DEFAULT_GMAIL_USER = 'rajchaturvedi215@gmail.com';
const DEFAULT_GMAIL_PASS = 'hhuoctvwhhqfygsb';

const getGmailUser = () => process.env.GMAIL_USER || process.env.SMTP_USER || DEFAULT_GMAIL_USER;
const getGmailPass = () => (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || DEFAULT_GMAIL_PASS).replace(/\s+/g, '');
const getClientUrl = () => process.env.CLIENT_URL || 'https://college-bus-management-etd3.vercel.app';

/**
 * Configure email transporter
 * Supports:
 * 1. Direct Gmail SMTP via GMAIL_USER + GMAIL_APP_PASSWORD (or SMTP_USER + SMTP_PASS)
 * 2. Custom SMTP host via SMTP_HOST + SMTP_PORT
 * 3. Fallback to automated Ethereal / simulated test transport with live web preview
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  const smtpUser = getGmailUser();
  const smtpPass = getGmailPass();

  if (smtpUser && smtpPass) {
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
      currentMode = 'LIVE_GMAIL';
      console.log('[Email Service] Configured Live Gmail SMTP for:', smtpUser);
      return transporter;
    } catch (err) {
      console.warn('[Email Service] Failed initializing Gmail SMTP:', err.message);
    }
  }

  if (process.env.SMTP_HOST) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      currentMode = 'CUSTOM_SMTP';
      return transporter;
    } catch (err) {
      console.warn('[Email Service] Failed initializing Custom SMTP:', err.message);
    }
  }

  // Development Fallback: Ethereal test email account
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    currentMode = 'TEST_ETHEREAL';
    console.log('[Email Service] Running with Ethereal SMTP test account:', testAccount.user);
    return transporter;
  } catch (err) {
    console.warn('[Email Service] Fallback transporter creation notice:', err.message);
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    currentMode = 'MOCK_JSON';
    return transporter;
  }
};

/**
 * Configure live Gmail credentials dynamically and persist to server/.env
 */
async function configureLiveGmail(gmailUser, appPassword) {
  const cleanUser = String(gmailUser).trim();
  const cleanPass = String(appPassword).trim().replace(/\s+/g, '');

  if (!cleanUser || !cleanPass) {
    throw new Error('Please provide both Gmail address and 16-character Google App Password.');
  }

  const testTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: cleanUser,
      pass: cleanPass
    }
  });

  // Verify connection with Google
  await testTransporter.verify();

  // Set active
  transporter = testTransporter;
  currentMode = 'LIVE_GMAIL';
  process.env.GMAIL_USER = cleanUser;
  process.env.GMAIL_APP_PASSWORD = cleanPass;

  // Persist to server/.env
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('GMAIL_USER=')) {
        envContent = envContent.replace(/GMAIL_USER=.*/, `GMAIL_USER=${cleanUser}`);
      } else {
        envContent += `\nGMAIL_USER=${cleanUser}`;
      }
      if (envContent.includes('GMAIL_APP_PASSWORD=')) {
        envContent = envContent.replace(/GMAIL_APP_PASSWORD=.*/, `GMAIL_APP_PASSWORD=${cleanPass}`);
      } else {
        envContent += `\nGMAIL_APP_PASSWORD=${cleanPass}`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
    }
  } catch (err) {
    console.warn('[Email Service] Notice saving to .env:', err.message);
  }

  return { success: true, email: cleanUser };
}

/**
 * Detects placeholder, unresolvable or test recipient email addresses
 * to ensure real SMTP dispatch is never attempted for mock/placeholder addresses.
 */
function isPlaceholderEmail(email) {
  if (!email || typeof email !== 'string') return true;
  const clean = email.trim().toLowerCase();
  if (!clean.includes('@')) return true;
  const parts = clean.split('@');
  if (parts.length !== 2) return true;
  const [localPart, domain] = parts;
  if (!localPart || !domain) return true;

  const placeholderDomains = [
    'college.edu',
    'campus.edu',
    'example.com',
    'example.org',
    'example.net',
    'test.com',
    'test.org',
    'invalid',
    'localhost',
    'placeholder.com'
  ];

  if (placeholderDomains.includes(domain) || domain.endsWith('.invalid') || domain.endsWith('.test') || domain.endsWith('.local')) {
    return true;
  }

  return false;
}

/**
 * Get current transporter status
 */
function getEmailStatus() {
  return {
    mode: currentMode,
    isLive: currentMode === 'LIVE_GMAIL',
    configuredUser: process.env.GMAIL_USER || null
  };
}

/**
 * Computes time of day greeting: strictly morning, afternoon, evening (NO NIGHT)
 */
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 || hour < 4) {
    return 'Good evening'; // Strictly NO NIGHT
  } else {
    return 'Good morning';
  }
}

function parseUserAgent(uaString = '') {
  const ua = String(uaString).toLowerCase();
  let browser = 'Modern Web Browser';
  let os = 'Unknown OS';

  // Detect OS
  if (ua.includes('windows nt 10') || ua.includes('windows nt 11') || ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('macintosh') || ua.includes('mac os x')) {
    os = 'macOS';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
    os = 'iOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  // Detect Browser
  if (ua.includes('edg/')) {
    browser = 'Microsoft Edge';
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browser = 'Google Chrome';
  } else if (ua.includes('firefox/')) {
    browser = 'Mozilla Firefox';
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browser = 'Apple Safari';
  } else if (ua.includes('opera') || ua.includes('opr/')) {
    browser = 'Opera';
  }

  return { browser, os };
}

const os = require('os');

function getLocalIpAddress() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return 'localhost';
}

/**
 * Sends real email verification link and 6-digit OTP code to user's inbox
 */
async function sendVerificationEmail({ toEmail, userName, token, code }) {
  if (isPlaceholderEmail(toEmail)) {
    console.log(`[Email Service] Suppressed verification email to placeholder address: ${toEmail}`);
    return { success: false, suppressed: true, message: 'Placeholder address suppressed.' };
  }

  try {
    const mailClient = await getTransporter();
    const clientUrl = getClientUrl();
    
    // PC / Localhost link
    const verifyUrlLocal = `${clientUrl}/verify-email?token=${encodeURIComponent(token)}${code ? `&code=${encodeURIComponent(code)}` : ''}`;
    // Mobile / Same Wi-Fi link
    const verifyUrlMobile = `${clientUrl}/verify-email?token=${encodeURIComponent(token)}${code ? `&code=${encodeURIComponent(code)}` : ''}`;

    const sixDigitCode = code || (token ? token.slice(0, 6).toUpperCase() : '------');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b1120; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background-color: #0f172a; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden; }
          .header { background: #0284c7; padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 19px; font-weight: 700; }
          .header p { color: #e0f2fe; margin: 4px 0 0; font-size: 13px; }
          .content { padding: 28px; line-height: 1.6; }
          .otp-card { background: #1e293b; border: 2px dashed #0284c7; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0; }
          .otp-title { color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; margin-bottom: 6px; }
          .otp-code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; margin: 6px 0; }
          .otp-sub { color: #64748b; font-size: 11px; margin-top: 4px; }
          .btn-container { text-align: center; margin: 20px 0; }
          .btn-primary { display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 14px; margin: 4px; }
          .btn-secondary { display: inline-block; background-color: #334155; color: #f1f5f9 !important; padding: 10px 20px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 13px; margin: 4px; border: 1px solid #475569; }
          .device-note { background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #94a3b8; margin-top: 14px; line-height: 1.5; }
          .footer { background-color: #090d16; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Greater Noida College Transit</h1>
            <p>Account Verification &amp; Security</p>
          </div>
          <div class="content">
            <p style="font-size: 15px; margin-top: 0; color: #f8fafc;">Hello ${userName || 'Student'},</p>
            <p style="font-size: 14px; color: #cbd5e1;">
              Please verify your email address to activate your Greater Noida College Transit account.
            </p>

            <!-- 6-Digit OTP Box (Fastest & works on any device) -->
            <div class="otp-card">
              <div class="otp-title">Your 6-Digit Verification Code</div>
              <div class="otp-code">${sixDigitCode}</div>
              <div class="otp-sub">Type this code directly into your registration / sign-in screen</div>
            </div>

            <div style="text-align: center; margin-top: 16px;">
              <p style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">Or click to verify instantly:</p>
              <div class="btn-container">
                <a href="${verifyUrlLocal}" class="btn-primary" target="_blank">Verify on this Computer (PC)</a>
                <a href="${verifyUrlMobile}" class="btn-secondary" target="_blank">Verify on Mobile (Wi-Fi)</a>
              </div>
            </div>

            <div class="device-note">
              <strong>Tip for Mobile Users:</strong> If clicking on your phone shows "site can't be reached", simply read the 6-digit code (<strong>${sixDigitCode}</strong>) above and type it into the browser window on your computer screen!
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Greater Noida College Transit Authority &bull; Greater Noida, Uttar Pradesh
          </div>
        </div>
      </body>
      </html>
    `;

    const fromAddress = process.env.EMAIL_FROM || `"Greater Noida Transit" <${getGmailUser()}>`;

    const info = await mailClient.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Verify your Transit Account - Code: ${sixDigitCode}`,
      text: `Hello ${userName || 'Student'},\n\nYour 6-digit verification code is: ${sixDigitCode}\n\nPC Verification link:\n${verifyUrlLocal}\n\nMobile (Wi-Fi) link:\n${verifyUrlMobile}\n\nGreater Noida College Transit Authority`,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email Service] Verification email dispatched to: ${toEmail} | Code: ${sixDigitCode} | Message ID: ${info.messageId || 'OK'}`);
    console.log(`[Email Service] PC Verify Link: ${verifyUrlLocal}`);
    console.log(`[Email Service] Mobile Verify Link: ${verifyUrlMobile}`);
    if (previewUrl) {
      console.log(`[Email Service] Ethereal Preview URL: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, verifyUrl: verifyUrlLocal, verifyUrlMobile, code: sixDigitCode, previewUrl };
  } catch (error) {
    console.error('[Email Service] Failed to send verification email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends password reset token link to user's inbox
 */
async function sendPasswordResetEmail({ toEmail, userName, token }) {
  if (isPlaceholderEmail(toEmail)) {
    console.log(`[Email Service] Suppressed password reset email to placeholder address: ${toEmail}`);
    return { success: false, suppressed: true, message: 'Placeholder address suppressed.' };
  }

  try {
    const mailClient = await getTransporter();
    const clientUrl = getClientUrl();
    const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b1120; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background-color: #0f172a; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden; }
          .header { background: #0284c7; padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 19px; font-weight: 700; }
          .content { padding: 28px; line-height: 1.6; }
          .btn-container { text-align: center; margin: 26px 0; }
          .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 12px 28px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 14px; }
          .link-box { background: #1e293b; border-radius: 6px; padding: 12px; margin-top: 20px; word-break: break-all; font-family: monospace; font-size: 11px; color: #94a3b8; border: 1px solid #334155; }
          .footer { background-color: #090d16; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>College Bus Management System</h1>
            <p style="color: #e0f2fe; margin: 4px 0 0; font-size: 13px;">Password Reset Request</p>
          </div>
          <div class="content">
            <p style="font-size: 15px; margin-top: 0; color: #f8fafc;">Hello ${userName || 'User'},</p>
            <p style="font-size: 14px; color: #cbd5e1;">
              We received a request to reset your College Bus Management System password. Click the button below to choose a new password.
            </p>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">
              This link is secure, single-use, and expires in 1 hour. If you did not request this, you can safely ignore this email; your password remains unchanged.
            </p>
            <div class="link-box">
              Direct link:<br/>
              <a href="${resetUrl}" style="color: #38bdf8;">${resetUrl}</a>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} College Bus Management System
          </div>
        </div>
      </body>
      </html>
    `;

    const fromAddress = process.env.EMAIL_FROM || `"College Bus Management" <${getGmailUser()}>`;

    const info = await mailClient.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: 'Reset your College Bus Management System password',
      text: `Hello ${userName || 'User'},\n\nReset your password at:\n${resetUrl}\n\nExpires in 1 hour.\n\nCollege Bus Management System`,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email Service] Password reset email dispatched to: ${toEmail} | Message ID: ${info.messageId || 'OK'}`);
    if (previewUrl) {
      console.log(`[Email Service] Ethereal Reset Preview URL: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, resetUrl, previewUrl };
  } catch (error) {
    console.error('[Email Service] Failed to send password reset email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends a real-time login notification email to user's inbox
 */
async function sendLoginNotificationEmail({ toEmail, userName, loginTime = new Date(), ipAddress = '127.0.0.1', userAgent = '' }) {
  if (isPlaceholderEmail(toEmail)) {
    console.log(`[Email Service] Suppressed login notification to placeholder address: ${toEmail}`);
    return { success: false, suppressed: true, message: 'Placeholder address suppressed.' };
  }
  try {
    const mailClient = await getTransporter();

    const formattedTime = new Date(loginTime).toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' IST';

    const { browser, os } = parseUserAgent(userAgent);
    const greetingName = userName ? userName.trim() : 'Student';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b1120; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background-color: #0f172a; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden; }
          .header { background: #0284c7; padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 19px; font-weight: 700; }
          .header p { color: #e0f2fe; margin: 4px 0 0; font-size: 13px; }
          .content { padding: 28px; line-height: 1.6; }
          .details-card { background-color: #1e293b; border-radius: 8px; border: 1px solid #334155; padding: 16px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155; font-size: 13px; }
          .row:last-child { border-bottom: none; }
          .label { color: #94a3b8; }
          .val { color: #f8fafc; font-weight: 600; text-align: right; }
          .footer { background-color: #090d16; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Greater Noida College Transit</h1>
            <p>Security Alert</p>
          </div>
          <div class="content">
            <p style="font-size: 15px; margin-top: 0; color: #f8fafc;">Hello ${greetingName},</p>
            <p style="font-size: 14px; color: #cbd5e1;">
              A new sign-in was detected on your account.
            </p>

            <div class="details-card">
              <div class="row">
                <span class="label">Time:</span>
                <span class="val">${formattedTime}</span>
              </div>
              <div class="row">
                <span class="label">Browser:</span>
                <span class="val">${browser}</span>
              </div>
              <div class="row">
                <span class="label">Operating System:</span>
                <span class="val">${os}</span>
              </div>
              <div class="row">
                <span class="label">Location:</span>
                <span class="val">Greater Noida, Uttar Pradesh</span>
              </div>
            </div>

            <p style="font-size: 13px; color: #cbd5e1;">
              <strong>If this was you:</strong> No action is required.<br/>
              <strong>If this wasn't you:</strong> Please change your password immediately.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Greater Noida College Transit Authority
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${greetingName},\n\nA new sign-in was detected on your account.\n\nTime: ${formattedTime}\nBrowser: ${browser}\nOperating System: ${os}\n\nIf this was you: No action is required.\nIf this wasn't you: Please change your password.\n\nGreater Noida College Transit`;

    const fromAddress = process.env.EMAIL_FROM || `"Greater Noida Transit Security" <${getGmailUser()}>`;

    const info = await mailClient.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: 'New sign-in to your Greater Noida College Transit account',
      text: textContent,
      html: htmlContent
    });

    console.log(`[Email Service] Login notification dispatched to: ${toEmail} | Message ID: ${info.messageId || 'OK'}`);
    return {
      success: true,
      messageId: info.messageId,
      isLive: currentMode === 'LIVE_GMAIL'
    };
  } catch (error) {
    // Non-blocking error handling
    console.warn('[Email Service] Safely logged login email failure:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sends a real-time 10-minute digital boarding pass with embedded QR to user's Gmail
 */
async function sendPassIssuedEmail({ toEmail, userName, pass }) {
  try {
    const mailClient = await getTransporter();
    const QRCode = require('qrcode');

    // Generate QR code buffer for inline email CID embedding
    const qrBuffer = await QRCode.toBuffer(JSON.stringify({
      authority: 'GREATER NOIDA TRANSIT AUTHORITY (GNTA)',
      passToken: pass.passCode,
      passenger: userName,
      bus: pass.busNumber,
      plate: pass.plateNumber || 'UP-16-CB-1012',
      from: pass.fromStop,
      to: pass.toStop,
      seat: pass.seatNumber,
      validUntil: pass.validUntil
    }), {
      width: 260,
      margin: 1,
      color: { dark: '#090d16', light: '#ffffff' }
    });

    const expTime = new Date(pass.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 520px; margin: 0 auto; background-color: #0f172a; border-radius: 20px; border: 1px solid #1e293b; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%); padding: 22px; text-align: center; color: white; }
          .ticket-card { background: #ffffff; color: #090d16; margin: 18px; border-radius: 16px; padding: 18px; text-align: center; }
          .token-code { font-family: monospace; font-size: 14px; font-weight: bold; background: #f1f5f9; padding: 8px 12px; border-radius: 8px; margin: 12px 0; display: inline-block; color: #0f172a; border: 1px solid #cbd5e1; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; text-align: left; }
          .row:last-child { border-bottom: none; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; background: #dcfce7; color: #166534; }
          .timer-box { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: 10px; border-radius: 10px; font-size: 12px; font-weight: bold; margin-top: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; font-size: 18px;">GREATER NOIDA TRANSIT AUTHORITY (GNTA)</h2>
            <p style="margin: 4px 0 0; font-size: 12px; color: #e0f2fe;">10-Minute Dynamic Boarding QR Token</p>
          </div>
          <div style="padding: 0 8px;">
            <div class="ticket-card">
              <span class="badge">&#10003; GNTA VERIFIED BOARDING PASS</span>
              <div style="margin: 12px 0;">
                <img src="cid:boarding_qr_code" alt="Boarding Token QR" style="width: 170px; height: 170px; display: inline-block;" />
              </div>
              <div class="token-code">${pass.passCode}</div>
              
              <div style="margin-top: 12px; text-align: left;">
                <div class="row"><span>Commuter:</span><strong>${userName}</strong></div>
                <div class="row"><span>Vehicle:</span><strong style="color: #0284c7;">${pass.busNumber} (${pass.plateNumber || 'UP-16-CB-1012'})</strong></div>
                <div class="row"><span>Corridor:</span><strong>${pass.routeName}</strong></div>
                <div class="row"><span>Boarding:</span><strong>${pass.fromStop}</strong></div>
                <div class="row"><span>Drop-off:</span><strong>${pass.toStop}</strong></div>
                <div class="row"><span>Seat:</span><strong>${pass.seatNumber}</strong></div>
                <div class="row"><span>Fare:</span><strong>PAID (Subsidized Student Pass)</strong></div>
                <div class="row"><span>Date:</span><strong>${formattedDate}</strong></div>
              </div>

              <div class="timer-box">
                &#9200; VALID STRICTLY FOR 10 MINUTES &bull; EXPIRES AT ${expTime}
              </div>
            </div>
          </div>
          <div style="text-align: center; padding: 16px; font-size: 11px; color: #64748b;">
            Scan at vehicle validator or show to conductor upon boarding.<br/>
            College Bus AI Management &bull; Greater Noida Transit Authority
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mailClient.sendMail({
      from: `"GNTA Boarding Pass" <${getGmailUser()}>`,
      to: toEmail,
      subject: `🎫 GNTA Bus Pass: ${pass.passCode} (Valid for 10 Mins) - ${pass.busNumber}`,
      html: htmlContent,
      attachments: [
        {
          filename: 'boarding-token-qr.png',
          content: qrBuffer,
          cid: 'boarding_qr_code'
        }
      ]
    });

    console.log(`[Email Service] Boarding pass dispatched to Gmail: ${toEmail} | Message ID: ${info.messageId || 'OK'}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn('[Email Service] Notice on pass email dispatch:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendLoginNotificationEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPassIssuedEmail,
  configureLiveGmail,
  getEmailStatus,
  isPlaceholderEmail
};

