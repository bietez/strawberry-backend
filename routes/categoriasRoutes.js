// backend/routes/categoriaRoutes.js
const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/arvore', authMiddleware, categoriaController.listarCategoriasArvore);

// Listar categorias
router.get('/', authMiddleware, categoriaController.listarCategorias);

// Criar categoria
router.post('/', authMiddleware, categoriaController.criarCategoria);

// Atualizar categoria
router.put('/:id', authMiddleware, categoriaController.atualizarCategoria);

// Excluir categoria
router.delete('/:id', authMiddleware, categoriaController.excluirCategoria);

module.exports = router;
