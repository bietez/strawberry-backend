// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  assentos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat' }],
  itens: [{
    receita: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    quantidade: { type: Number, required: true },
    modificacoes: String, // Ex: Sem cebola, carne ao ponto
  }],
  status: { type: String, enum: ['Pendente', 'Preparando', 'Pronto', 'Entregue'], default: 'Pendente' },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  garcom: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  total: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
