// config/dbconfig.js
require('dotenv').config(); // Load environment variables from .env

module.exports = {
  uri: process.env.MONGO_URI || 'mongodb://localhost:27017/twilio_database' // Default to local MongoDB
};
