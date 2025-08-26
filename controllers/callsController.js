const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');
const {
    getCalls,
    filterCallsByNumbers,
    getPhoneNumberInfo,
    listRecordingFromSingleCall,
    getAllCallsToday,
    isE164,
    normalizeE164OrNull,
    resolveDisplayDid
 } = require('../utils/twilioHelpers'); // Import helper functions



// prefer the parent inbound leg (E.164 `to`) over SIP child
function dedupeByAnchor(calls) {
  const byAnchor = new Map();
  for (const c of calls) {
    const anchor = c.parentCallSid || c.sid; // parent groups the child
    // score: prefer inbound leg with real DID in `to`
    const score =
      (isE164(c.to) ? 10 : 0) +
      (c.direction === 'inbound' ? 5 : 0) +
      (c.status === 'completed' ? 1 : 0);

    const current = byAnchor.get(anchor);
    if (!current || score > current.score) byAnchor.set(anchor, { call: c, score });
  }
  return Array.from(byAnchor.values()).map(v => v.call);
}




// Prefer 'to' if it's E.164; else use 'from'; else null
function pickDidForLookup(call) {
    const to = normalizeE164OrNull(call.to);
    if (to) return to;
    const from = normalizeE164OrNull(call.from);
    if (from) return from;
    return null;
  }
  



exports.generateCallReport = async (req, res) => {
    try {
        
        const startTimeAfter = req.query.startDate + ` 00:00:00`; 
        const endDate= new Date(req.query.endDate); // Convert the endDate string to a date object and add 1 more day
        // Add 1 more day to the endDate
        endDate.setDate(endDate.getDate() + 1);
        const startTimeBefore = `${endDate.toISOString().split('T')[0]} 00:00:00`;
        const { numbers } = req.query;

        // Validate required query parameters
        if (!req.query.startDate || !req.query.endDate || !numbers) {
            return res.status(400).json({ success: false, message: 'Missing required parameters (startDate, endDate, numbers)' });
        }

         // Ensure numbers are formatted correctly (add "+" if missing)
        const phoneNumbers = numbers.split(',').map(num => {
            num = num.trim(); // Remove extra spaces
            return num.startsWith('+') ? num : `+${num}`; // Add "+" if missing
        });

        // Use the helper function to fetch calls. It returns an array of calls
        const calls = await getCalls(startTimeBefore, startTimeAfter);
        

        // Filter calls by phone numbers
        const filteredCalls = filterCallsByNumbers(calls, phoneNumbers);


        // If no calls match, return a message
        if (filteredCalls.length === 0) {
            return res.status(404).json({ success: false, message: 'No calls found for the given phone numbers in the specified date range' });
        }


        // Create an Excel sheet
        const wb = xlsx.utils.book_new();
        const ws_data = [
            ['Call Time', 'Client Number', 'Campaign Name', 'Recording URL'],
            ...(await Promise.all(filteredCalls.map(async (call) => {
              const when = call.startTime ? new Date(call.startTime).toLocaleString() : '';
              const clientNumber = call.fromFormatted || call.from || '';
              const didForLookup = pickDidForLookup(call);            // <- E.164 or null
              const campaignName = didForLookup ? (await getPhoneNumberInfo(didForLookup) || '') : '';
              const recording = await listRecordingFromSingleCall(call.sid) || ' ';
              return [when, clientNumber, campaignName, recording];
            })))
          ];
          
        

        const ws = xlsx.utils.aoa_to_sheet(ws_data);
        xlsx.utils.book_append_sheet(wb, ws, 'Call Report');

        // Define the file path and save the report
        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir); // Create reports directory if it doesn't exist
        }
        
        const filePath = path.join(reportsDir, 'call_report.xlsx');
        xlsx.writeFile(wb, filePath);

        // Send the file as a download and clean up afterwards
        res.download(filePath, 'call_report.xlsx', (err) => {
            if (!err) {
                fs.unlinkSync(filePath); // Delete file after sending it
            } else {
                console.error('Error sending file:', err);
            }
        });


    } catch (error) {
        console.error('Error generating call report:', error);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
    
};



exports.generateDateRangeCalls = async (req, res) => {
    try {
        
        const startTimeAfter = req.query.startDate + ` 00:00:00`; 
        const endDate= new Date(req.query.endDate); // Convert the endDate string to a date object and add 1 more day
        // Add 1 more day to the endDate
        endDate.setDate(endDate.getDate() + 1);
        const startTimeBefore = `${endDate.toISOString().split('T')[0]} 00:00:00`;
        const { numbers } = req.query;

        // Validate required query parameters
        if (!req.query.startDate || !req.query.endDate || !numbers) {
            return res.status(400).json({ success: false, message: 'Missing required parameters (startDate, endDate, numbers)' });
        }

         // Ensure numbers are formatted correctly (add "+" if missing)
        const phoneNumbers = numbers.split(',').map(num => {
            num = num.trim(); // Remove extra spaces
            return num.startsWith('+') ? num : `+${num}`; // Add "+" if missing
        });

        // Use the helper function to fetch calls. It returns an array of calls
        const calls = await getCalls(startTimeBefore, startTimeAfter);
        

        // Filter calls by phone numbers
        let filteredCalls = filterCallsByNumbers(calls, phoneNumbers);
        filteredCalls = dedupeByAnchor(filteredCalls);

        // If no calls match, return a message
        if (filteredCalls.length === 0) {
            return res.status(404).json({ success: false, message: 'No calls found for the given phone numbers in the specified date range' });
        }


        // Ensure objects are modifiable/convert twilio's object to JS object & Wait for all recording URLs to resolve
        const parentCache = new Map(); // cache parent calls per request

        const callings = await Promise.all(filteredCalls.map(async (call) => {
        const { did, formatted } = await resolveDisplayDid(call, parentCache);
        const friendlyName = did ? (await getPhoneNumberInfo(did) || null) : null;

        return {
            sid: call.sid,
            from: call.fromFormatted || call.from,
            to: call.toFormatted || call.to,
            duration: call.duration,
            startTime: call.startTime,
            endTime: call.endTime,
            status: call.status,
            recordingURL: await listRecordingFromSingleCall(call.sid),

            // NEW fields for your frontend:
            twilioDid: did,                 // e.g. "+14155551234"
            twilioNumDisplay: formatted || did, // a nice string to render
            friendlyNumberName: friendlyName,
        };
        }));

          
        
        res.status(200).json({message: "success", records: callings});

    } catch (error) {
        console.error('Error generating call report:', error);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
    
};


exports.generateAllCallsToday = async (req, res) => {
    try {
        
        const { actualDate, actualYear, actualMonth } = req.query;
        const todayDate = { actualDate, actualYear, actualMonth };
       
        //It gets an array of all calls from Today
        let allCallsToday = await getAllCallsToday(todayDate);
        allCallsToday = dedupeByAnchor(allCallsToday);
       

        // Ensure objects are modifiable/convert twilio's object to JS object & Wait for all recording URLs to resolve
        const parentCache = new Map();

        const callings = await Promise.all(allCallsToday.map(async (callToday) => {
        const { did, formatted } = await resolveDisplayDid(callToday, parentCache);
        const friendlyName = did ? (await getPhoneNumberInfo(did) || null) : null;

        return {
            sid: callToday.sid,
            from: callToday.fromFormatted || callToday.from,
            to: callToday.toFormatted || callToday.to,
            duration: callToday.duration,
            startTime: callToday.startTime,
            endTime: callToday.endTime,
            status: callToday.status,
            recordingURL: await listRecordingFromSingleCall(callToday.sid),

            // NEW:
            twilioDid: did,
            twilioNumDisplay: formatted || did,
            friendlyNumberName: friendlyName,
        };
        }));      
        
        res.json(callings);

    } catch (error) {
        console.error('Error generating call report:', error);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
    
};


exports.getRecordings = async (req, res) => {
    try {
      const { callSid } = req.query;
      if (!callSid) {
        return res.status(400).json({ success: false, message: 'Missing required parameter: callSid' });
      }
      const url = await listRecordingFromSingleCall(callSid);
      return res.json({ success: true, recordingURL: url || null });
    } catch (error) {
      console.error('Error fetching recording:', error);
      res.status(500).json({ success: false, message: 'Error fetching recording' });
    }
  };
  