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
    const { page = 1, limit = 10, search = '', sort = 'categoria', order = 'asc' } = req.query;

    const query = {
      categoria: { $regex: search, $options: 'i' },
    };

    const total = await Category.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const currentPage = parseInt(page, 10);

    const categories = await Category.find(query)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((currentPage - 1) * limit)
      .limit(parseInt(limit, 10));

    res.json({ categories, totalPages, currentPage });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter categorias', error: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Categoria não encontrada' });
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter categoria', error: error.message });
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
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error('Erro ao obter categorias:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
