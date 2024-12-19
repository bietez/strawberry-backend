// controllers/recipeController.js

const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');

exports.createRecipe = async (req, res) => {
  try {
    const { nome, categoria, ingredientes, precoVenda, descricao } = req.body;

    // Verificar se todos os ingredientes existem
    for (const item of ingredientes) {
      const ingrediente = await Ingredient.findById(item.ingrediente);
      if (!ingrediente) {
        return res.status(404).json({ message: `Ingrediente com ID ${item.ingrediente} não encontrado` });
      }
    }

    const recipe = new Recipe({ nome, categoria, ingredientes, precoVenda, descricao });
    await recipe.save();
    res.status(201).json({ message: 'Receita criada com sucesso', recipe });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field.toUpperCase()} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao criar receita', error: error.message });
  }
};

exports.getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find().populate('ingredientes.ingrediente');
    res.json(recipes);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter receitas', error: error.message });
  }
};

exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('ingredientes.ingrediente');
    if (!recipe) return res.status(404).json({ message: 'Receita não encontrada' });
    res.json(recipe);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter receita', error: error.message });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, categoria, ingredientes, precoVenda, descricao } = req.body;

    // Verificar se todos os ingredientes atualizados existem
    if (ingredientes) {
      for (const item of ingredientes) {
        const ingrediente = await Ingredient.findById(item.ingrediente);
        if (!ingrediente) {
          return res.status(404).json({ message: `Ingrediente com ID ${item.ingrediente} não encontrado` });
        }
      }
    }

    const recipe = await Recipe.findByIdAndUpdate(
      id,
      { nome, categoria, ingredientes, precoVenda, descricao },
      { new: true, runValidators: true }
    ).populate('ingredientes.ingrediente');

    if (!recipe) return res.status(404).json({ message: 'Receita não encontrada' });
    res.json({ message: 'Receita atualizada com sucesso', recipe });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field.toUpperCase()} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao atualizar receita', error: error.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findByIdAndDelete(id);
    if (!recipe) return res.status(404).json({ message: 'Receita não encontrada' });
    res.json({ message: 'Receita excluída com sucesso', recipe });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir receita', error: error.message });
  }
};
