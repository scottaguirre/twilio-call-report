// routes/retellWebhook.js
const express = require('express');
const router = express.Router();
const { sendTelegram } = require('../utils/telegram');

const pick = v => (v && String(v).trim()) || null;

router.post('/retell/webhook', express.json(), async (req, res) => {
  try {
    const { event, call } = req.body || {};
    if (event !== 'call_analyzed' || !call) return res.sendStatus(204);

    const ca  = call.call_analysis || {};
    const cad = ca.custom_analysis_data || {};

    // fields you confirmed exist on call_analyzed
    const firstName = pick(cad.first_name);
    const lastName  = pick(cad.last_name);
    const email     = pick(cad.email);

    const year   = pick(cad.vehicle_year);
    const make   = pick(cad.vehicle_make);
    const model  = pick(cad.vehicle_model);
    const issue  = pick(cad.vehicle_problem);

    const from   = pick(call.from_number);
    const to     = pick(call.to_number);
    const rec    = pick(call.recording_url);
    const logUrl = pick(call.public_log_url);
    const summary = pick(ca.call_summary || ca.summary);

    // build message without "Unknown" lines
    const lines = ['📞 New Lead '];   
    if (firstName || lastName) lines.push(`Name: ${[firstName, lastName].filter(Boolean).join(' ')}`);
    if (email)  lines.push(`Email: ${email}`);
    if (from)   lines.push(`Phone: ${from}`);
    const veh = [year, make, model].filter(Boolean).join(' ');
    if (veh)    lines.push(`Vehicle: ${veh}`);
    if (to == "+14698333483") {
      lines.push(`State: TX`);
    } 
    if (issue)  lines.push(`Issue: ${issue}`);
   

    const text = lines.join('\n');
    if (text) await sendTelegram(text);

    return res.sendStatus(200);
  } catch (err) {
    console.error('retell webhook error:', err);
    return res.sendStatus(500);
  }
});

module.exports = router;
