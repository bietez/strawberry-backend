// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const deliveriesController = require('../controllers/deliveriesController');


router.get('/sales-by-category', authMiddleware, orderController.getSalesByCategory);

// Rota para criar um novo pedido
router.post('/', authMiddleware, orderController.createOrder);

// Rota para obter todos os pedidos
router.get('/', authMiddleware, orderController.getOrders);

// Rota para obter um pedido por ID
router.get('/:id', authMiddleware, orderController.getOrderById);

// Rota para atualizar o status de um pedido
router.put('/:id/status', authMiddleware, orderController.updateOrderStatus);

// **Nova Rota para Atualizar Pedido Completo**
router.put('/:id', authMiddleware, orderController.updateOrder);

// Rota para excluir um pedido
router.delete('/:id', authMiddleware, orderController.deleteOrder);


module.exports = router;
