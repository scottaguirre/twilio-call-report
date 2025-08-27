// routes/twilioVoice.js
const express = require('express');
const router = express.Router();
const { twiml: { VoiceResponse } } = require('twilio');
const { Retell } = require('retell-sdk');

// If you ever need urlencoded parsing only for this route:
const urlencoded = express.urlencoded({ extended: false });

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
    // Preserve real caller ID so Retell “sees” the right number
    const dial = vr.dial({
      callerId: req.body.From,
      answerOnBridge: true,
      timeout: 20,
      // start recording on answer; use "record-from-answer-dual" for 2 channels
      record: 'record-from-answer-dual',
      recordingStatusCallback: 'https://028c9122a2a1.ngrok-free.app/twilio/recording-status',
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
