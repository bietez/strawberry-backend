// routes/finalizedTableRoutes.js
const express = require('express');
const router = express.Router();
const finalizedTableController = require('../controllers/finalizedTableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Obter lista de mesas finalizadas (com paginação, pesquisa, ordenação)
router.get('/', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getFinalizedTables);

// Obter uma mesa finalizada específica
router.get('/:id', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getFinalizedTableById);

// Relatório de vendas por período
router.get('/relatorios/periodo', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getVendasPorPeriodo);

// Relatório de vendas por garçom
router.get('/relatorios/garcom', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getVendasPorGarcom);

router.post('/:id/finalizar', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.finalizarMesa);

module.exports = router;
