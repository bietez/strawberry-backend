// routes/salesGoalRoutes.js
const express = require('express');
const router = express.Router();
const salesGoalController = require('../controllers/salesGoalController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para metas de vendas
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.createSalesGoal
);

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.getSalesGoals
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.updateSalesGoal
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.deleteSalesGoal
);

module.exports = router;
