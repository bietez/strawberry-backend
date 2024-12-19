const mongoose = require('mongoose');

const AmbienteSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  limitePessoas: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Ambiente', AmbienteSchema);
