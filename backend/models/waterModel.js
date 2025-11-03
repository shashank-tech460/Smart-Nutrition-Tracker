const mongoose = require('mongoose');

const waterSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    // store ISO date string YYYY-MM-DD for easy querying
    type: String,
    required: true
  },
  waterConsumed: {
    type: Number,
    default: 0 // in liters
  }
}, { timestamps: true });

const WaterModel = mongoose.model('WaterIntake', waterSchema);
module.exports = WaterModel;
