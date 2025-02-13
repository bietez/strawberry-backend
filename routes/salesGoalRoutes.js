// src/routes/salesGoalRoutes.js

const express = require('express');
const router = express.Router();
const salesGoalController = require('../controllers/salesGoalController');
const authMiddleware = require('../middlewares/authMiddleware');

// Listagem avançada
router.get('/advanced', authMiddleware, salesGoalController.getAdvancedSalesGoals);

// Exportar metas em PDF
router.get('/export-pdf', authMiddleware, salesGoalController.exportGoalsToPDF);

// Detalhes
router.get('/:id/details', authMiddleware, salesGoalController.getSalesGoalDetails);

// Criar
router.post('/', authMiddleware, salesGoalController.createSalesGoal);

// Editar
router.put('/:id', authMiddleware, salesGoalController.updateSalesGoal);

// Excluir - Somente admin
router.delete('/:id', authMiddleware, salesGoalController.deleteSalesGoal);

// Obter metas de um funcionário
router.get('/employee/:id', authMiddleware, salesGoalController.getSalesGoalsByEmployee);

// Exporta as rotas
module.exports = router;
