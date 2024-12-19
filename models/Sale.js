// models/Sale.js

const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  salesGoal: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesGoal', required: true },
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  // Outros campos relevantes
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);
