// cash-register-backend/models/Config.js
const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema(
  {
    logotipo: { type: String, default: '' }, // URL completa da imagem do logotipo
    razaoSocial: { type: String, required: true },
    nomeFantasia: { type: String, default: '' },
    cnpj: {
      type: String,
      required: true,
      // Se você quiser aceitar pontuação, mantenha esse regex:
      match: [/^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/, 'CNPJ deve estar no formato 00.000.000/0000-00'],
    },
    ie: { type: String, required: true },

    // NOVO CAMPO CEP
    cep: {
      type: String,
      default: '',
      // Se quiser validar CEP, adicione um regex, ex.: /^\d{5}-?\d{3}$/ (aceitando 99999-999)
      // match: [/^\d{5}-?\d{3}$/, 'CEP inválido']
    },

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
    draggable: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    badgeColorScheme: {
      type: [String],
      default: ['#ffffff', '#2196f3', '#ffffff'],
    },
    // printerKitchen: { type: String, default: ''},
    // printerBar: { type: String, default:''},
  },
  { timestamps: true }
);

module.exports = mongoose.model('Config', ConfigSchema);
