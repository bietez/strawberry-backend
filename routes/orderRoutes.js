// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para pedidos
router.post('/', authMiddleware, roleMiddleware(['Garçom']), orderController.createOrder);
router.get('/', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom']), orderController.getOrders);
router.get('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom']), orderController.getOrderById);
router.put('/:id/status', authMiddleware, roleMiddleware(['Cozinheiro', 'Gerente']), orderController.updateOrderStatus);

module.exports = router;
