import { updateContent } from '/utils/updateContent.js';

// Fetch and display real phone numbers dynamically
export function listOfActivePhoneNumbers(){
    document.getElementById('listNumbers').addEventListener('click', async () => {
        let url = `/api/phones/getPhoneNumbers`;

        try {
            const response = await fetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Failed to generate list of numbers');
            }

            const list = await response.json();

            let listResult = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Phone Number</th>
                        <th scope="col">Campaign</th>
                     </tr>
                </thead>
            <tbody>`;

            list.phoneNumbers.forEach((number, index) => {
                listResult += `
                <tr>
                    <th scope="row"> ${index + 1}.</th>
                        <td>${number.phoneNumber.slice(2)}</td>
                        <td>${number.friendlyName}</td>
                </tr>`;
            });

            listResult += `</tbody></table>`;

            updateContent("List of Numbers", listResult);

        } catch (error) {
            console.error('Error:', error);
            alert("Failed to generate list of numbers. Please try again.");
        }

    });
    document.getElementById('listNumbers').addEventListener('click', async () => {
        let url = `/api/phones/getPhoneNumbers`;

        try {
            const response = await fetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Failed to generate list of numbers');
            }

            const list = await response.json();

            let listResult = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Phone Number</th>
                        <th scope="col">Campaign</th>
                     </tr>
                </thead>
            <tbody>`;

            list.phoneNumbers.forEach((number, index) => {
                listResult += `
                <tr>
                    <th scope="row"> ${index + 1}.</th>
                        <td>${number.phoneNumber.slice(2)}</td>
                        <td>${number.friendlyName}</td>
                </tr>`;
            });

            listResult += `</tbody></table>`;

            updateContent("List of Numbers", listResult);

        } catch (error) {
            console.error('Error:', error);
            alert("Failed to generate list of numbers. Please try again.");
        }

    });
};