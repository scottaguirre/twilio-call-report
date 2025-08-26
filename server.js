require('dotenv').config();
const path = require('path');
const cors =  require('cors');
const express = require('express');
const mongoose = require('mongoose');
const dbConfig = require('./config/dbConfig');


// Routes
const callRoutes = require('./routes/calls');
const phoneRoutes = require('./routes/phoneNumbers');
const databaseRoutes = require('./routes/databaseRoutes');
const retellWebhook = require('./routes/retellWebhook');
const twilioVoice = require('./routes/twilioVoice');



const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // for form-encoded posts (Twilio style)
app.use(cors());



// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// Set up a route for `/test`
app.get('/test', (req, res) => {
    res.send(`test route is working`);
  });


  console.log('Route types:', {
    callRoutes: typeof callRoutes,
    phoneRoutes: typeof phoneRoutes,
    databaseRoutes: typeof databaseRoutes,
    retellWebhook: typeof retellWebhook,
    twilioVoice: typeof twilioVoice,
    // whatsappRoute: typeof whatsappRoute, // (you removed this one)
  });
  


// Register routes
app.use('/api/calls', callRoutes);
app.use('/api/phones', phoneRoutes);
app.use('/api/records', databaseRoutes);
app.use(retellWebhook); // exposes POST /retell/webhook
app.use('/retell/webhook', twilioVoice);


const PORT = process.env.PORT || 8888;

// Connect to MongoDB BEFORE starting the server
async function connectDB() {
  try {
    await mongoose.connect(dbConfig.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Successfully connected to MongoDB!');

    // Start the server AFTER successful connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // Exit the app if the database fails to connect
  }
};

connectDB();



