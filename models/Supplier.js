// models/Supplier.js
const mongoose = require('mongoose');
const validateCNPJ = require('../utils/validateCNPJ'); // Você precisa criar essa função de validação

const SupplierSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Categoria do fornecedor é obrigatória.'],
    enum: [
      'Alimentos',
      'Bebidas',
      'Limpeza',
      'Higiene Pessoal',
      'Utensílios',
      'Tecnologia',
      'Outro',
    ],
  },
  name: {
    type: String,
    required: [true, 'Nome do fornecedor é obrigatório.'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email do fornecedor é obrigatório.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, insira um email válido.',
    ],
  },
  phone: {
    type: String,
    required: [true, 'Telefone do fornecedor é obrigatório.'],
    trim: true,
    match: [
      /^(\+?55)?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
      'Por favor, insira um telefone válido.',
    ],
  },
  cnpj: {
    type: String,
    required: [true, 'CNPJ do fornecedor é obrigatório.'],
    unique: true,
    trim: true,
    validate: {
      validator: function (v) {
        return validateCNPJ(v);
      },
      message: (props) => `${props.value} não é um CNPJ válido!`,
    },
  },
  address: {
    type: String,
    required: [true, 'Endereço do fornecedor é obrigatório.'],
    trim: true,
  },
  website: {
    type: String,
    trim: true,
    match: [
      /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/([\w/_-]+))*\/?$/,
      'Por favor, insira um website válido.',
    ],
  },
  products: [
    {
      type: String,
      required: [true, 'Pelo menos um produto é obrigatório.'],
      trim: true,
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Referência ao modelo de Usuário
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', SupplierSchema);
