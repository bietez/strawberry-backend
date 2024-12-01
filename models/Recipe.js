// models/Recipe.js
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  categoria: { type: String, required: true }, // Ex: Entrada, Prato Principal
  ingredientes: [{
    ingrediente: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    quantidade: { type: Number, required: true },
  }],
  precoVenda: { type: Number, required: true },
  descricao: String,
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);
