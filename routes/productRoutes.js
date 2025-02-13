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
  
  productController.checkNomeDuplicado
);

// **Nova Rota para Busca Avançada - Deve Vir Antes das Rotas Dinâmicas**
router.get(
  '/advanced',
  productController.getProductsAdvanced
);

// Criar produto - requer a permissão 'createProduct'
router.post(
  '/',
  authMiddleware,
  productController.createProduct
);


// Obter todos os produtos - requer a permissão 'viewProduct'
router.get(
  '/',  
  productController.getProducts
);

// Obter produto por ID - requer a permissão 'viewProduct'
router.get(
  '/:productId',
  productController.getProductById
);

// Atualizar produto - requer a permissão 'editProduct'
router.put(
  '/:productId',
  authMiddleware,
  productController.updateProduct
);

// Deletar produto - requer a permissão 'deleteProduct'
router.delete(
  '/:productId',
  authMiddleware,
  productController.deleteProduct
);

module.exports = router;
