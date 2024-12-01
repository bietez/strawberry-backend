// routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Criar nova reserva
router.post('/', authMiddleware, roleMiddleware(['Gerente', 'Garçom']), reservationController.createReservation);

// Obter todas as reservas
router.get('/', authMiddleware, roleMiddleware(['Gerente', 'Garçom']), reservationController.getReservations);

// Obter uma reserva por ID
router.get('/:id', authMiddleware, roleMiddleware(['Gerente', 'Garçom']), reservationController.getReservationById);

// Atualizar uma reserva
router.put('/:id', authMiddleware, roleMiddleware(['Gerente', 'Garçom']), reservationController.updateReservation);

// Excluir uma reserva
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente']), reservationController.deleteReservation);

module.exports = router;
