require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT,
    secure: +process.env.SMTP_PORT === 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await t.sendMail({
    from: process.env.FROM_EMAIL,
    to: process.env.ALERT_SMS_EMAIL,
    subject: '',
    text: 'Test via SendGrid SMTP'
  });

  console.log('sent');
})().catch(console.error);
