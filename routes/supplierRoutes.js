// routes/supplierRoutes.js
const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');

// Validações para criação e atualização de fornecedores
const supplierValidationRules = [
  body('category')
    .notEmpty()
    .withMessage('Categoria é obrigatória.')
    .isIn([
      'Alimentos',
      'Bebidas',
      'Limpeza',
      'Higiene Pessoal',
      'Utensílios',
      'Tecnologia',
      'Outro',
    ])
    .withMessage('Categoria inválida.'),
  body('name')
    .notEmpty()
    .withMessage('Nome do fornecedor é obrigatório.'),
  body('email')
    .isEmail()
    .withMessage('Email inválido.'),
  body('phone')
    .matches(/^(\+?55)?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)
    .withMessage('Telefone inválido.'),
  body('cnpj')
    .notEmpty()
    .withMessage('CNPJ é obrigatório.')
    .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .withMessage('CNPJ no formato inválido.'),
  body('address')
    .notEmpty()
    .withMessage('Endereço é obrigatório.'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website inválido.'),
  body('products')
    .isArray({ min: 1 })
    .withMessage('Pelo menos um produto deve ser fornecido.'),
  body('products.*')
    .notEmpty()
    .withMessage('Nome do produto não pode ser vazio.'),
];

// Criar um novo fornecedor
router.post(
  '/',
  authMiddleware,
  supplierValidationRules,
  supplierController.createSupplier
);

// Obter todos os fornecedores com busca e paginação
router.get('/', authMiddleware, supplierController.getSuppliers);

// Obter um fornecedor específico pelo ID
router.get('/:id', authMiddleware, supplierController.getSupplierById);

// Atualizar um fornecedor existente
router.put(
  '/:id',
  authMiddleware,
  supplierValidationRules,
  supplierController.updateSupplier
);

// Deletar um fornecedor
router.delete('/:id', authMiddleware, supplierController.deleteSupplier);

module.exports = router;
