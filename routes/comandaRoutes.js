// cash-register-backend/routes/comandaRoutes.js

const express = require('express');
const router = express.Router();
const comandaController = require('../controllers/comandaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const Table = require('../models/Table'); // <--- IMPORTANTE

// Enviar email
router.post(
  '/send-email',
  authMiddleware,
  comandaController.sendComandaEmail
);
// Listar comandas
router.get(
  '/',
  authMiddleware,
  comandaController.getComandas
);

// Baixar PDF
router.get(
  '/:id/pdf',
  authMiddleware,
  comandaController.downloadComandaPDF
);

router.get('/delivery/:orderId/conferencia', authMiddleware, comandaController.gerarConferencia);


// Nova rota para PDF de Conferência (antes de finalizar a mesa)
router.get(
  '/:tableId/conferencia',
  authMiddleware,
  comandaController.generateConferencePDF
);

// Adicionar pagamento parcial
router.put(
  '/:comandaId/payments',
  authMiddleware,
  comandaController.addPayment
);

router.get(
  '/:comandaId/invoice',
  authMiddleware,
  comandaController.generateInvoicePDF
);

module.exports = router;
