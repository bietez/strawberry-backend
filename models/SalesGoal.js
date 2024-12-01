// models/SalesGoal.js
const mongoose = require('mongoose');

const salesGoalSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  goalName: { type: String, required: true },
  goalAmount: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
});

module.exports = mongoose.model('SalesGoal', salesGoalSchema);
