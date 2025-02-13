// routes/ifoodOrdersRoutes.js

const express = require('express');
const router = express.Router();
const ifoodOrdersController = require('../controllers/ifoodOrdersController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Exemplo de roles: "admin", "manager", etc.
const allowedRoles = ['admin', 'manager'];

// Orders - Details
router.get('/orders/:id', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.getOrderDetails);
router.get('/orders/:id/virtual-bag', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.getOrderVirtualBag);

// Orders - Actions
router.post('/orders/:id/confirm', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.confirmOrder);
router.post('/orders/:id/startPreparation', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.startPreparation);
router.post('/orders/:id/readyToPickup', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.readyToPickup);
router.post('/orders/:id/dispatch', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.dispatchOrder);
router.get('/orders/:id/cancellationReasons', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.getCancellationReasons);
router.post('/orders/:id/requestCancellation', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.requestCancellation);

// Delivery
router.get('/orders/:id/tracking', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.trackOrder);
router.post('/orders/:id/requestDriver', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.requestDriver);
router.post('/orders/:id/cancelRequestDriver', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.cancelDriverRequest);

// Handshake
router.post('/disputes/:disputeId/accept', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.acceptDispute);
router.post('/disputes/:disputeId/reject', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.rejectDispute);
router.post('/disputes/:disputeId/alternatives/:alternativeId', authMiddleware, roleMiddleware(allowedRoles), ifoodOrdersController.sendDisputeProposal);

// (Adicione aqui as rotas de Code Validation e Logistics, caso precise.)

module.exports = router;
