// controllers/supplierController.js
const Supplier = require('../models/Supplier');
const { validationResult } = require('express-validator');

// Criar um novo fornecedor
exports.createSupplier = async (req, res) => {
  // Validação das requisições
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { category, name, email, phone, cnpj, address, website, products } = req.body;

  try {
    // Verificar se o fornecedor já existe
    let supplier = await Supplier.findOne({ $or: [{ email }, { cnpj }] });
    if (supplier) {
      return res.status(400).json({ message: 'Fornecedor com esse email ou CNPJ já existe.' });
    }

    // Criar novo fornecedor
    supplier = new Supplier({
      category,
      name,
      email,
      phone,
      cnpj,
      address,
      website,
      products,
      createdBy: req.user.id, // Usando o authMiddleware
    });

    await supplier.save();

    res.status(201).json({
      message: 'Fornecedor criado com sucesso.',
      supplier,
    });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({ message: 'Erro interno ao criar fornecedor.' });
  }
};

// Obter todos os fornecedores com busca e paginação
exports.getSuppliers = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;

  try {
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        // Adicionamos a pesquisa também para o campo "products"
        { products: { $regex: search, $options: 'i' } },
      ];
    }

    const suppliers = await Supplier.find(query)
      .populate('createdBy', 'nome email') // Popula os dados do usuário que criou
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Supplier.countDocuments(query);

    res.json({
      suppliers,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Erro ao obter fornecedores:', error);
    res.status(500).json({ message: 'Erro interno ao obter fornecedores.' });
  }
};

// Obter um fornecedor específico pelo ID
exports.getSupplierById = async (req, res) => {
  const { id } = req.params;

  try {
    const supplier = await Supplier.findById(id).populate('createdBy', 'nome email');

    if (!supplier) {
      return res.status(404).json({ message: 'Fornecedor não encontrado.' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Erro ao obter fornecedor:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID do fornecedor inválido.' });
    }
    res.status(500).json({ message: 'Erro interno ao obter fornecedor.' });
  }
};

// Atualizar um fornecedor existente
exports.updateSupplier = async (req, res) => {
  const { id } = req.params;

  // Validação das requisições
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { category, name, email, phone, cnpj, address, website, products } = req.body;

  try {
    let supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({ message: 'Fornecedor não encontrado.' });
    }

    // Atualizar campos
    supplier.category = category || supplier.category;
    supplier.name = name || supplier.name;
    supplier.email = email || supplier.email;
    supplier.phone = phone || supplier.phone;
    supplier.cnpj = cnpj || supplier.cnpj;
    supplier.address = address || supplier.address;
    supplier.website = website || supplier.website;
    supplier.products = products || supplier.products;

    await supplier.save();

    res.json({
      message: 'Fornecedor atualizado com sucesso.',
      supplier,
    });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID do fornecedor inválido.' });
    }
    res.status(500).json({ message: 'Erro interno ao atualizar fornecedor.' });
  }
};

// Deletar um fornecedor
exports.deleteSupplier = async (req, res) => {
  const { id } = req.params;

  try {
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({ message: 'Fornecedor não encontrado.' });
    }

    await supplier.remove();

    res.json({ message: 'Fornecedor deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID do fornecedor inválido.' });
    }
    res.status(500).json({ message: 'Erro interno ao deletar fornecedor.' });
  }
};
