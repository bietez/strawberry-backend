// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// Criar produto - requer a permissão 'createProduct'
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createProduct']),
  productController.createProduct
);

// Obter produtos - requer a permissão 'viewProduct'
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProducts
);

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
  productController.deleteProduct // Certifique-se de que esta função está definida
);

module.exports = router;
