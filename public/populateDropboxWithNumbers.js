// Function to populate the dropdown with Twilio numbers
export async function populateDropboxWithNumbers() {
    try {
        // Fetch phone numbers from the backend
        const response = await fetch(`/api/phones/getPhoneNumbers`);
        const data = await response.json();

        if (!data.success) {
            throw new Error('Failed to fetch Twilio phone numbers');
        }

        const phoneNumbersSelect = document.getElementById('phoneNumbers');
        // Clear existing options
        phoneNumbersSelect.innerHTML = '';

        // Populate dropdown with phone numbers
        data.phoneNumbers.forEach(number => {
            const option = document.createElement('option');
            option.value = number.phoneNumber;
            option.textContent = number.friendlyName ? `${number.friendlyName}` : number.phoneNumber;
            phoneNumbersSelect.appendChild(option);

            // Refresh Bootstrap-Select
            $('#phoneNumbers').selectpicker('refresh');
            
        });
    } catch (error) {
        console.error('Error populating phone numbers:', error);
    }
}