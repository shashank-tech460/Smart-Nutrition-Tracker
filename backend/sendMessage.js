// sendMessages.js or inside server.js

const twilio = require('twilio');
const UserInfoModel = require('./models/UserInfoModel'); // Import your model

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Twilio account SID
const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Twilio Auth Token
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Your Twilio phone number

let client = null;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
} else {
    console.warn('Twilio credentials not provided. sendMessageToAllUsers will be a no-op.');
}

const sendMessageToAllUsers = async (message) => {
    try {
        const users = await UserInfoModel.find({ contactNumber: { $exists: true, $ne: null } });

        for (const user of users) {
            // Normalize contact number (remove spaces, dashes)
            let contact = String(user.contactNumber || '').replace(/[^0-9]/g, '');
            if (!contact) continue;

            // Prepend country code only if missing; naive check for leading +
            let formattedNumber = contact.startsWith('+' ) ? contact : `+91${contact}`;

            if (!client) {
                console.log(`[MOCK] Would send to ${formattedNumber}: ${message}`);
                continue;
            }

            await client.messages.create({
                body: message,
                from: twilioPhoneNumber,
                to: formattedNumber,
            });
            console.log(`Message sent to ${formattedNumber}`);
        }
    } catch (error) {
        console.error('Error sending messages:', error);
    }
};

module.exports = sendMessageToAllUsers;
