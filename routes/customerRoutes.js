// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para clientes
router.post('/', authMiddleware, roleMiddleware(['Gerente']), customerController.createCustomer);
router.get('/', authMiddleware, roleMiddleware(['Gerente']), customerController.getCustomers);
router.get('/:id', authMiddleware, roleMiddleware(['Gerente']), customerController.getCustomerById);
router.put('/:id', authMiddleware, roleMiddleware(['Gerente']), customerController.updateCustomer);
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente']), customerController.deleteCustomer);

module.exports = router;
