
const DatabaseRecord = require('../models/databaseRecordsModel'); // Your Mongoose model


// Function to retrieve all Twilio records from the database
exports.getAllRecords = async (req, res) => {
  try {
    const records = await DatabaseRecord.find(); // Mongoose equivalent of 'findAll'
    return res.status(200).json({message: "These are the records", records});
  } catch (error) {
    throw new Error(`Error fetching records: ${error.message}`);
  }
};

// Function to retrieve a specific Twilio record by its ID from the database
exports.getRecordById = async (req, res ) => {
  const callSid = req.params.callSid;
  console.log(callSid);
  try {
    
    const record = await DatabaseRecord.findOne({ callSid }); // Mongoose equivalent of 'findOne'
    console.log(record);
    return res.json(record);
  } catch (error) {
    throw new Error(`Error fetching records by ID: ${error.message}`);
  }
};

// Function to add or update a Twilio record in the database
exports.addOrUpdateRecord = async (req, res) => {
  const callData = req.body;
  try {
    const record = await DatabaseRecord.findOneAndUpdate(
      { callSid: callData.callSid }, // Find the record by callSid
      callData, // Update the record with new data
      { new: true, upsert: true } // upsert: true creates a new record if it doesn't exist
    );
    if (record.isNew) {
      return res.status(200).json({ 
        message: 'New record created',
        record: record, // Return the created record
      });
    } else {
      return res.status(200).json({ 
        message: 'Record updated',
        record: record // Return the updated record
      });
    }
  } catch (error) {
    throw new Error(`Error adding/updating record to DB: ${error.message}`);
  }
};

// Function to post a record to the DB with hideRecord = true. It hides that Twilio record on the frontend
exports.hideRecord = async (req, res) => { 
  try {
    const callData = req.body;
    const record = await DatabaseRecord.findOneAndUpdate(
      { callSid: callData.callSid }, // Find the record by callSid
      callData, // Update the record with new data
      { new: true, upsert: true } // upsert: true creates a new record if it doesn't exist
    );
    if (record.isNew) {
      return res.status(200).json({ 
        message: 'New record created to hide record in frontend',
        record: record, // Return the created record
      });
    } else {
      return res.status(200).json({ 
        message: 'Record updated',
        record: record // Return the updated record
      });
    }
  } catch (error) {
    throw new Error(`Error creating/updating record to DB: ${error.message}`);
  }
};


// Function to delete a Twilio record from the database
exports.deleteRecord = async (req, res) => {
  try {
    const callSid = req.params.callSid;
    const result = await DatabaseRecord.deleteOne({ callSid }); // Mongoose equivalent of 'destroy'
    if (result.deletedCount > 0) {
      console.log('Record deleted', result);
      return res.status(200).json({sucess: true, callSid});
  
    } else {
      console.log('No record found to delete');
      return false;
    }
  } catch (error) {
    throw new Error(`Error deleting record: ${error.message}`);
  }
};

