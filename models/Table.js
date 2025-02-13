const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  seatSeparation: { type: Boolean, default: false },
  numeroMesa: { type: Number, required: true, unique: true },
  ambiente: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambiente', required: true },
  status: { type: String, enum: ['livre', 'reservada', 'ocupada', 'suja'], default: 'livre' },
  formato: { type: String, enum: ['quadrada', 'circular'], default: 'quadrada' },
  capacidade: { type: Number, required: true, min: 1 },
  garcomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  assentos: [
    {
      numeroAssento: { type: Number, required: true },
      nomeCliente: { type: String, default: null },
      pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    },
  ],
  posicao: [
    {
      pos_x: { type: Number, default: 0 },
      pos_y: { type: Number, default: 0 },
      width: { type: Number, default: 120 },
      height: { type: Number, default: 120 },
    }
  ],
  rotation: { type: Number, default: 0 },
  pedidos: [
    {
      produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantidade: { type: Number, required: true, min: 1 },
      preco: { type: Number, required: true, min: 0 },
    },
  ],
  occupiedSince: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Table', TableSchema);
