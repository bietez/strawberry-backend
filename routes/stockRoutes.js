// routes/stockRoutes.js
const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, stockController.getStock);
router.put('/:productId', authMiddleware, stockController.updateStock);

module.exports = router;
