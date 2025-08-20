const express = require('express');
const { generateCallReport, generateAllCallsToday, generateDateRangeCalls, getRecordings } = require('../controllers/callsController');
const router = express.Router();

router.get('/recordings', getRecordings);
router.get('/generateReport', generateCallReport);
router.get('/allCallsToday', generateAllCallsToday);
router.get('/allCallsDateRange', generateDateRangeCalls);

//router.get('/callsTodayByNumber', generateCallsByNumber);

module.exports = router;
