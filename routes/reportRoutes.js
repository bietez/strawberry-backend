// src/routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware'); // Middleware de autenticação

// Rota para obter todas as estatísticas
router.get('/statistics', authMiddleware, reportController.getStatistics);

// Rota para obter produtos com estoque baixo
router.get('/produtosComEstoqueBaixo', authMiddleware, reportController.getProdutosComEstoqueBaixo);

module.exports = router;
