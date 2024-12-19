// cash-register-backend/models/Config.js
const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  logotipo: { type: String, default: '' }, // URL completa da imagem do logotipo
  razaoSocial: { type: String, required: true },
  cnpj: { type: String, required: true, unique: true, match: /^\d{14}$/ },
  ie: { type: String, required: true },
  logradouro: { type: String, required: true },
  numero: { type: String, required: true },
  bairro: { type: String, required: true },
  cidade: { type: String, required: true },
  uf: { type: String, required: true },
  telefone: { type: String, required: true },
  email: { type: String, required: true, match: /.+\@.+\..+/ },
  taxaServico: { type: Number, default: 10 },
  site: { type: String, default: '' },
  observacoes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Config', ConfigSchema);
