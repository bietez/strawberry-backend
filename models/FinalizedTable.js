// models/FinalizedTable.js
const mongoose = require('mongoose');

const finalizedTableSchema = new mongoose.Schema({
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
    ref: 'Employee',
  },
  pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  valorTotal: {
    type: Number,
    required: true,
  },
  dataFinalizacao: {
    type: Date,
    default: Date.now,
  },
});

const FinalizedTable = mongoose.model('FinalizedTable', finalizedTableSchema);

module.exports = FinalizedTable;
