const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter configuration on startup and log helpful info
transporter.verify((err, success) => {
    if (err) {
        console.error('Mailer verification failed. Check EMAIL_USER / EMAIL_PASS and provider settings. Error:', err && err.message ? err.message : err);
    } else {
        console.log('Mailer is configured and ready to send messages.');
    }
});

const sendOtpEmail = (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Registration',
        text: `Your OTP is: ${otp}. It will expire in 5 minutes.`
    };

    return transporter.sendMail(mailOptions);
};

const sendReportEmail = (email, content, subject = 'Your Daily Activity Report') => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        text: content
    };

    return transporter.sendMail(mailOptions);
};

const verifyTransporter = () => new Promise((resolve, reject) => transporter.verify((err, success) => err ? reject(err) : resolve(success)));

module.exports = { sendOtpEmail, sendReportEmail, verifyTransporter };
