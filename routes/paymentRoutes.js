const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para pagamentos
router.post('/', authMiddleware, roleMiddleware(['agent', 'manager', 'admin']), paymentController.processPayment);

module.exports = router;
