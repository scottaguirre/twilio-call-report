import { todayCalls } from './todayCalls.js';
import { handleFormSubmission } from './handleFormSubmission.js';
import { listOfActivePhoneNumbers } from './listOfActivePhoneNumbers.js';
import { loadTodayCallsOnPageLoad } from './loadTodayCallsOnPageLoad.js';
import { populateDropboxWithNumbers } from './populateDropboxWithNumbers.js';


document.addEventListener('DOMContentLoaded', () => {
    $('.selectpicker').selectpicker(); // Initialize Bootstrap-Select
    
    // Get all the calls made today and print it to the front end on page load
    loadTodayCallsOnPageLoad(0)
    //const contentArea = document.getElementById('contentArea');

    // Populate Dropbox menu with all the active numbers retrieved from Twilio API when page is loaded
    populateDropboxWithNumbers();
    
    // Retrieve a list of all calls made today (todays' date - 0 day = today).
    // 'todayCalls' argumet is the <a href> getElementById from index.html 
    todayCalls('todayCalls', 0);

    // Retrieve a list of all calls made yesteday (todays' date - 1 day = yesterday)
    todayCalls('yesterdayCalls', 1);

    // Retrieve a list of all calls made 2 days ago from the date the request is made
    todayCalls('twoDaysAgoCalls', 2);

    // Retrieve a list of all calls made 3 days ago from the date the request is made
    todayCalls('threeDaysAgoCalls', 3);

    // Fetch and display a list of active phone numbers
    listOfActivePhoneNumbers();

    // Form submission for range date selection
    handleFormSubmission('reportForm');
    
});
