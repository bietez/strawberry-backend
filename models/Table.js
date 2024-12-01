// models/Table.js
const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  numeroMesa: { type: Number, required: true, unique: true },
  status: { type: String, enum: ['livre', 'ocupada', 'reservada'], default: 'livre' },
  capacidade: { type: Number, required: true },
  ambiente: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambiente', required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  assentos: [
    {
      numeroAssento: { type: Number, required: true },
      nomeCliente: { type: String },
      pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    },
  ],
  available: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('Table', TableSchema);
