// models/FinalizedTable.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const FinalizedTableSchema = new Schema({
  numeroMesa: {
    type: Number,
    required: false,      // AGORA não é mais obrigatório
    default: 0           // Se for pedido de entrega, pode usar 9999 ou 0
  },
  ambienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Ambiente',
    required: false       // Permite que seja nulo ou que a gente preencha com "Entrega"
  },
  garcomId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  pedidos: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    }
  ],
  valorTotal: { type: Number, required: true, default: 0 },
  formaPagamento: { type: [String], default: [] },
  valorPago: { type: Number, required: true, default: 0 },
  tipoDesconto: {
    type: String,
    enum: ['nenhum', 'porcentagem', 'valor'],
    default: 'nenhum'
  },
  valorDesconto: { type: Number, default: 0 },
  valorTaxaServico: { type: Number, default: 0 },
  cobrarTaxaServico: { type: Boolean, default: false },
  dataFinalizacao: { type: Date, default: Date.now },
  pdfPath: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('FinalizedTable', FinalizedTableSchema);
