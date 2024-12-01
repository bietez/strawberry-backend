// models/Ingredient.js
const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  unidadeMedida: { type: String, required: true }, // Ex: kg, g, l
  quantidadeEstoque: { type: Number, required: true, default: 0 },
  precoCusto: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Ingredient', ingredientSchema);
