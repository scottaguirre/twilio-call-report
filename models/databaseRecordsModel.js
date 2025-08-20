const mongoose = require('mongoose');

// Define the schema for the DatabaseRecord model
const databaseRecordSchema = new mongoose.Schema({
  callSid: {
    type: String,
    required: true,
    unique: true, // Unique identifier for each call
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  friendlyName: {
    type: String,
    required: false, // Optional friendly name
  },
  duration: {
    type: Number, // Duration in seconds
    required: false,
  },
  recordingURL: {
    type: String,
    required: false, // URL to the call recording (if available)
  },
  reported: {
    type: Boolean,
    default: false, // Indicates whether the call has been reported
  },
  hideRecord: {
    type: Boolean,
    default: false, // Indicates whether the call has been reported
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Create and export the Mongoose model
const DatabaseRecord = mongoose.model('DatabaseRecord', databaseRecordSchema);

module.exports = DatabaseRecord;
