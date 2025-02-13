// models/Order.js

const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  displayId: String,
  orderType: String,
  payments: Object,
  merchant: Object,
  salesChannel: String,
  category: String,
  picking: Object,
  orderTiming: String,
  createdAt: Date,
  total: Object,
  preparationStartDateTime: Date,
  items: Array,
  customer: Object,
  extraInfo: String,
  additionalFees: Array,
  delivery: Object,
  schedule: Object,
  indoor: Object,
  dineIn: Object,
  takeout: Object,
  // Adicione outros campos conforme necessário
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
