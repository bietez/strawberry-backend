const express = require('express');
const router = express.Router();
const ifoodAuthController = require('../controllers/ifoodAuthController');
const ifoodMerchantController = require('../controllers/ifoodMerchantController');

// Rotas de Autenticação do iFood (Não Protegidas)
// Como as rotas serão montadas com o prefixo "/api/ifood", não inclua "/ifood" aqui
router.post('/auth/start', ifoodAuthController.startAuth);
router.post('/auth/complete', ifoodAuthController.completeAuth);
router.get('/auth/status', ifoodAuthController.getStatus);
router.post('/auth/refresh', ifoodAuthController.refreshToken);

// Rotas sem verificação de authMiddleware/roleMiddleware
router.post('/polling/start', ifoodAuthController.startPolling);
router.post('/polling/stop', ifoodAuthController.stopPolling);
router.get('/orders', ifoodAuthController.getOrders);
router.get('/events', ifoodAuthController.getEvents);
router.post('/events/ack', ifoodAuthController.ackEvents);

// Rotas de Merchants do iFood
router.get('/merchants', ifoodMerchantController.listMerchants);
router.get('/merchants/:merchantId', ifoodMerchantController.getMerchantDetails);
router.get('/merchants/:merchantId/status', ifoodMerchantController.getMerchantStatus);
router.put('/merchants/:merchantId/opening-hours', ifoodMerchantController.createOpeningHours);
router.get('/merchants/:merchantId/opening-hours', ifoodMerchantController.getOpeningHours);
router.get('/merchants/:merchantId/status/:operation', ifoodMerchantController.getMerchantStatusByOperation);
router.get('/merchants/:merchantId/interruptions', ifoodMerchantController.listInterruptions);
router.post('/merchants/:merchantId/interruptions', ifoodMerchantController.createInterruption);
router.delete('/merchants/:merchantId/interruptions/:interruptionId', ifoodMerchantController.deleteInterruption);

module.exports = router;
