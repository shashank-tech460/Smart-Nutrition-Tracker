const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    age: { type: Number, min: 12 },
    otp: { type: String },
    otpExpiry: { type: Date },
    isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
module.exports = User;
