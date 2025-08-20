
    export function generateReport(xslReport, startingDate, endingDate, allPhoneNumbers){
        // Form submission for generating the report
        document.getElementById(xslReport).addEventListener('click', async (event) => {
            event.preventDefault();

            // Retrieve values from the form
            const startDate = startingDate;
            const endDate = endingDate;

            // Get selected phone numbers as an array
            const phoneNumbers = allPhoneNumbers // Extract phone numbers


            // Construct the URL for the request
            let url = `api/calls/generateReport?startDate=${startDate}&endDate=${endDate}&numbers=${phoneNumbers.join(',')}`;
            
            try {
                const response = await fetch(url, {
                    method: 'GET',
                });

                if (!response.ok) {
                    throw new Error('Failed to generate report');
                }
            
                // Get the file blob from the response
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);

                // Create a temporary link to download the file
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = 'call_report.xlsx';
                document.body.appendChild(a);
                a.click();
                a.remove();

                // Revoke the object URL after some time
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
            

            } catch (error) {
                console.error('Error:', error);
                alert("Failed to generate report. Please try again.");
            }
        });

    }
    
    