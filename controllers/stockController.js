// controllers/stockController.js
const Product = require('../models/Product');

exports.getStock = async (req, res) => {
  try {
    const stockItems = await Product.find().select('nome quantidadeEstoque');
    res.json(stockItems);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter dados de estoque', error: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantidadeEstoque } = req.body;

    const product = await Product.findByIdAndUpdate(productId, { quantidadeEstoque }, { new: true });
    res.json({ message: 'Estoque atualizado', product });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar estoque', error: error.message });
  }
};
