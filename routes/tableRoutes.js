// routes/table.js
const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// === Rotas Estáticas Primeiro ===

// Rota para pegar mesas por ambiente
router.get(
  '/by-ambiente/:ambienteId',
  authMiddleware,
  tableController.getTablesByAmbiente
);

// Outros endpoints estáticos
router.get(
  '/available',
  authMiddleware,
  tableController.getAvailableTables
);

router.get(
  '/dashboard',
  authMiddleware,
  tableController.getTablesDashboard
);

router.get(
  '/advanced',
  authMiddleware,
  roleMiddleware(['manager', 'agent', 'admin']),
  tableController.getAdvancedTables
);

// Rotas para Mesas
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.createTable
);

router.get(
  '/',
  authMiddleware,
  tableController.getTables
);

// === Rotas Dinâmicas Depois ===

// Rota para finalizar mesa
router.post(
  '/:id/finalizar',
  authMiddleware,
  roleMiddleware(['manager', 'agent', 'admin']),
  tableController.finalizarMesa
);

// Atualizar status da mesa
router.put(
  '/:tableId/status',
  authMiddleware,
  roleMiddleware(['manager', 'agent', 'admin']),
  tableController.updateTableStatus
);

// Rotas para atualizar seatSeparation
router.put(
  '/:id/seat-separation',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.updateSeatSeparation
);

// Rotas para atualizar assentos
router.put(
  '/:id/assentos',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.updateAssentos
);

// ATENÇÃO: Use uma rota PUT principal para atualizar a mesa
router.put(
  '/:tableId',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.updateTable
);

router.delete(
  '/:tableId',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.deleteTable
);

// === Rota Dinâmica Principal ===

// Adicionar a rota GET /tables/:id (deve ser a última rota dinâmica)
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['manager', 'admin', 'agent']), // Adicione os papéis apropriados
  tableController.getTableById
);

module.exports = router;
