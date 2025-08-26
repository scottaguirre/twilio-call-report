const express = require('express');
const router = express.Router();
const client = require('../config/twilioClient'); // reuses your existing Twilio client

// Keep messages short for WhatsApp and guard against nulls
const clamp = (s = '', n = 600) => String(s).replace(/\s+/g, ' ').trim().slice(0, n);

router.post('/retell/webhook', express.json(), async (req, res) => {
  try {
    const { call, call_analysis } = req.body || {};

    // Extract useful fields (fallbacks so it never crashes)
    const fromRaw   = call?.from_number || call?.caller || 'unknown';
    const toRaw     = call?.to_number   || 'unknown';
    const name      = call_analysis?.extracted?.customer_name  || call?.metadata?.customer_name || 'N/A';
    const phone     = call_analysis?.extracted?.callback_phone || fromRaw || 'N/A';
    const service   = call_analysis?.extracted?.service_type   || 'N/A';
    const summary   = call_analysis?.summary || 'No summary available';

    // Optional: include Retell call URL if you store one in metadata
    const retellUrl = call?.retell_call_url || call?.metadata?.retell_call_url || '';

    const text = clamp(
`New lead via Retell 🤖
From: ${fromRaw} → ${toRaw}
Name: ${name}
Phone: ${phone}
Service: ${service}
Summary: ${summary}${retellUrl ? `

Call: ${retellUrl}` : ''}`
    );

    // Send WhatsApp message via Twilio
    await client.messages.create({
      from: process.env.WHATSAPP_FROM,   // e.g., 'whatsapp:+14155238886'
      to:   process.env.WHATSAPP_TO,     // e.g., 'whatsapp:+1YOURCELLPHONE'
      body: text,
    });

    return res.sendStatus(200);
  } catch (err) {
    console.error('Retell webhook → WhatsApp error:', err);
    return res.sendStatus(500);
  }
});

module.exports = router;
