// src/models/Comanda.js

const mongoose = require('mongoose');

const comandaSchema = new mongoose.Schema({
  mesa: { type: Number, required: true },
  pedidos: [{
    orderNumber: { type: Number, required: true },
    itens: [{
      quantidade: { type: Number, required: true },
      nome: { type: String, required: true },
      preco: { type: Number, required: true },
      total: { type: Number, required: true },
    }],
    total: { type: Number, required: true },
  }],
  valorTotal: { type: Number, required: true },
  tipoDesconto: { type: String, enum: ['nenhum', 'porcentagem', 'valor'], default: 'nenhum' },
  valorDesconto: { type: Number, default: 0 },
  totalComDesconto: { type: Number, required: true },
  formaPagamento: { type: String, enum: ['dinheiro', 'cartao', 'pix'], required: true },
  valorPago: { type: Number, required: true },
  troco: { type: Number, default: 0 },
  dataFinalizacao: { type: Date, default: Date.now },
  pdfPath: { type: String }, // Caminho do PDF gerado
}, { timestamps: true });

module.exports = mongoose.model('Comanda', comandaSchema);
