// models/Recipe.js
const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Referência à Category
  ingredientes: [{
    ingrediente: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    quantidade: { type: Number, required: true },
    unidade: { type: String, required: true }, // Adicionado campo 'unidade'
  }],
  precoVenda: { type: Number, required: true },
  descricao: { type: String },
}, { timestamps: true });

// Middleware para garantir que todas as categorias e ingredientes existem
RecipeSchema.pre('save', async function (next) {
  try {
    const Category = require('./Category');
    const Ingredient = require('./Ingredient');

    const categoria = await Category.findById(this.categoria);
    if (!categoria) {
      throw new Error('Categoria não encontrada');
    }

    for (const item of this.ingredientes) {
      const ingrediente = await Ingredient.findById(item.ingrediente);
      if (!ingrediente) {
        throw new Error(`Ingrediente com ID ${item.ingrediente} não encontrado`);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Recipe', RecipeSchema);
