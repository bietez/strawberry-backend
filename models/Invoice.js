// models/Invoice.js
const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  numeroFatura: { type: String, required: true, unique: true },
  dataEmissao: { type: Date, default: Date.now },
  valorTotal: { type: Number, required: true },
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
