// routes/finalizedTableRoutes.js
const express = require('express');
const router = express.Router();
const finalizedTableController = require('../controllers/finalizedTableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Obter lista de mesas finalizadas (com paginação, pesquisa, ordenação)
router.get('/', authMiddleware,  finalizedTableController.getFinalizedTables);

// Obter uma mesa finalizada específica
router.put('/:id',authMiddleware, finalizedTableController.updateFinalizedTable);


// Relatório de vendas por período


router.post('/:id/finalizar', authMiddleware,  finalizedTableController.finalizarMesa);

router.get('/sales-by-category', authMiddleware, finalizedTableController.getSalesByCategory);

router.post('/delivery/:orderId/finalizar', authMiddleware, finalizedTableController.finalizarEntrega);


module.exports = router;
