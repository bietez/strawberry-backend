const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para integrações
router.get('/delivery-orders', authMiddleware, roleMiddleware(['manager', 'admin']), integrationController.fetchDeliveryOrders);

module.exports = router;
