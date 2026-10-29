import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Universal CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const data = req.method === 'POST' ? req.body : req.query;
  const toEmail = (data?.to || data?.toEmail || 'rajchaturvedi215@gmail.com').trim();
  const type = data?.type || '';

  let subject = data?.subject || 'College Bus Management Notification';
  let html = data?.html || '';
  let text = data?.text || 'Notification from College Bus Management System.';

  const formattedTime = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  }) + ' IST';

  // 1. RICH LOGIN ALERT EMAIL TEMPLATE
  if (type === 'LOGIN_ALERT') {
    const userName = data?.userName || 'Student Commuter';
    const method = data?.method || 'Standard Authentication';
    const browser = data?.browser || 'Campus Web Browser';
    const os = data?.os || 'Mobile / Desktop';
    subject = `College Bus Transit: New Sign-In Alert (${userName})`;

    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px; text-align: center; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; background: #dcfce7; color: #166534; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px; }
          .content { padding: 28px; line-height: 1.6; }
          .card { background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 16px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 13px; }
          .row:last-child { border-bottom: none; }
          .label { color: #94a3b8; font-weight: 500; }
          .val { color: #f8fafc; font-weight: 700; text-align: right; }
          .security-box { background: #1e1b4b; border: 1px solid #3730a3; color: #c7d2fe; padding: 14px; border-radius: 10px; font-size: 12px; margin-top: 20px; line-height: 1.5; }
          .btn-container { text-align: center; margin: 24px 0 10px; }
          .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.4); }
          .footer { background-color: #090d16; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">&#10003; GNTA Security System</span>
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">College Bus Management</h1>
            <p style="color: #e0f2fe; margin: 4px 0 0; font-size: 13px;">Official Live Sign-In Notification</p>
          </div>
          <div class="content">
            <p style="font-size: 15px; margin-top: 0; color: #f8fafc;">Hello <strong>${userName}</strong>,</p>
            <p style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">
              A verified sign-in session was just established for your campus transit account. Below are the verified session telemetry details:
            </p>

            <div class="card">
              <div class="row">
                <span class="label">Account User:</span>
                <span class="val">${userName}</span>
              </div>
              <div class="row">
                <span class="label">Sign-In Method:</span>
                <span class="val" style="color: #38bdf8;">${method}</span>
              </div>
              <div class="row">
                <span class="label">Date &amp; Time:</span>
                <span class="val">${formattedTime}</span>
              </div>
              <div class="row">
                <span class="label">Browser &amp; OS:</span>
                <span class="val">${browser} (${os})</span>
              </div>
              <div class="row">
                <span class="label">Transit Node:</span>
                <span class="val">Greater Noida Campus Gateway</span>
              </div>
              <div class="row">
                <span class="label">Security State:</span>
                <span class="val" style="color: #4ade80;">Active Session Verified</span>
              </div>
            </div>

            <div class="btn-container">
              <a href="https://college-bus-management-etd3.vercel.app/dashboard" class="btn" target="_blank">Access Transit Dashboard</a>
            </div>

            <div class="security-box">
              <strong>Account Protection Notice:</strong> If this was you, no action is needed. If you did not authorize this sign-in, please change your password immediately or report to campus transport authority.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Greater Noida College Transit Authority (GNTA) &bull; Automated Telemetry Service
          </div>
        </div>
      </body>
      </html>
    `;
    text = `Hello ${userName},\n\nNew sign-in detected on your College Bus account.\nMethod: ${method}\nTime: ${formattedTime}\nDevice: ${browser} (${os})\n\nIf this was you, no action is required.\n\nGreater Noida Transit Authority`;
  }

  // 2. RICH DIGITAL BOARDING PASS / TOKEN EMAIL TEMPLATE (WITH VISIBLE SCANNABLE QR)
  else if (type === 'PASS_ISSUED') {
    const passCode = data?.passCode || data?.pass?.passCode || 'GNTA-TKN-BUS12-PASS';
    const busNumber = data?.busNumber || data?.pass?.busNumber || 'Bus 12 (KP-Express)';
    const plateNumber = data?.plateNumber || data?.pass?.plateNumber || 'UP-16-CB-1012';
    const fromStop = data?.fromStop || data?.pass?.fromStop || 'GL Bajaj & Knowledge Park III';
    const toStop = data?.toStop || data?.pass?.toStop || 'Pari Chowk Central Interchange';
    const passengerName = data?.passengerName || data?.userName || 'Student Commuter';
    const seatNumber = data?.seatNumber || data?.pass?.seatNumber || 'Window Seat';
    
    // Exact 5-minute validity and strict IST time formatting
    const rawValidUntil = data?.validUntil || data?.pass?.validUntil || (Date.now() + 5 * 60 * 1000);
    const validUntilDate = new Date(rawValidUntil);
    const expiryTime = !isNaN(validUntilDate.getTime())
      ? validUntilDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST'
      : new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST';
    
    // High-resolution public QR code image that displays reliably in Gmail without blocked attachments
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(passCode)}`;

    subject = `🎫 College Bus Boarding Token: ${passCode} (${busNumber})`;

    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 520px; margin: 0 auto; background-color: #0f172a; border-radius: 20px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6); }
          .header { background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%); padding: 22px; text-align: center; color: white; }
          .ticket-card { background: #ffffff; color: #090d16; margin: 18px; border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2); }
          .badge { display: inline-block; padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; background: #dcfce7; color: #166534; letter-spacing: 0.5px; }
          .qr-box { margin: 16px auto; padding: 12px; background: #ffffff; border: 2px solid #0f172a; border-radius: 16px; display: inline-block; }
          .token-code { font-family: monospace; font-size: 15px; font-weight: 800; background: #0f172a; color: #38bdf8; padding: 10px 16px; border-radius: 10px; margin: 14px 0; display: inline-block; letter-spacing: 1.5px; }
          .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; text-align: left; }
          .row:last-child { border-bottom: none; }
          .timer-box { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: 12px; border-radius: 12px; font-size: 12px; font-weight: 800; margin-top: 16px; letter-spacing: 0.3px; }
          .footer { text-align: center; padding: 16px 20px; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.5px;">GREATER NOIDA TRANSIT AUTHORITY</h2>
            <p style="margin: 4px 0 0; font-size: 12px; color: #e0f2fe;">5-Minute Dynamic Boarding QR Token</p>
          </div>
          <div style="padding: 0 8px;">
            <div class="ticket-card">
              <span class="badge">&#10003; GNTA VERIFIED BOARDING PASS</span>
              
              <!-- GUARANTEED VISIBLE SCANNABLE QR CODE -->
              <div class="qr-box">
                <img src="${qrImageUrl}" alt="Boarding Token QR Code" width="200" height="200" style="display: block; margin: 0 auto; width: 200px; height: 200px;" />
              </div>

              <!-- TOKEN MONOSPACE IDENTIFIER -->
              <div>
                <div class="token-code">${passCode}</div>
              </div>

              <div style="margin-top: 10px; text-align: left;">
                <div class="row"><span>Passenger:</span><strong>${passengerName}</strong></div>
                <div class="row"><span>Vehicle:</span><strong style="color: #0284c7;">${busNumber} (${plateNumber})</strong></div>
                <div class="row"><span>Boarding Stop:</span><strong>${fromStop}</strong></div>
                <div class="row"><span>Drop-off Stop:</span><strong>${toStop}</strong></div>
                <div class="row"><span>Seat Preference:</span><strong>${seatNumber}</strong></div>
                <div class="row"><span>Fare Status:</span><strong style="color: #166534;">PAID (Subsidized Student Pass)</strong></div>
                <div class="row"><span>Issued At:</span><strong>${formattedTime}</strong></div>
              </div>

              <div class="timer-box">
                &#9200; VALID STRICTLY FOR 5 MINUTES &bull; EXPIRES AT ${expiryTime}
              </div>
            </div>
          </div>
          <div class="footer">
            Present this scannable token to the conductor or vehicle QR validator upon boarding.<br/>
            College Bus AI Management &bull; Greater Noida Transit Authority (GNTA)
          </div>
        </div>
      </body>
      </html>
    `;
    text = `GNTA Boarding Token: ${passCode}\nVehicle: ${busNumber} (${plateNumber})\nFrom: ${fromStop}\nTo: ${toStop}\nValid until: ${expiryTime}\n\nPresent this code to the bus validator.`;
  }

  // 3. RICH EMAIL VERIFICATION / 6-DIGIT OTP TEMPLATE
  else if (type === 'VERIFICATION_CODE') {
    const userName = data?.userName || 'Student Commuter';
    const code = data?.code || data?.token?.slice(0, 6) || '------';
    const verifyUrl = data?.verifyUrl || `https://college-bus-management-etd3.vercel.app/verify-email?token=${encodeURIComponent(data?.token || '')}&code=${encodeURIComponent(code)}`;
    subject = `Verify your Transit Account - Code: ${code}`;

    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b1120; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { background: #0284c7; padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 19px; font-weight: 800; }
          .content { padding: 28px; line-height: 1.6; }
          .otp-card { background: #1e293b; border: 2px dashed #0284c7; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0; }
          .otp-title { color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; margin-bottom: 6px; }
          .otp-code { font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; margin: 6px 0; }
          .otp-sub { color: #64748b; font-size: 11px; margin-top: 4px; }
          .btn-container { text-align: center; margin: 24px 0; }
          .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 13px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.4); }
          .footer { background-color: #090d16; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Greater Noida College Transit</h1>
            <p style="color: #e0f2fe; margin: 4px 0 0; font-size: 13px;">Official Account Verification</p>
          </div>
          <div class="content">
            <p style="font-size: 15px; margin-top: 0; color: #f8fafc;">Hello <strong>${userName}</strong>,</p>
            <p style="font-size: 14px; color: #cbd5e1;">
              Please enter the 6-digit verification code below to verify your student account:
            </p>
            <div class="otp-card">
              <div class="otp-title">Your 6-Digit Verification Code</div>
              <div class="otp-code">${code}</div>
              <div class="otp-sub">Type this code into your verification screen</div>
            </div>
            <div class="btn-container">
              <a href="${verifyUrl}" class="btn" target="_blank">Click Here to Verify Instantly</a>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Greater Noida College Transit Authority
          </div>
        </div>
      </body>
      </html>
    `;
    text = `Hello ${userName},\n\nYour 6-digit verification code is: ${code}\n\nVerify online at: ${verifyUrl}\n\nGreater Noida College Transit Authority`;
  }

  // 4. RICH PASSWORD RESET EMAIL TEMPLATE
  else if (type === 'PASSWORD_RESET') {
    const userName = data?.userName || 'Student Commuter';
    const resetUrl = data?.resetUrl || `https://college-bus-management-etd3.vercel.app/reset-password?token=${data?.token || ''}`;
    subject = `Reset your College Bus Management password`;

    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b1120; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { background: #0284c7; padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 19px; font-weight: 800; }
          .content { padding: 28px; line-height: 1.6; }
          .btn-container { text-align: center; margin: 26px 0; }
          .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 13px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.4); }
          .link-box { background: #1e293b; border-radius: 8px; padding: 12px; margin-top: 20px; word-break: break-all; font-family: monospace; font-size: 11px; color: #94a3b8; border: 1px solid #334155; }
          .footer { background-color: #090d16; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>College Bus Management System</h1>
            <p style="color: #e0f2fe; margin: 4px 0 0; font-size: 13px;">Secure Password Recovery</p>
          </div>
          <div class="content">
            <p style="font-size: 15px; margin-top: 0; color: #f8fafc;">Hello <strong>${userName}</strong>,</p>
            <p style="font-size: 14px; color: #cbd5e1;">
              We received a request to reset your College Bus Management account password. Click the button below to establish a new secure password.
            </p>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">
              This link is single-use and expires in 60 minutes. If you did not request this reset, your credentials remain safe and no action is required.
            </p>
            <div class="link-box">
              Direct Link:<br/>
              <a href="${resetUrl}" style="color: #38bdf8;">${resetUrl}</a>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} College Bus Management System &bull; Greater Noida Transit Authority
          </div>
        </div>
      </body>
      </html>
    `;
    text = `Hello ${userName},\n\nReset your password at:\n${resetUrl}\n\nExpires in 60 minutes.\n\nCollege Bus Management`;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'rajchaturvedi215@gmail.com',
        pass: 'hhuoctvwhhqfygsb'
      }
    });

    const info = await transporter.sendMail({
      from: '"College Bus Transit" <rajchaturvedi215@gmail.com>',
      to: toEmail,
      replyTo: 'no-reply@collegebus.edu',
      subject,
      text,
      html
    });

    console.log('[Vercel Email Relay] Successfully dispatched email to:', toEmail, info.messageId);
    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      recipient: toEmail,
      type: type || 'CUSTOM',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Vercel Email Relay] Failed to dispatch email:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
