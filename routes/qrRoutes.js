// routes/qrRoutes.js
const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Somente admin ou manager geram o crachá
router.post('/generate', authMiddleware, roleMiddleware(['manager', 'admin']), qrController.generatePermanentQr);

// Endpoint para login via QR (público, pois só recebe o token gerado)
router.post('/login', authMiddleware, qrController.loginWithQr);

module.exports = router;
