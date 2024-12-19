// controllers/reservationController.js
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const Customer = require('../models/Customer');

exports.deleteReservation = async (req, res) => {
  try {
    const { reservationId } = req.params; // Deve corresponder ao nome do parâmetro na rota

    const reserva = await Reservation.findById(reservationId);
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    // Atualizar o status da mesa para 'livre'
    const mesa = await Table.findById(reserva.mesa);
    if (mesa) {
      mesa.status = 'livre';
      await mesa.save();
    }

    // Deletar a reserva
    await Reservation.findByIdAndDelete(reservationId);

    res.status(200).json({ message: 'Reserva excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir reserva:', error);
    res.status(500).json({ message: 'Erro ao excluir reserva.', error: error.message });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { clienteId, mesaId, dataReserva, numeroPessoas, status } = req.body;

    // Verificar se a mesa está disponível
    const mesa = await Table.findById(mesaId);
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    if (mesa.status !== 'livre') {
      return res.status(400).json({ message: 'Mesa não está disponível.' });
    }

    // Verificar se o cliente existe
    const cliente = await Customer.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }

    // Criar reserva
    const reservation = new Reservation({
      cliente: clienteId,
      mesa: mesaId,
      dataReserva,
      numeroPessoas,
      status,
    });

    await reservation.save();

    // Atualizar status da mesa para 'ocupada'
    mesa.status = 'ocupada';
    await mesa.save();

    res.status(201).json({ message: 'Reserva criada com sucesso.', reservation });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ message: 'Erro ao criar reserva.', error: error.message });
  }
};

// Função para atualizar uma reserva
exports.updateReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { clienteId, mesaId, dataReserva, numeroPessoas, status } = req.body;

    const reserva = await Reservation.findById(reservationId).populate('mesa');
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    // Se a mesa foi alterada, verificar disponibilidade
    if (mesaId && mesaId !== reserva.mesa._id.toString()) {
      const novaMesa = await Table.findById(mesaId);
      if (!novaMesa) {
        return res.status(404).json({ message: 'Nova mesa não encontrada.' });
      }

      if (novaMesa.status !== 'livre') {
        return res.status(400).json({ message: 'Nova mesa não está disponível.' });
      }

      // Atualizar status da mesa anterior para 'livre'
      const mesaAnterior = await Table.findById(reserva.mesa._id);
      mesaAnterior.status = 'livre';
      await mesaAnterior.save();

      // Atualizar status da nova mesa para 'ocupada'
      novaMesa.status = 'ocupada';
      await novaMesa.save();

      // Atualizar mesa na reserva
      reserva.mesa = mesaId;
    }

    // Atualizar outros campos
    if (clienteId) reserva.cliente = clienteId;
    if (dataReserva) reserva.dataReserva = dataReserva;
    if (numeroPessoas) reserva.numeroPessoas = numeroPessoas;
    if (status) reserva.status = status;

    await reserva.save();

    // Populando novamente para retornar dados completos
    const reservaAtualizada = await Reservation.findById(reservationId)
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      });

    res.status(200).json({ message: 'Reserva atualizada com sucesso.', reservation: reservaAtualizada });
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    res.status(500).json({ message: 'Erro ao atualizar reserva.', error: error.message });
  }
};

// Função para buscar reservas avançadas com paginação e população
exports.getAdvancedReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'dataReserva', order = 'asc', search = '' } = req.query;

    const query = {};

    if (search) {
      // Buscar por número da mesa ou nome do ambiente
      query.$or = [
        { 'mesa.numeroMesa': { $regex: search, $options: 'i' } },
        { 'mesa.ambiente.nome': { $regex: search, $options: 'i' } },
      ];
    }

    const reservations = await Reservation.find()
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      })
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Reservation.countDocuments();

    res.json({
      reservations,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Erro ao obter reservas avançadas:', error);
    res.status(500).json({ message: 'Erro ao obter reservas avançadas.', error: error.message });
  }
};

// Função para deletar uma reserv

// Função para obter detalhes de uma reserva específica (opcional)
exports.getReservationById = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reserva = await Reservation.findById(reservationId)
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      });

    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    res.json({ reservation: reserva });
  } catch (error) {
    console.error('Erro ao obter reserva por ID:', error);
    res.status(500).json({ message: 'Erro ao obter reserva.', error: error.message });
  }
};

exports.getReservationsAdvanced = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const total = await Reservation.countDocuments();
    const totalPages = Math.ceil(total / limit);

    const reservations = await Reservation.find()
      .populate('cliente')
      .populate({ path: 'mesa', populate: { path: 'ambiente' } })
      .sort({ dataReserva: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      reservations,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Erro ao obter reservas:', error);
    res.status(400).json({ message: 'Erro ao obter reservas', error: error.message });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { clienteId, mesaId, dataReserva, numeroPessoas, status } = req.body;

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

    // Verificar se a mesa suporta o número de pessoas
    if (mesa.capacidade < numeroPessoas) {
      return res.status(400).json({ message: 'Número de pessoas excede a capacidade da mesa.' });
    }

    // Verificar se a mesa está disponível na data e horário desejados
    const startOfDay = new Date(dataReserva);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dataReserva);
    endOfDay.setHours(23, 59, 59, 999);

    const overlappingReservations = await Reservation.findOne({
      mesa: mesaId,
      dataReserva: { $gte: startOfDay, $lte: endOfDay },
      status: 'ativa',
    });

    if (overlappingReservations) {
      return res.status(400).json({ message: 'Mesa já reservada para esta data.' });
    }

    const reservation = new Reservation({
      cliente: clienteId,
      mesa: mesaId,
      dataReserva,
      numeroPessoas: parseInt(numeroPessoas, 10),
      status: status || 'ativa',
    });

    await reservation.save();

    // Atualizar o status da mesa para 'reservada'
    mesa.status = 'reservada';
    await mesa.save();

    res.status(201).json({ message: 'Reserva criada com sucesso', reservation });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
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
    const { reservationId } = req.params;
    const reservation = await Reservation.findById(reservationId)
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
    const { reservationId } = req.params;
    const updates = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }

    // Se mesaId, dataReserva ou numeroPessoas forem atualizados, verificar disponibilidade
    if (updates.mesaId || updates.dataReserva || updates.numeroPessoas) {
      const mesaId = updates.mesaId || reservation.mesa;
      const dataReserva = updates.dataReserva || reservation.dataReserva;
      const numeroPessoas = updates.numeroPessoas || reservation.numeroPessoas;

      const mesa = await Table.findById(mesaId);
      if (!mesa) {
        return res.status(404).json({ message: 'Mesa não encontrada' });
      }

      if (mesa.capacidade < numeroPessoas) {
        return res.status(400).json({ message: 'Número de pessoas excede a capacidade da mesa.' });
      }

      const startOfDay = new Date(dataReserva);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dataReserva);
      endOfDay.setHours(23, 59, 59, 999);

      const overlappingReservations = await Reservation.findOne({
        mesa: mesaId,
        dataReserva: { $gte: startOfDay, $lte: endOfDay },
        status: 'ativa',
        _id: { $ne: reservationId },
      });

      if (overlappingReservations) {
        return res.status(400).json({ message: 'Mesa já reservada para esta data.' });
      }

      // Atualizar o status da mesa anterior para 'livre' se estiver mudando de mesa
      if (updates.mesaId && updates.mesaId !== reservation.mesa.toString()) {
        const mesaAnterior = await Table.findById(reservation.mesa);
        if (mesaAnterior) {
          mesaAnterior.status = 'livre';
          await mesaAnterior.save();
        }
      }

      // Atualizar o status da nova mesa para 'reservada'
      mesa.status = 'reservada';
      await mesa.save();
    }

    // Atualizar a reserva
    Object.assign(reservation, updates);
    if (updates.numeroPessoas) {
      reservation.numeroPessoas = parseInt(updates.numeroPessoas, 10);
    }
    await reservation.save();

    const updatedReservation = await Reservation.findById(reservationId)
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      });

    res.json({ message: 'Reserva atualizada com sucesso', reservation: updatedReservation });
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    res.status(400).json({ message: 'Erro ao atualizar reserva', error: error.message });
  }
};


// Implementação adicional para obter mesas disponíveis
exports.getAvailableTables = async (req, res) => {
  try {
    const { dataReserva } = req.query;
    console.log(`Recebido dataReserva: ${dataReserva}`);

    if (!dataReserva) {
      console.log('dataReserva não fornecida');
      return res.status(400).json({ message: 'Data da reserva é obrigatória' });
    }

    const startOfDay = new Date(dataReserva);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dataReserva);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Procurando mesas indisponíveis entre ${startOfDay} e ${endOfDay}`);

    const unavailableTables = await Reservation.find({
      dataReserva: { $gte: startOfDay, $lte: endOfDay },
      status: 'ativa',
    }).select('mesa');

    const unavailableTableIds = unavailableTables.map((reserva) => reserva.mesa);
    console.log(`IDs de mesas indisponíveis: ${unavailableTableIds}`);

    const availableTables = await Table.find({
      _id: { $nin: unavailableTableIds },
      capacidade: { $gte: 1 }, // Ajuste conforme necessário
    }).populate('ambiente');

    console.log(`Mesas disponíveis encontradas: ${availableTables.length}`);

    res.json(availableTables);
  } catch (error) {
    console.error('Erro ao obter mesas disponíveis:', error);
    res.status(500).json({ message: 'Erro ao obter mesas disponíveis', error: error.message });
  }
};

// Função para criar uma reserva
exports.createReservation = async (req, res) => {
  try {
    const { clienteId, mesaId, dataReserva, numeroPessoas, status } = req.body;

    // Verificar se a mesa está disponível
    const mesa = await Table.findById(mesaId);
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    if (mesa.status !== 'livre') {
      return res.status(400).json({ message: 'Mesa não está disponível.' });
    }

    // Verificar se o cliente existe
    const cliente = await Customer.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }

    // Criar reserva
    const reservation = new Reservation({
      cliente: clienteId,
      mesa: mesaId,
      dataReserva,
      numeroPessoas,
      status,
    });

    await reservation.save();

    // Atualizar status da mesa para 'ocupada'
    mesa.status = 'ocupada';
    await mesa.save();

    res.status(201).json({ message: 'Reserva criada com sucesso.', reservation });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ message: 'Erro ao criar reserva.', error: error.message });
  }
};

// Função para atualizar uma reserva
exports.updateReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { clienteId, mesaId, dataReserva, numeroPessoas, status } = req.body;

    const reserva = await Reservation.findById(reservationId).populate('mesa');
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    // Se a mesa foi alterada, verificar disponibilidade
    if (mesaId && mesaId !== reserva.mesa._id.toString()) {
      const novaMesa = await Table.findById(mesaId);
      if (!novaMesa) {
        return res.status(404).json({ message: 'Nova mesa não encontrada.' });
      }

      if (novaMesa.status !== 'livre') {
        return res.status(400).json({ message: 'Nova mesa não está disponível.' });
      }

      // Atualizar status da mesa anterior para 'livre'
      const mesaAnterior = await Table.findById(reserva.mesa._id);
      mesaAnterior.status = 'livre';
      await mesaAnterior.save();

      // Atualizar status da nova mesa para 'ocupada'
      novaMesa.status = 'ocupada';
      await novaMesa.save();

      // Atualizar mesa na reserva
      reserva.mesa = mesaId;
    }

    // Atualizar outros campos
    if (clienteId) reserva.cliente = clienteId;
    if (dataReserva) reserva.dataReserva = dataReserva;
    if (numeroPessoas) reserva.numeroPessoas = numeroPessoas;
    if (status) reserva.status = status;

    await reserva.save();

    // Populando novamente para retornar dados completos
    const reservaAtualizada = await Reservation.findById(reservationId)
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      });

    res.status(200).json({ message: 'Reserva atualizada com sucesso.', reservation: reservaAtualizada });
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    res.status(500).json({ message: 'Erro ao atualizar reserva.', error: error.message });
  }
};

// Função para buscar reservas avançadas com paginação e população
exports.getAdvancedReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'dataReserva', order = 'asc', search = '' } = req.query;

    const query = {};

    if (search) {
      // Buscar por número da mesa ou nome do ambiente
      query.$or = [
        { 'mesa.numeroMesa': { $regex: search, $options: 'i' } },
        { 'mesa.ambiente.nome': { $regex: search, $options: 'i' } },
      ];
    }

    const reservations = await Reservation.find()
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      })
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Reservation.countDocuments();

    res.json({
      reservations,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Erro ao obter reservas avançadas:', error);
    res.status(500).json({ message: 'Erro ao obter reservas avançadas.', error: error.message });
  }
};

// Função para deletar uma reserva

// Função para obter detalhes de uma reserva específica (opcional)
exports.getReservationById = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reserva = await Reservation.findById(reservationId)
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      });

    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    res.json({ reservation: reserva });
  } catch (error) {
    console.error('Erro ao obter reserva por ID:', error);
    res.status(500).json({ message: 'Erro ao obter reserva.', error: error.message });
  }
};
