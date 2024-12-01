// routes/integrationRoutes.js
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/delivery-orders', authMiddleware, integrationController.fetchDeliveryOrders);

module.exports = router;
