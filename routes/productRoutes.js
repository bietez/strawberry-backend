// routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// **Nova Rota para Verificar Duplicidade de Nome**
// Esta rota deve ser adicionada antes das rotas dinâmicas para evitar conflitos.
router.get(
  '/check-nome/:nome',
  authMiddleware,
  permissionMiddleware(['viewProduct']), // Ajuste as permissões conforme necessário
  productController.checkNomeDuplicado
);

// **Nova Rota para Busca Avançada - Deve Vir Antes das Rotas Dinâmicas**
router.get(
  '/advanced',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProductsAdvanced
);

// Criar produto - requer a permissão 'createProduct'
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createProduct']),
  productController.createProduct
);

// Obter todos os produtos - requer a permissão 'viewProduct'
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProducts
);

// Obter produto por ID - requer a permissão 'viewProduct'
router.get(
  '/:productId',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProductById
);

// Atualizar produto - requer a permissão 'editProduct'
router.put(
  '/:productId',
  authMiddleware,
  permissionMiddleware(['editProduct']),
  productController.updateProduct
);

// Deletar produto - requer a permissão 'deleteProduct'
router.delete(
  '/:productId',
  authMiddleware,
  permissionMiddleware(['deleteProduct']),
  productController.deleteProduct
);

module.exports = router;
