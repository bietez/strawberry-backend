// controllers/categoryController.js
const Category = require('../models/Category');

exports.createCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    const category = new Category(categoryData);
    await category.save();
    res.status(201).json({ message: 'Categoria criada com sucesso', category });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar categoria', error: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter categorias', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const updates = req.body;

    const category = await Category.findByIdAndUpdate(categoryId, updates, { new: true });
    res.json({ message: 'Categoria atualizada com sucesso', category });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar categoria', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) return res.status(404).json({ message: 'Categoria não encontrada' });
    res.json({ message: 'Categoria excluída com sucesso', category });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir categoria', error: error.message });
  }
};
