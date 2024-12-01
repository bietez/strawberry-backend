// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas de autenticação
router.post('/register', authMiddleware, roleMiddleware(['admin', 'manager']), authController.register);
router.post('/login', authController.login);

// Rotas para recuperação de senha
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPasswordWithOTP);

module.exports = router;
