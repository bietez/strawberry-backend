// controllers/reservationController.js

const Table = require('../models/Table');
const Customer = require('../models/Customer');
const Reservation = require('../models/Reservation');
const Ambiente = require('../models/Ambiente');

exports.getAvailableTables = async (req, res) => {
  try {
    const { dataReserva } = req.query;

    if (!dataReserva) {
      return res.status(400).json({ message: 'dataReserva é obrigatório.' });
    }

    const reservaDate = new Date(dataReserva);

    // Encontrar todas as mesas
    const allTables = await Table.find().populate('ambiente');

    // Encontrar reservas que conflitam com a data fornecida
    const conflictingReservations = await Reservation.find({
      dataReserva: {
        $lte: new Date(reservaDate.getTime() + 2 * 60 * 60 * 1000), // Supondo que a reserva dura 2 horas
        $gte: new Date(reservaDate.getTime() - 2 * 60 * 60 * 1000)
      },
      status: { $in: ['ativa', 'reservada'] }
    }).select('mesa');

    const reservedTableIds = conflictingReservations.map(reserva => reserva.mesa.toString());

    // Filtrar mesas que não estão reservadas
    const availableTables = allTables.filter(table => !reservedTableIds.includes(table._id.toString()) && table.status === 'livre');

    res.json({ tables: availableTables });
  } catch (error) {
    console.error('Erro ao obter mesas disponíveis:', error);
    res.status(500).json({ message: 'Erro ao obter mesas disponíveis.', error: error.message });
  }
};


exports.createReservation = async (req, res) => {
  try {
    const { mesaId, dataReserva, numeroPessoas, nomeCliente, telefoneCliente } = req.body;

    // Logando os dados recebidos na requisição

    // Verificar se a mesa existe
    const mesa = await Table.findById(mesaId);

    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    // Verificar se a mesa está ocupada
    if (mesa.status === 'ocupada') {
      return res.status(400).json({ message: 'Não é possível reservar uma mesa ocupada.' });
    }

    // Verificar se a mesa já está reservada
    if (mesa.status === 'reservada') {
      return res.status(400).json({ message: 'Mesa já está reservada.' });
    }

    // Criar reserva
    const reserva = new Reservation({
      mesa: mesaId,
      dataReserva: new Date(dataReserva),
      numeroPessoas: parseInt(numeroPessoas, 10),
      status: 'ativa',
      nomeCliente: nomeCliente,
      telefoneCliente: telefoneCliente
    });

    // Logando a reserva antes de salvar

    await reserva.save();

    // Logando a reserva após salvar

    // Atualizar status da mesa para 'reservada'
    mesa.status = 'reservada';
    await mesa.save();

    // Logando a mesa após atualização

    res.status(201).json({ message: 'Reserva criada com sucesso', reservation: reserva });
  } catch (error) {
    // Logando o erro completo para depuração
    console.error('Erro ao criar reserva:', error);
    res.status(400).json({ message: 'Erro ao criar reserva', error: error.message });
  }
};

exports.cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reserva = await Reservation.findById(reservationId).populate('mesa');
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    // Atualizar status da reserva para cancelada
    reserva.status = 'cancelada';
    await reserva.save();

    // Atualizar status da mesa para livre
    if (reserva.mesa) {
      const mesa = await Table.findById(reserva.mesa._id);
      if (mesa && mesa.status === 'reservada') {
        mesa.status = 'livre';
        await mesa.save();
      }
    }

    res.status(200).json({ message: 'Reserva cancelada com sucesso', reservation: reserva });
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(400).json({ message: 'Erro ao cancelar reserva', error: error.message });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reserva = await Reservation.findById(reservationId).populate('mesa');

    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    // Atualizar status da mesa para 'livre' se a reserva estava ativa, ocupada ou reservada
    if (reserva.mesa && ['ativa', 'ocupada', 'reservada'].includes(reserva.status)) {
      const mesa = await Table.findById(reserva.mesa._id);
      if (mesa) {
        mesa.status = 'livre';
        await mesa.save();
      }
    }

    // Excluir a reserva
    await Reservation.findByIdAndDelete(reservationId);

    res.status(200).json({ message: 'Reserva excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir reserva:', error);
    res.status(400).json({ message: 'Erro ao excluir reserva.', error: error.message });
  }
};

exports.getReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reservations = await Reservation.find()
      .populate({
        path: 'mesa',
        populate: {
          path: 'ambiente',
          model: 'Ambiente'
        }
      })
      .sort({ dataReserva: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    const totalReservations = await Reservation.countDocuments();

    res.json({
      reservations,
      totalPages: Math.ceil(totalReservations / limit),
      currentPage: parseInt(page, 10),
    });
  } catch (error) {
    console.error('Erro ao obter reservas:', error);
    res.status(400).json({ message: 'Erro ao obter reservas', error: error.message });
  }
};

exports.getReservationById = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reserva = await Reservation.findById(reservationId)
      .populate({
        path: 'mesa',
        populate: {
          path: 'ambiente',
          model: 'Ambiente'
        }
      });
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }
    res.json({ reservation: reserva });
  } catch (error) {
    console.error('Erro ao obter reserva por ID:', error);
    res.status(400).json({ message: 'Erro ao obter reserva', error: error.message });
  }
};
