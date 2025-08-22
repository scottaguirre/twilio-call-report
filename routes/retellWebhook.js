const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Required env vars:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// ALERT_SMS_EMAIL (e.g. '12145551234@tmomail.net' or '12145551234@vtext.com')
const {
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_SMS_EMAIL
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT) === 465, // true only for 465
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

// keep messages short for SMS gateways
const smsify = (s = '', max = 300) => String(s).replace(/\s+/g, ' ').trim().slice(0, max);

router.post('/retell/webhook', express.json(), async (req, res) => {
  try {
    const { call, call_analysis } = req.body || {};

    const from    = call?.from_number || call?.caller || 'unknown';
    const to      = call?.to_number   || 'unknown';
    const name    = call_analysis?.extracted?.customer_name   || call?.metadata?.customer_name || 'N/A';
    const phone   = call_analysis?.extracted?.callback_phone  || from || 'N/A';
    const service = call_analysis?.extracted?.service_type    || 'N/A';
    const summary = call_analysis?.summary || 'No summary';

    const text = smsify(
      `New lead • From ${from}→${to} • Name: ${name} • Phone: ${phone} • Service: ${service} • ${summary}`,
      300
    );

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: ALERT_SMS_EMAIL,   // your carrier SMS-gateway address
      subject: '',           // most gateways ignore subject
      text,
    });

    res.sendStatus(200);
  } catch (err) {
    console.error('Retell webhook Email→SMS error:', err);
    res.sendStatus(500);
  }
});

module.exports = router;
