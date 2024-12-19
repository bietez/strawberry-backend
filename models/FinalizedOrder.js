// models/FinalizedOrder.js
const mongoose = require('mongoose');

const FinalizedOrderSchema = new mongoose.Schema({
  mesaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }], // pedidos finalizados dessa mesa
  garcom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  valorTotal: { type: Number, required: true },
  consumoPorAssento: [
    {
      assento: { type: String },
      valor: { type: Number, default: 0 },
    },
  ],
  dataFinalizacao: { type: Date, default: Date.now },
  ambienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambiente', required: true },
}, { timestamps: true });

module.exports = mongoose.model('FinalizedOrder', FinalizedOrderSchema);
