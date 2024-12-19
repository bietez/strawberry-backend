// routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// Rotas avançadas
router.get(
  '/advanced',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservationsAdvanced
);

// Criar reserva
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createReservation']),
  reservationController.createReservation
);

// Obter todas as reservas
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservations
);

// Obter reserva por ID
router.get(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservationById
);

// Atualizar reserva
router.put(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['editReservation']),
  reservationController.updateReservation
);

// Deletar reserva
router.delete(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['deleteReservation']),
  reservationController.deleteReservation
);

// Obter mesas disponíveis para uma data específica
router.get(
  '/tables/available',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservationsAdvanced
);

module.exports = router;
