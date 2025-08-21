const client = require('../config/twilioClient');


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




/* async function getAllCallsToday(todayDate) {
  console.log(todayDate.actualMonth);
  const todayIs = `${todayDate.actualYear}-${todayDate.actualMonth}-${todayDate.actualDate} 00:00:00`;
  return await client.calls.list({
      startTime: new Date(todayIs),
      limit: 400
  });
}
*/

// Filter an array of calls by phone number[s]
function filterCallsByNumbers(calls, numbers) {
  const numberSet = new Set(numbers); // Convert array to Set for faster lookups
  return calls.filter(call => numberSet.has(call.from) || numberSet.has(call.to));
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

// Get the information of a given phone number
async function getPhoneNumberInfo(phoneNumber){
 
      const phoneNumberInfo = await client.incomingPhoneNumbers.list({phoneNumber, limit: 1 });
      
      if(phoneNumberInfo.length > 0){
        return phoneNumberInfo[0].friendlyName;
      }else{
        return false;
      }
};


module.exports = { getCalls, getAllCallsToday, getPhoneNumberInfo, filterCallsByNumbers, listRecording, listRecordingFromSingleCall };
