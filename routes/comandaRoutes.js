// cash-register-backend/routes/comandaRoutes.js
const express = require('express');
const router = express.Router();
const comandaController = require('../controllers/comandaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/', authMiddleware, roleMiddleware(['manager', 'admin']), comandaController.getComandas);
router.get('/:id/pdf', authMiddleware, roleMiddleware(['manager', 'admin']), comandaController.downloadComandaPDF);
router.post('/send-email', authMiddleware, roleMiddleware(['manager', 'admin']), comandaController.sendComandaEmail);

module.exports = router;
