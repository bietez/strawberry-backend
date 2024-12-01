// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// Rotas para categorias
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createCategory']),
  categoryController.createCategory
);

router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewCategory']),
  categoryController.getCategories
);

router.get(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['viewCategory']),
  categoryController.getCategories
);

router.put(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['editCategory']),
  categoryController.updateCategory
);

router.delete(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['deleteCategory']),
  categoryController.deleteCategory
);

module.exports = router;
