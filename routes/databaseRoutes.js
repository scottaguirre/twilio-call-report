const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');


// Route to fetch all records from the database
router.get('/', databaseController.getAllRecords);

// Route to fetch a specific record by callSid (optional)
router.get('/:callSid', databaseController.getRecordById);

// Route to insert a record to the database
router.post('/save-checkbox-state', databaseController.addOrUpdateRecord);

// Route to insert/update a record to the database to be hid a record from Twilio in the frontend
router.post('/hideRecord', databaseController.hideRecord);

// Route to delete a record from the database
router.delete('/:callSid', databaseController.deleteRecord);

module.exports = router;
