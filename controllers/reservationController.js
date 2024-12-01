// Conteúdo de: .\controllers\reservationController.js
// controllers/reservationController.js
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const Customer = require('../models/Customer');

exports.createReservation = async (req, res) => {
  try {
    const { clienteId, mesaId, dataReserva, numeroPessoas } = req.body;

    // Verificar se o cliente existe
    const cliente = await Customer.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Verificar se a mesa existe
    const mesa = await Table.findById(mesaId);
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada' });
    }

    // Verificar se a mesa está disponível na data desejada
    const conflictingReservations = await Reservation.find({
      mesa: mesaId,
      dataReserva: dataReserva,
      status: 'ativa',
    });

    if (conflictingReservations.length > 0) {
      return res.status(400).json({ message: 'Mesa já reservada para esta data e hora' });
    }

    const reservation = new Reservation({
      cliente: clienteId,
      mesa: mesaId,
      dataReserva,
      numeroPessoas,
    });

    await reservation.save();

    // Atualizar o status da mesa para 'reservada'
    mesa.status = 'reservada';
    await mesa.save();

    res.status(201).json({ message: 'Reserva criada com sucesso', reservation });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar reserva', error: error.message });
  }
};

exports.getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      })
      .sort({ dataReserva: 1 });
    res.json(reservations);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter reservas', error: error.message });
  }
};

exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id)
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      });
    if (!reservation) return res.status(404).json({ message: 'Reserva não encontrada' });
    res.json(reservation);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter reserva', error: error.message });
  }
};

exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const reservation = await Reservation.findByIdAndUpdate(id, updates, { new: true });
    if (!reservation) return res.status(404).json({ message: 'Reserva não encontrada' });
    res.json({ message: 'Reserva atualizada com sucesso', reservation });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar reserva', error: error.message });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByIdAndDelete(id);
    if (!reservation) return res.status(404).json({ message: 'Reserva não encontrada' });

    // Atualizar o status da mesa para 'livre'
    const mesa = await Table.findById(reservation.mesa);
    if (mesa) {
      mesa.status = 'livre';
      await mesa.save();
    }

    res.json({ message: 'Reserva excluída com sucesso' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir reserva', error: error.message });
  }
};
