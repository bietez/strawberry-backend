const mongoose = require('mongoose');

const AmbienteSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  limitePessoas: { type: Number, required: true },
  order: { type: Number, default: 0 }, // Novo campo de ordenação

}, { timestamps: true });

module.exports = mongoose.model('Ambiente', AmbienteSchema);
