// models/Ingredient.js
const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  unidadeMedida: { type: String, required: true }, // Ex: kg, g, l, etc.
  quantidadeEstoque: { type: Number, required: true, default: 0 },
  precoCusto: { type: Number, required: true },
  imagem: { type: String, default: 'https://via.placeholder.com/150' }, // Novo campo de imagem
}, { timestamps: true });

module.exports = mongoose.model('Ingredient', IngredientSchema);
