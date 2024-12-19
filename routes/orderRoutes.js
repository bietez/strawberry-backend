// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para pedidos

// Rota para criar um novo pedido
router.post('/', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.createOrder);

// Rota para obter todos os pedidos
router.get('/', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.getOrders);

// Rota para obter um pedido por ID
router.get('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.getOrderById);

// Rota para atualizar o status de um pedido
router.put('/:id/status', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.updateOrderStatus);

// **Nova Rota para Atualizar Pedido Completo**
router.put('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.updateOrder);

// Rota para excluir um pedido
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.deleteOrder);

module.exports = router;
