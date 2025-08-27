// routes/twilioVoice.js
const express = require('express');
const { Retell } = require('retell-sdk');
const brands = require('../config/brandConfig');
const { twiml: { VoiceResponse } } = require('twilio');

const router = express.Router();


// If you ever need urlencoded parsing only for this route:
const urlencoded = express.urlencoded({ extended: false });
const E164 = /^\+\d{7,15}$/;
const toE164 = v => (typeof v === 'string' && E164.test(v.trim())) ? v.trim() : null;



router.post('/twilio/voice', urlencoded, async (req, res) => {
  try {
    // 1) Register the phone call with Retell
    const retell = new Retell({ apiKey: process.env.RETELL_API_KEY });

    const reg = await retell.call.registerPhoneCall({
      agent_id: process.env.RETELL_AGENT_HOUSTON,   // your Retell agent id
      from_number: req.body.From,              // caller
      to_number: req.body.To,                  // the Twilio number that was called
      direction: 'inbound',
    });

    const callId = reg?.call_id;
    if (!callId) throw new Error('No call_id returned from Retell registerPhoneCall');

    // 2) Build SIP URI and respond with TwiML to dial it
    const sipUri = `sip:${callId}@5t4n6j0wnrl.sip.livekit.cloud`; // Retell’s SIP ingress host

    const vr = new VoiceResponse();

    // build a stable base URL from EB env var, fallback to Host header
    const baseUrl = (process.env.PUBLIC_BASE_URL ? process.env.PUBLIC_BASE_URL.replace(/\/+$/, '') : `${req.protocol}://${req.get('host')}`);


    // Preserve real caller ID so Retell “sees” the right number
    const dial = vr.dial({
      callerId: req.body.To,
      answerOnBridge: true,
      timeout: 20,
      // start recording on answer; use "record-from-answer-dual" for 2 channels
      record: 'record-from-answer-dual',
      recordingStatusCallback: `${baseUrl}/twilio/recording-status`,
      recordingStatusCallbackEvent: ['completed']
     });

    dial.sip(sipUri);

    return res.type('text/xml').send(vr.toString());

  } catch (err) {
    console.error('Twilio → Retell bridge error:', err);
    // Optional: simple fallback message if anything fails
    const vr = new VoiceResponse();
    vr.say('Sorry, the agent is unavailable right now. Please try again later.');
    return res.type('text/xml').send(vr.toString());
  }
});

module.exports = router;



