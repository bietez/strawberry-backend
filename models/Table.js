// models/Table.js

const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  numeroMesa: { type: Number, required: true, unique: true },
  ambiente: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambiente', required: true },
  status: { type: String, enum: ['livre', 'reservada', 'ocupada'], default: 'livre' },
  capacidade: { type: Number, required: true, min: 1 }, // Campo capacidade
  assentos: [
    {
      numeroAssento: { type: Number, required: true },
      nomeCliente: { type: String, default: null }, // Opcional: define um valor padrão
      pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    },
  ],
  pedidos: [
    {
      produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantidade: { type: Number, required: true, min: 1 },
      preco: { type: Number, required: true, min: 0 },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Table', TableSchema);
