// config/brandConfig.js
require('dotenv').config();

const E164 = /^\+\d{7,15}$/;
const toE164 = n => (typeof n === 'string' && E164.test(n.trim())) ? n.trim() : null;

// Plain string keys (your real DIDs). Add more as you buy numbers.
const BRANDS = {
  '+17262270052': {
    agentId: process.env.RETELL_AGENT_SAN_ANTONIO,
    businessName: 'San Antonio Lemon Law',
    city: 'San Antonio, TX',
    state: 'TX'
  },
  '+16192685487': {
    agentId: process.env.RETELL_AGENT_SAN_DIEGO,
    businessName: 'San Diego Lemon Law',
    city: 'San Diego, CA',
    state: 'CA'
  },
  '+13467912149': {
    agentId: process.env.RETELL_AGENT_HOUSTON,
    businessName: 'Houston Lemon Law',
    city: 'Houston, TX',
    state: 'TX'
  },
  '+17372349950': {
    agentId: process.env.RETELL_AGENT_AUSTIN,
    businessName: 'Austin Lemon Law',
    city: 'Austin, TX',
    state: 'TX'
  },
  '+14156251220': {
    agentId: process.env.RETELL_AGENT_SAN_FRANCISC0,
    businessName: 'San Francisco Lemon Law',
    city: 'San Francisco, CA',
    state: 'CA'
  },
  '+15592725473': {
    agentId: process.env.RETELL_AGENT_FRESNO,
    businessName: 'Fresno Lemon Law',
    city: 'Fresno, CA',
    state: 'CA'
  },
  '+19168663567': {
    agentId: process.env.RETELL_AGENT_SACRAMENTO,
    businessName: 'Sacramento Lemon Law',
    city: 'Sacramento, CA',
    state: 'CA'
  }
};



// Fallback if a DID isn’t mapped yet
const DEFAULT_BRAND = {
  agentId: process.env.RETELL_AGENT_FALLBACK || process.env.RETELL_AGENT_HOUSTON,
  businessName: 'Default Intake',
  city: null,
  state: null
};

function getBrandByDid(did) {
  const key = (typeof did === 'string' ? did.trim() : null);
  return (key && BRANDS[key]) ? BRANDS[key] : DEFAULT_BRAND;
}

module.exports = { BRANDS, getBrandByDid };
