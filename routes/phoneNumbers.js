const express = require('express');
const { getTwilioPhoneNumbers } = require('../controllers/phoneNumbersController');
const router = express.Router();

router.get('/getPhoneNumbers', getTwilioPhoneNumbers);

module.exports = router;
