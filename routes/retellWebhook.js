// routes/retellWebhook.js
const express = require('express');
const router = express.Router();
const { sendTelegram } = require('../utils/telegram');
const { getBrandByDid } = require('../config/brandConfig');

router.post('/retell/webhook', express.json(), async (req, res) => {
  try {
    const { event, call } = req.body || {};
    if (event !== 'call_analyzed' || !call) return res.sendStatus(204);

    const ca  = call.call_analysis || {};
    const cad = ca.custom_analysis_data || {};

    const pick = v => (v && String(v).trim()) || null;

    const firstName = pick(cad.first_name);
    const lastName  = pick(cad.last_name);
    const email     = pick(cad.email);
    const year      = pick(cad.vehicle_year);
    const make      = pick(cad.vehicle_make);
    const model     = pick(cad.vehicle_model);
    const issue     = pick(cad.vehicle_problem);

    const from = pick(call.from_number);
    const to   = pick(call.to_number);

    const brand = getBrandByDid(to);

    const lines = ['📞 New Lead'];
    if (firstName || lastName) lines.push(`Name: ${[firstName, lastName].filter(Boolean).join(' ')}`);
    if (email)  lines.push(`Email: ${email}`);
    if (from)   lines.push(`Phone: ${from}`);
    const veh = [year, make, model].filter(Boolean).join(' ');
    if (veh)    lines.push(`Vehicle: ${veh}`);

    if (brand?.state) lines.push(`State: ${brand.state}`);
    if (issue)        lines.push(`Issue: ${issue}`);

    const text = lines.join('\n');
    if (text) await sendTelegram(text);
    res.sendStatus(200);
  } catch (err) {
    console.error('retell webhook error:', err);
    res.sendStatus(500);
  }
});


module.exports = router;
