// models/Comanda.js

const mongoose = require('mongoose');

const ComandaSchema = new mongoose.Schema({
  mesa: {
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
  pedidos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  }],
  valorTotal: {
    type: Number,
    required: true,
  },
  formaPagamento: [{
    type: String,
    enum: ['dinheiro', 'cartao', 'pix'],
    required: true,
  }],
  valorPago: {
    type: Number,
    required: true,
  },
  tipoDesconto: {
    type: String,
    enum: ['nenhum', 'porcentagem', 'valor'],
    default: 'nenhum',
  },
  valorDesconto: {
    type: Number,
    default: 0,
  },
  cobrarTaxaServico: {
    type: Boolean,
    default: false,
  },
  valorTaxaServico: {
    type: Number,
    default: 0,
  },
  troco: {
    type: Number,
    default: 0,
  },
  dataFinalizacao: {
    type: Date,
    default: Date.now,
  },
  pdfPath: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Comanda', ComandaSchema);
