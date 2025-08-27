// routes/twilioVoice.js
const express = require('express');
const router = express.Router();
const { Retell } = require('retell-sdk');
const { twiml: { VoiceResponse } } = require('twilio');
const { getBrandByDid } = require('../config/brandConfig');

const urlencoded = express.urlencoded({ extended: false });
const E164 = /^\+\d{7,15}$/;
const toE164 = v => (typeof v === 'string' && E164.test(v.trim())) ? v.trim() : null;

router.post('/twilio/voice', urlencoded, async (req, res) => {
  const vr = new VoiceResponse();
  try {
    const From = (req.body.From || '').trim(); // caller
    const ToRaw = (req.body.To || '').trim();  // Twilio DID dialed
    const To = toE164(ToRaw) || ToRaw;

    // Pick brand by DID
    const brand = getBrandByDid(To);
    if (!brand?.agentId) {
      console.error('No brand/agent for DID:', To);
      vr.say('Sorry, the agent is unavailable right now. Please try again later.');
      return res.type('text/xml').send(vr.toString());
    }

    // Register call with Retell for this brand’s agent
    const retell = new Retell({ apiKey: process.env.RETELL_API_KEY });
    const reg = await retell.call.registerPhoneCall({
      agent_id: brand.agentId,
      from_number: From,
      to_number: To,
      direction: 'inbound',
      metadata: { did: To, businessName: brand.businessName, city: brand.city },
    });

    // Use SIP URI provided by Retell; fall back to call_id pattern if needed
    const sipUri =
      reg?.sip_trunk?.sip_uri ||
      reg?.sip_uri ||
      (reg?.call_id ? `sip:${reg.call_id}@5t4n6j0wnrl.sip.livekit.cloud` : null);

    if (!sipUri) {
      console.error('Retell register returned no sip_uri. Keys:', Object.keys(reg || {}));
      vr.say('Sorry, the agent is unavailable right now. Please try again later.');
      return res.type('text/xml').send(vr.toString());
    }

    // Build base URL (prefer env)
    const baseUrl = process.env.PUBLIC_BASE_URL
      ? process.env.PUBLIC_BASE_URL.replace(/\/+$/, '')
      : `${req.protocol}://${req.get('host')}`;

    // Dial SIP, present YOUR DID, start recording
    const dial = vr.dial({
      callerId: toE164(To) || undefined,
      answerOnBridge: true,
      timeout: 20,
      record: brand.recordMode || process.env.TWILIO_RECORD_MODE || 'record-from-answer-dual',
      recordingStatusCallback: `${baseUrl}/twilio/recording-status`,
      recordingStatusCallbackEvent: ['completed'],
      recordingStatusCallbackMethod: 'POST',
    });

    // pass original caller as SIP header (helpful for analytics)
    dial.sip(sipUri, { sipHeaders: `X-Original-Caller=${encodeURIComponent(From || '')}` });

    return res.type('text/xml').send(vr.toString());
  } catch (err) {
    console.error('Twilio → Retell bridge error:', err?.status || err?.code || '', err?.message || err);
    vr.say('Sorry, the agent is unavailable right now. Please try again later.');
    return res.type('text/xml').send(vr.toString());
  }
});

module.exports = router;
