// routes/ifoodRoutes.js
const express = require('express');
const router = express.Router();
const ifoodAuthController = require('../controllers/ifoodAuthController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Iniciar o processo de autenticação
router.post('/ifood/auth/start', authMiddleware, roleMiddleware(['admin', 'manager']), ifoodAuthController.startAuth);

// Concluir a autenticação com o código de autorização
router.post('/ifood/auth/complete', authMiddleware, roleMiddleware(['admin', 'manager']), ifoodAuthController.completeAuth);

module.exports = router;
