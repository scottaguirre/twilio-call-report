// config/brandConfig.js
require('dotenv').config();

// helper to normalize E.164
const E164 = /^\+\d{7,15}$/;
const e164 = n => (typeof n === 'string' && E164.test(n.trim())) ? n.trim() : null;

// Map each Twilio DID to a Retell agent + brand info
module.exports = {
  // EXAMPLES — replace with your real numbers and agent IDs
  [e164('+17262270052')]: {
    agentId: process.env.RETELL_AGENT_SAN_ANTONIO,
    businessName: 'San Antonio Lemon Law',
    city: 'San Antonio, TX',
  },
  [e164('+14156251220')]: {
    agentId: process.env.RETELL_AGENT_SAN_FRANCISCO,
    businessName: 'San Francisco Lemon Law',
    city: 'San Francisco, CA',
  },
  [e164('+13467912149')]: {
    agentId: process.env.RETELL_AGENT_HOUSTON,
    businessName: 'Houston Lemon Law',
    city: 'Houston, TX',
  }
};
