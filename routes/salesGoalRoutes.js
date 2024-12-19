// routes/salesGoalRoutes.js

const express = require('express');
const router = express.Router();
const salesGoalController = require('../controllers/salesGoalController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Obter metas de vendas avançadas com paginação e pesquisa
router.get(
  '/advanced',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.getAdvancedSalesGoals
);

// Criar nova meta de vendas
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.createSalesGoal
);  

// Obter todas as metas de vendas (Admin e Manager)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.getSalesGoals
);

// Obter metas de vendas por funcionário
router.get(
  '/employee/:id',
  authMiddleware,
  roleMiddleware(['agent', 'admin', 'manager']),
  salesGoalController.getSalesGoalsByEmployee
);

// Atualizar uma meta de vendas
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.updateSalesGoal
);

// Excluir uma meta de vendas
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.deleteSalesGoal
);

// Obter detalhes da meta de vendas
router.get(
  '/:id/details',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.getSalesGoalDetails
);

module.exports = router;
