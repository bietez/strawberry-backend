// models/SalesGoal.js

const mongoose = require('mongoose');

const SalesGoalSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Adicionado
  goalName: { type: String, required: true },
  goalAmount: { type: Number, required: true, min: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
}, { timestamps: true });

// Middleware para garantir que endDate é após startDate
SalesGoalSchema.pre('save', function (next) {
  if (this.endDate && this.endDate <= this.startDate) {
    return next(new Error('endDate deve ser posterior a startDate'));
  }
  next();
});

module.exports = mongoose.model('SalesGoal', SalesGoalSchema);
