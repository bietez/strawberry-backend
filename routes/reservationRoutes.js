const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// Criar reserva
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createReservation']),
  reservationController.createReservation
);

router.delete(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['deleteReservation']),
  reservationController.deleteReservation
);

// Cancelar reserva
router.put(
  '/:reservationId/cancel',
  authMiddleware,
  permissionMiddleware(['editReservation']),
  reservationController.cancelReservation
);

// Obter todas as reservas (opcional para debug)
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservations
);

// Obter reserva por ID (opcional)
router.get(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservationById
);

router.get(
  '/available',
  authMiddleware,
  permissionMiddleware(['viewTables']),
  reservationController.getAvailableTables
);


module.exports = router;
