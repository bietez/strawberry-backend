// src/routes/stockRoutes.js

const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para estoque
router.get('/', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), stockController.getStock);
router.put('/:productId', authMiddleware, roleMiddleware(['manager', 'admin']), stockController.updateStock);

module.exports = router;
