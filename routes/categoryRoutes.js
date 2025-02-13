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
  categoryController.createCategory
);

// Buscar categorias avançadas com paginação, pesquisa e ordenação
router.get(
  '/advanced',
  authMiddleware,
  categoryController.getCategories
);

// Obter categoria por ID
router.get(
  '/:categoryId',
  authMiddleware,
  categoryController.getCategoryById
);

// Atualizar categoria
router.put(
  '/:categoryId',
  authMiddleware,
  categoryController.updateCategory
);

// Deletar categoria
router.delete(
  '/:categoryId',
  authMiddleware,
  categoryController.deleteCategory
);

module.exports = router;
