// src/controllers/stockController.js

const Product = require('../models/Product');

exports.getStock = async (req, res) => {
  try {
    const stockItems = await Product.find()
      .select('nome quantidadeEstoque categoria')
      .populate('categoria', 'categoria');
    res.json(stockItems);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter dados de estoque', error: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantidadeEstoque } = req.body;

    if (quantidadeEstoque === undefined || quantidadeEstoque < 0) {
      return res.status(400).json({ message: 'quantidadeEstoque deve ser um número positivo.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    product.quantidadeEstoque = quantidadeEstoque;
    await product.save();

    res.json({ message: 'Estoque atualizado', product });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar estoque', error: error.message });
  }
};
