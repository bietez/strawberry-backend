// Conteúdo de: .\models\Ambiente.js
// models/Ambiente.js
const mongoose = require('mongoose');

const AmbienteSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  limitePessoas: { type: Number, required: true },
});

module.exports = mongoose.model('Ambiente', AmbienteSchema);
