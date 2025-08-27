const client = require('../config/twilioClient');

exports.getTwilioPhoneNumbers = async (req, res) => {
    try {
        const phoneNumbers = await client.incomingPhoneNumbers.list();
        
        res.json({
            success: true,
            phoneNumbers: phoneNumbers.map(num => ({
                sid: num.sid,
                phoneNumber: num.phoneNumber,
                friendlyName: num.friendlyName,
                dateCreated: num.dateCreated
            }))
        });
    } catch (error) {
        console.error('Error fetching phone numbers:',
          error.status, error.code, error.message, error.moreInfo || '');
        res.status(500).json({ success: false, error: error.message, code: error.code });
      }
};
