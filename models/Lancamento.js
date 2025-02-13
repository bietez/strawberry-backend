// models/Lancamento.js
const mongoose = require('mongoose');

const LancamentoSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['Receita', 'Despesa'], required: true },
  nomeFuncionario: { type: String, default: '' },
  clienteFornecedor: { type: String, default: '' },
  descricao: { type: String, default: '' },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true }, // Alterado para referência
  data: { type: Date, required: true },
  valor: { type: Number, required: true },
  status: {
    type: String,
    enum: ['aberto', 'pago', 'cancelado'],
    default: 'aberto',
  },
  importId: { type: String, default: '' },
  importSource: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Lancamento', LancamentoSchema);
