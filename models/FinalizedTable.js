// src/models/FinalizedTable.js
const mongoose = require('mongoose');

const FinalizedTableSchema = new mongoose.Schema({
  numeroMesa: {
    type: Number,
    required: true,
  },
  ambienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambiente',
    required: true,
  },
  garcomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  valorTotal: {
    type: Number,
    required: true,
  },
  formaPagamento: { type: String, enum: ['dinheiro', 'cartao', 'pix'], default: 'dinheiro' },
  valorPago: { type: Number, default: 0 },
  tipoDesconto: { type: String, enum: ['nenhum', 'porcentagem', 'valor'], default: 'nenhum' },
  valorDesconto: { type: Number, default: 0 },
  dataFinalizacao: {
    type: Date,
    default: Date.now,
  },
  pdfPath: { type: String }, // Caminho do PDF gerado
}, { timestamps: true });

module.exports = mongoose.model('FinalizedTable', FinalizedTableSchema);
