const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  cpfCnpj: { type: String, unique: true, sparse: true }, // CPF ou CNPJ
  nome: { type: String, required: true },
  contato: { type: String }, // Novo campo
  telefone: { type: String },
  whatsapp: { type: String }, // Novo campo
  email: { type: String, unique: true, sparse: true },
  cep: { type: String }, // Novo campo
  rua: { type: String },
  numero: { type: String },
  complemento: { type: String },
  bairro: { type: String },
  cidade: { type: String },
  estado: { type: String },
  pontosFidelidade: { type: Number, default: 0 },
  historicoPedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
}, { timestamps: true });

// Removido: índices duplicados
// customerSchema.index({ cpfCnpj: 1 }, { unique: true, sparse: true });
// customerSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Customer', customerSchema);
