const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');
const { getCalls, filterCallsByNumbers, getPhoneNumberInfo, listRecordingFromSingleCall, getAllCallsToday } = require('../utils/twilioHelpers'); // Import helper functions



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
            ...(await Promise.all(filteredCalls.map(async (call) => [
                new Date(call.startTime).toLocaleString(),
                call.fromFormatted,
                await getPhoneNumberInfo(call.to),
                await listRecordingFromSingleCall(call.sid) || ` `
            ])))
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
        const filteredCalls = filterCallsByNumbers(calls, phoneNumbers);


        // If no calls match, return a message
        if (filteredCalls.length === 0) {
            return res.status(404).json({ success: false, message: 'No calls found for the given phone numbers in the specified date range' });
        }


        // Ensure objects are modifiable/convert twilio's object to JS object & Wait for all recording URLs to resolve
        let callings = await Promise.all(filteredCalls.map(async (call) => {
          
            return {
                sid: call.sid,
                from: call.fromFormatted,
                to: call.toFormatted,
                duration: call.duration,
                startTime: call.startTime,
                endTime: call.endTime,
                status: call.status,
                recordingURL: await listRecordingFromSingleCall(call.sid),
                friendlyNumberName: await getPhoneNumberInfo(call.to)
            }
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
       

        // Ensure objects are modifiable/convert twilio's object to JS object & Wait for all recording URLs to resolve
        let callings = await Promise.all(allCallsToday.map(async (callToday) => {
          
            return {
                sid: callToday.sid,
                from: callToday.fromFormatted,
                to: callToday.toFormatted,
                duration: callToday.duration,
                startTime: callToday.startTime,
                endTime: callToday.endTime,
                status: callToday.status,
                recordingURL: await listRecordingFromSingleCall(callToday.sid),
                friendlyNumberName: await getPhoneNumberInfo(callToday.to)
            }
        }));
        
        res.json(callings);

    } catch (error) {
        console.error('Error generating call report:', error);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
    
};


exports.getRecordings = async (req, res) => {
    try{

        //Array of recordings Url
        const recordingsArray = await Promise.all(listRecordingFromSingleCall(call.sid));
        res.json(recordingsArray);

    } catch (error){
        console.error('Error generating call report:', error);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
}