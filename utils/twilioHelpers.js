const client = require('../config/twilioClient');


// --- helpers to validate numbers ---
const E164 = /^\+\d{7,15}$/;

function isE164(n) { return typeof n === 'string' && E164.test(String(n||'').trim()); }

function isSip(n)  { return typeof n === 'string' && n.toLowerCase().startsWith('sip:'); }

function normalizeE164OrNull(n) {
  if (!n || typeof n !== 'string') return null;
  const t = n.trim();
  return isE164(t) ? t : null;
}


/**
 * Resolve the display DID for a call:
 * - If call.to (or toFormatted) is E.164, use that (this is your Twilio DID on inbound parent legs).
 * - If call.to is a SIP URI and there's a parentCallSid, fetch the parent and use parent.to.
 * Returns: { did: string|null, formatted: string|null }
 */


async function resolveDisplayDid(call, parentCache = new Map()) {
  // 1) direct E.164 on this leg
  const direct = normalizeE164OrNull(call.to) || normalizeE164OrNull(call.toFormatted);
  if (direct) return { did: direct, formatted: call.toFormatted || direct };



  // 2) SIP child leg → ascend to parent to recover the DID
  if (isSip(call.to) && call.parentCallSid) {
    if (!parentCache.has(call.parentCallSid)) {
      try {
        const parent = await client.calls(call.parentCallSid).fetch();
        parentCache.set(call.parentCallSid, parent || null);
      } catch {
        parentCache.set(call.parentCallSid, null);
      }
    }
    const parent = parentCache.get(call.parentCallSid);
    if (parent) {
      const pDid = normalizeE164OrNull(parent.to) || normalizeE164OrNull(parent.toFormatted);
      if (pDid) return { did: pDid, formatted: parent.toFormatted || pDid };
    }
  }

  // 3) nothing found
  return { did: null, formatted: null };
}



// Get all the calls of a given date range
async function getCalls(startTimeBefore, startTimeAfter) {
    return await client.calls.list({
        startTimeBefore: new Date(startTimeBefore),
        startTimeAfter: new Date(startTimeAfter),
        limit: 999
    });
}

// Get all Today's calls
async function getAllCallsToday({ actualYear, actualMonth, actualDate }) {
  // Build local start/end, then convert to UTC Date objects
  const startLocal = new Date(actualYear, actualMonth - 1, actualDate, 0, 0, 0, 0);
  const endLocal   = new Date(actualYear, actualMonth - 1, actualDate, 23, 59, 59, 999);

  const startUTC = new Date(Date.UTC(
    startLocal.getFullYear(), startLocal.getMonth(), startLocal.getDate(), 0, 0, 0, 0
  ));
  const endUTC = new Date(Date.UTC(
    endLocal.getFullYear(), endLocal.getMonth(), endLocal.getDate(), 23, 59, 59, 999
  ));

  return await client.calls.list({
    startTimeAfter: startUTC,
    startTimeBefore: endUTC,
    limit: 400
  });
}


// Filter calls by phone numbers (E.164 only; ignore SIP legs)
function filterCallsByNumbers(calls, numbers) {
  const wanted = new Set(numbers
    .map(n => (n && n.startsWith('+') ? n.trim() : `+${String(n || '').trim()}`))
    .filter(isE164));

  return calls.filter(call => {
    const from = normalizeE164OrNull(call.from);
    const to   = normalizeE164OrNull(call.to);
    return (from && wanted.has(from)) || (to && wanted.has(to));
  });
}




// Get recordings with range match
async function listRecording(startTimeBefore, startTimeAfter) {
    const recordings = await client.recordings.list({
      dateCreatedBefore: startTimeBefore,
      dateCreatedAfter: startTimeAfter,
      limit: 999,
    });
  
    recordings.forEach((r) => console.log(r.accountSid));
  }


  // 🔴 UPDATED: try parent call if no recordings on this SID
async function listRecordingFromSingleCall(callOrSid) {
  const callSid = typeof callOrSid === 'string' ? callOrSid : callOrSid?.sid;
  if (!callSid) return false;

  // 1) Try recordings on this call
  let recs = await client.recordings.list({ callSid, limit: 1 });
  if (recs.length > 0) return recs[0].mediaUrl || null;

  // 2) If none, try the parent call (common when dialing SIP)
  try {
    const call = typeof callOrSid === 'object' ? callOrSid : await client.calls(callSid).fetch();
    if (call?.parentCallSid) {
      recs = await client.recordings.list({ callSid: call.parentCallSid, limit: 1 });
      if (recs.length > 0) return recs[0].mediaUrl || null;
    }
  } catch (_) {
    // swallow and fall through
  }

  return false;
}



  

/*
 // Get recordings by individual phone number
  async function listRecordingFromSingleCall(callSid) {
    const recordings = await client.recordings.list({
      callSid
    });

      let urlMedia;

      if(recordings.length > 0){
        //console.log(recordings[0].mediaUrl);
         urlMedia = await recordings[0].mediaUrl;
        return urlMedia;
      }else{
        return false;
      } 
    
  }

*/


// Get the information of a given phone number
async function getPhoneNumberInfo(phoneNumber){

  const e164 = normalizeE164OrNull(phoneNumber);
  if (!e164) return false; // <-- critical: DO NOT hit Twilio with SIP or invalid patterns

  const phoneNumberInfo = await client.incomingPhoneNumbers.list({phoneNumber, limit: 1 });
      
  if(phoneNumberInfo.length > 0){
    return phoneNumberInfo[0].friendlyName || phoneNumberInfo[0].phoneNumber;
  }else{
    return false;
  }
};



module.exports = { 
  getCalls, 
  getAllCallsToday, 
  getPhoneNumberInfo, 
  filterCallsByNumbers, 
  listRecording, 
  listRecordingFromSingleCall,
  isE164,
  isSip,
  normalizeE164OrNull,
  resolveDisplayDid
};
