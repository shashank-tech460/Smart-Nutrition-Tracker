const express = require('express');
const router = express.Router();
// const User = require('../models/UserModel');
const User = require('../models/userModel');
const { sendOtpEmail } = require('../services/mailService');
const bcrypt = require('bcryptjs');

// Generate OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /register/generate-otp
router.post('/generate-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.json({ success: false, message: "Email is required" });

        let user = await User.findOne({ email });
        if (!user) user = new User({ email });

        const otp = generateOtp();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
        await user.save();

        await sendOtpEmail(email, otp);
        console.log(`OTP for ${email}: ${otp}`);

        res.json({ success: true, message: "OTP generated & sent" });
    } catch (err) {
        console.error('Error in /register/generate-otp:', err && err.stack ? err.stack : err);
        // Return the error message for easier debugging (remove in production)
        res.json({ success: false, message: err && err.message ? err.message : 'Server error' });
    }
});

// POST /register/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { name, email, password, age, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.json({ success: false, message: "User not found" });

        if (user.otp !== otp || user.otpExpiry < new Date()) {
            return res.json({ success: false, message: "Invalid or expired OTP" });
        }

        user.name = name;
        user.password = await bcrypt.hash(password, 10); // hash password
        user.age = age;
        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;

        await user.save();
        res.json({ success: true, message: "User registered successfully" });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Server error" });
    }
});

module.exports = router;
