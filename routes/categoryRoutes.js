// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');


router.get('/', authMiddleware, categoryController.getAllCategories);


// Criar categoria
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createCategory']),
  categoryController.createCategory
);

// Buscar categorias avançadas com paginação, pesquisa e ordenação
router.get(
  '/advanced',
  authMiddleware,
  permissionMiddleware(['viewCategory']),
  categoryController.getCategories
);

// Obter categoria por ID
router.get(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['viewCategory']),
  categoryController.getCategoryById
);

// Atualizar categoria
router.put(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['editCategory']),
  categoryController.updateCategory
);

// Deletar categoria
router.delete(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['deleteCategory']),
  categoryController.deleteCategory
);

module.exports = router;
