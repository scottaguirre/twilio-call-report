import { formatMinutes } from '/utils/formatMinutes.js';
import { updateContent } from '/utils/updateContent.js';


// Event listeners for todayCalls options
export function todayCalls (todayCallElementID, numberOfPastDays) {
    
    document.getElementById(todayCallElementID).addEventListener('click', async () => {

        updateContent('<h1>RECORDS LOADING ...</h1>', '<h1>PLEASE WAIT</h1>');

        // URL to request Calls from Twilio API
        const actualDate = new Date();
        let url = `/api/calls/allCallsToday?actualDate=${actualDate.getDate() - numberOfPastDays}&actualYear=${actualDate.getFullYear()}&actualMonth=${actualDate.getMonth() + 1}`;

        try {
            // Fetch records from Mongo Database and the compare the records against Twilio api response
            const responseFromDatabase = await fetch(`/api/records`, {
                method: 'GET',
            });

            // The DB route returns an object with an array of all the calls tha have ben checked/reported 
            // i.e. databaseRecords  = { message: "These are the records", records: [ { callSid, reported, ... }, {}, {}, ... ] }
            const databaseRecords = await responseFromDatabase.json(); 
            const dbRecords = databaseRecords.records;
    
            // Send a request to Twilio API to get all calls
            const response = await fetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Failed to generate list of numbers');
            }

            const arrayOfAllCallsToday = await response.json();

            //console.log(dbRecords);

            let listResult = `<table class="table table-striped">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Date</th>
                        <th scope="col">Customer Num.</th>
                        <th scope="col">Campaign</th>
                        <th scope="col">Twilio Num.</th>
                        <th scope="col">Duration</th>
                        <th scope="col">Recordings</th>
                        <th scope="col">Reported</th>
                    </tr>
                </thead>
                <tbody>`;

            arrayOfAllCallsToday.forEach((call, index) => {
                let isChecked = false;
                let isHidden = false;
                    
                if(dbRecords.length > 0){
                    const record = dbRecords.find(record => record.callSid === call.sid);
                    if (record && record.reported) {
                        isChecked = true;
                    }
                    if (record && record.hideRecord) {
                        isHidden = true;
                    }
                }

               

                const uniqueId = `checkbox-${call.sid}-${index}`;
                const recordingLink = call.recordingURL ? `<a href="${call.recordingURL}" target="_blank">Play</a>` : " ";
                const friendlyName = call.friendlyNumberName ? call.friendlyNumberName : '';
                
                function formatDate(dateString) {
                    const date = new Date(dateString);
                
                    let formattedDate = date.toLocaleString("en-US", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true
                    });
                
                    // Remove the comma after the day to match the exact format you want
                    return formattedDate.replace(",", "");
                }
                
                listResult += `<tr class=" ${isHidden ? "table-danger" : ""}">
                    <th scope="row">${index + 1}.</th>
                    <td class="text-center">${formatDate(call.startTime)}</td>
                    <td>${call.from}</td>
                    <td>${friendlyName}</td>
                    <td>${call.to}</td>
                    <td class="text-center">${formatMinutes(call.duration)}</td>
                    <td class="text-center">${recordingLink}</td>
                    <td class="text-center">
                        <div class="form-check form-check-inline">
                            <input class="form-check-input checkbox" type="checkbox" id="${uniqueId}" data-call-id="${call.sid}" ${isChecked ? "checked" : ""}>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input checkradio" type="radio" id="exampleRadios1" data-call-id="${call.sid}" ${isHidden ? "checked" : ""}>
                        </div>
                    </td>
                </tr>`;

            });
            
            listResult += `</tbody></table>`;
            updateContent("All Calls from Today", listResult);

            // Event delegation: Listen for checkbox and checkradio changes on the contentArea (parent container)
            document.getElementById('contentArea').addEventListener('change', async (event) => {

                // If checkbox is checked
                if (event.target && event.target.classList.contains('checkbox')) {
                    const callSid = event.target.getAttribute('data-call-id');
                    const reported = event.target.checked;

                    // Send POST request to save the checkbox state in the database
                    try {
                        const response = await fetch('/api/records/save-checkbox-state', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ callSid, reported })
                        });

                        if (!response.ok) {
                            throw new Error('Failed to save checkbox state');
                        }

                        const databaseRecord = await response.json();

                        console.log(`Checkbox state for ${databaseRecord.record.reported} saved`);

                    } catch (error) {
                        console.error('Error saving checkbox state:', error);
                    }
                }
                // If radio button is checked
                if(event.target && event.target.classList.contains('checkradio')){
                    const callSid = event.target.getAttribute('data-call-id');
                    const hideRecord = event.target.checked;
                   
                     // Send POST request to hide this record in frontend
                     try {
                        const responsefromHideRecord = await fetch(`/api/records/hideRecord`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ callSid, hideRecord})
                        });

                        if (!responsefromHideRecord.ok) {
                            throw new Error('Failed to save checkbox state');
                        }

                        const recordToHide = await responsefromHideRecord.json();

                        console.log(recordToHide.record.hideRecord);
                        if(recordToHide.record.hideRecord === true){
                            event.target.closest('tr').classList.add('table-danger');
                        }

                    } catch (error) {
                        console.error('Error saving checkbox state:', error);
                    }
                }
            });  

        } catch (error) {
            console.error('Error:', error);
            alert("Failed to generate list of numbers. Please try again.");
        } 
    });
};
