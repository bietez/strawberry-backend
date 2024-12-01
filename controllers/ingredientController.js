// controllers/ingredientController.js
const Ingredient = require('../models/Ingredient');

exports.createIngredient = async (req, res) => {
  try {
    const { nome, unidadeMedida, quantidadeEstoque, precoCusto } = req.body;
    const ingredient = new Ingredient({ nome, unidadeMedida, quantidadeEstoque, precoCusto });
    await ingredient.save();
    res.status(201).json({ message: 'Ingrediente criado com sucesso', ingredient });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao criar ingrediente', error: error.message });
  }
};

exports.getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.json(ingredients);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter ingredientes', error: error.message });
  }
};

exports.getIngredientById = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return res.status(404).json({ message: 'Ingrediente não encontrado' });
    res.json(ingredient);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter ingrediente', error: error.message });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const { nome, unidadeMedida, quantidadeEstoque, precoCusto } = req.body;
    const ingredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      { nome, unidadeMedida, quantidadeEstoque, precoCusto },
      { new: true, runValidators: true }
    );
    if (!ingredient) return res.status(404).json({ message: 'Ingrediente não encontrado' });
    res.json({ message: 'Ingrediente atualizado com sucesso', ingredient });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao atualizar ingrediente', error: error.message });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!ingredient) return res.status(404).json({ message: 'Ingrediente não encontrado' });
    res.json({ message: 'Ingrediente excluído com sucesso' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir ingrediente', error: error.message });
  }
};
