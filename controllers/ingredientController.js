// server/controllers/ingredientController.js
const Ingredient = require('../models/Ingredient');

exports.createIngredient = async (req, res) => {
  try {
    const { nome, unidadeMedida, quantidadeEstoque, precoCusto } = req.body;
    let imagem = 'https://via.placeholder.com/150'; // URL padrão

    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
      imagem = imageUrl;
    }

    const newIngredient = new Ingredient({
      nome,
      unidadeMedida,
      quantidadeEstoque,
      precoCusto,
      imagem,
    });

    await newIngredient.save();
    res.status(201).json({ message: 'Ingrediente criado com sucesso!', ingredient: newIngredient });
  } catch (error) {
    console.error('Erro ao criar ingrediente:', error);
    res.status(500).json({ message: 'Erro ao criar ingrediente.', error: error.message });
  }
};

exports.getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.status(200).json(ingredients);
  } catch (error) {
    console.error('Erro ao obter ingredientes:', error);
    res.status(500).json({ message: 'Erro ao obter ingredientes.', error: error.message });
  }
};

exports.getIngredientById = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingrediente não encontrado.' });
    }
    res.status(200).json(ingredient);
  } catch (error) {
    console.error('Erro ao obter ingrediente:', error);
    res.status(500).json({ message: 'Erro ao obter ingrediente.', error: error.message });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const { nome, unidadeMedida, quantidadeEstoque, precoCusto } = req.body;
    let imagem = undefined;

    if (req.file) {
      imagem = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
    }

    const updateData = {
      nome,
      unidadeMedida,
      quantidadeEstoque,
      precoCusto,
    };

    if (imagem) {
      updateData.imagem = imagem;
    }

    const updatedIngredient = await Ingredient.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedIngredient) {
      return res.status(404).json({ message: 'Ingrediente não encontrado.' });
    }

    res.status(200).json({ message: 'Ingrediente atualizado com sucesso!', ingredient: updatedIngredient });
  } catch (error) {
    console.error('Erro ao atualizar ingrediente:', error);
    res.status(500).json({ message: 'Erro ao atualizar ingrediente.', error: error.message });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    const deletedIngredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!deletedIngredient) {
      return res.status(404).json({ message: 'Ingrediente não encontrado.' });
    }
    res.status(200).json({ message: 'Ingrediente deletado com sucesso!', ingredient: deletedIngredient });
  } catch (error) {
    console.error('Erro ao deletar ingrediente:', error);
    res.status(500).json({ message: 'Erro ao deletar ingrediente.', error: error.message });
  }
};
