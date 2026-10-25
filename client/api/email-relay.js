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
  const subject = data?.subject || 'College Bus Management Notification';
  const text = data?.text || 'Notification from College Bus Management System.';
  const html = data?.html || `<p>${text}</p>`;

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
