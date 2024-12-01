// controllers/productController.js
const Product = require('../models/Product');

exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;

    const product = new Product(productData);
    await product.save();
    res.status(201).json({ message: 'Produto criado com sucesso', product });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar produto', error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('categoria');
    res.json(products);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter produtos', error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate('categoria');
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter produto', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(productId, updates, { new: true });
    res.json({ message: 'Produto atualizado com sucesso', product });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar produto', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByIdAndDelete(productId);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json({ message: 'Produto excluído com sucesso', product });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir produto', error: error.message });
  }
};
