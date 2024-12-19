const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  metodoPagamento: { type: String, required: true }, // Ex: Dinheiro, Cartão, PIX
  valorPago: { type: Number, required: true },
  troco: { type: Number, default: 0 },
  notaFiscalEmitida: { type: Boolean, default: false },
  dataPagamento: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pago', 'Cancelado'], default: 'Pago' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
