// routes/tableRoutes.js
const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const finalizedTableController = require('../controllers/finalizedTableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para Mesas
router.post('/', authMiddleware, roleMiddleware(['Gerente']), tableController.createTable);
router.get('/', authMiddleware, tableController.getTables);
router.put('/:tableId', authMiddleware, roleMiddleware(['Gerente']), tableController.updateTable);
router.delete('/:tableId', authMiddleware, roleMiddleware(['Gerente']), tableController.deleteTable);

// Rota para Finalizar Mesa (somente Gerente)
router.post('/:tableId/finalizar', authMiddleware, roleMiddleware(['Garçom']), finalizedTableController.finalizeTable);

// Rota para Atualizar Status da Mesa (pode ser usada por Garçom)
router.put('/:tableId/status', authMiddleware, roleMiddleware(['Gerente', 'Garçom']), tableController.updateTableStatus);

module.exports = router;
