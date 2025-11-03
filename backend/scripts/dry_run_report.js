const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');

// Monkey-patch mail service to prevent real emails and instead log the content
const mailServicePath = path.join(__dirname, '..', 'services', 'mailService.js');
const mailService = require(mailServicePath);
mailService.sendReportEmail = async (email, content, subject) => {
  console.log('--- DRY-RUN: sendReportEmail called ---');
  console.log('To:', email);
  console.log('Subject:', subject || 'Your Daily Activity Report');
  console.log('Content:\n', content);
  // return a fake nodemailer response
  return Promise.resolve({ response: 'DRY_RUN_OK' });
};

// Require the report generator after patching mail service
const generateDailyReport = require(path.join(__dirname, '..', 'Controllers', 'reportController'));

(async () => {
  try {
    const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/nutrify';
    console.log('Connecting to DB at', MONGO);
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('DB connected');

    // optional date argument (ISO) can be passed as first arg; default is yesterday inside generator
    const forDate = process.argv[2];
    console.log('Running generateDailyReport (dry-run) for date:', forDate || 'yesterday');
    await generateDailyReport({ forDate });
    console.log('generateDailyReport (dry-run) finished');
    process.exit(0);
  } catch (err) {
    console.error('Error during dry-run:', err);
    process.exit(1);
  }
})();
