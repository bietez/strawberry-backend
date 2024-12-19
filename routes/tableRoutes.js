// routes/tableRoutes.js

const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para Mesas
router.post('/', authMiddleware, roleMiddleware(['manager', 'admin']), tableController.createTable);
router.get('/', authMiddleware, roleMiddleware(['manager', 'agent', 'admin']), tableController.getTables);
router.get('/advanced', authMiddleware, roleMiddleware(['manager', 'agent', 'admin']), tableController.getAdvancedTables);
router.put('/:tableId', authMiddleware, roleMiddleware(['manager', 'admin']), tableController.updateTable);
router.delete('/:tableId', authMiddleware, roleMiddleware(['manager', 'admin']), tableController.deleteTable);

// Finalizar Mesa
router.post('/:id/finalizar', authMiddleware, roleMiddleware(['manager', 'agent', 'admin']), tableController.finalizarMesa);

// Atualizar Status da Mesa
router.put('/:tableId/status', authMiddleware, roleMiddleware(['manager', 'agent', 'admin']), tableController.updateTableStatus);
router.get('/available', authMiddleware, roleMiddleware(['manager', 'admin']), tableController.getAvailableTables);

module.exports = router;
