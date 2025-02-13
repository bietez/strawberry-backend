// controllers/tableController.js

const mongoose = require('mongoose');
const Table = require('../models/Table');
const User = require('../models/User');
const Ambiente = require('../models/Ambiente');
const FinalizedTable = require('../models/FinalizedTable');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const pdfUtil = require('../utils/pdfUtil');
const Comanda = require('../models/Comanda');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Funções auxiliares
async function areAllOrdersPaid(pedidos) {
  const pendingOrder = await Order.findOne({ _id: { $in: pedidos }, status: { $ne: 'Entregue' } });
  return !pendingOrder;
}

async function sumOrdersValue(pedidos) {
  const orders = await Order.find({ _id: { $in: pedidos } });
  return orders.reduce((acc, order) => acc + order.total, 0);
}

exports.getTableById = async (req, res) => {
  try {
    const tableId = req.params.id;

    // Verifica se o ID é válido do MongoDB
    if (!tableId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID da mesa inválido.' });
    }

    // Busca a mesa pelo ID e popula o ambiente
    const table = await Table.findById(tableId).populate('ambiente');

    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    res.json(table);
  } catch (error) {
    console.error('Erro ao buscar mesa por ID:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// Exemplo: obter mesas livres
exports.getAvailableTables = async (req, res) => {
  try {
    // Consulta para obter todas as mesas com status 'livre'
    const availableTables = await Table.find({ status: 'livre' })
      .populate('ambiente', 'nome'); // Popula o campo 'ambiente' apenas com o 'nome'

    return res.json({ tables: availableTables });
  } catch (error) {
    console.error('Erro ao obter mesas disponíveis:', error);
    return res.status(500).json({ message: 'Erro ao obter mesas disponíveis.' });
  }
};

// Finalizar mesa (exemplo completo com PDF e comanda)
exports.finalizarMesa = async (req, res) => {
  const mesaId = req.params.id;
  const {
    formaPagamento,
    valorPago,
    tipoDesconto,
    valorDesconto,
    cobrarTaxaServico,
    valorTaxaServico,
    garcomId,
  } = req.body;

  try {
    // 1. Verificação básica
    if (
      !formaPagamento ||
      valorPago === undefined ||
      !tipoDesconto ||
      valorDesconto === undefined ||
      !garcomId
    ) {
      return res.status(400).json({ message: 'Dados de pagamento ou garçom incompletos.' });
    }

    // 2. Verificação do garçom
    const garcom = await User.findById(garcomId);
    if (!garcom || (garcom.role !== 'waiter' && garcom.role !== 'agent')) {
      return res.status(400).json({ message: 'Garçom inválido ou não autorizado.' });
    }

    // 3. Buscar a mesa e popular ambiente e garçom
    const mesa = await Table.findById(mesaId).populate('ambiente').populate('garcomId', 'nome');
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }
    if (mesa.status !== 'ocupada') {
      return res.status(400).json({ message: 'Mesa não está ocupada ou já foi finalizada.' });
    }

    // 4. Atualizar garçom
    mesa.garcomId = garcomId;
    await mesa.save();

    // 5. Pedidos
    const pedidos = await Order.find({ mesa: mesaId, status: 'Entregue' }).populate('itens.product');
    if (pedidos.length === 0) {
      return res.status(400).json({ message: 'Nenhum pedido com status "Entregue" para finalizar.' });
    }

    // 6. Cálculo de total
    let totalMesa = pedidos.reduce((acc, pedido) => acc + (pedido.total || 0), 0);
    let totalComDesconto = totalMesa;
    if (tipoDesconto === 'porcentagem') {
      const pct = parseFloat(valorDesconto) || 0;
      totalComDesconto = totalMesa - totalMesa * (pct / 100);
    } else if (tipoDesconto === 'valor') {
      const val = parseFloat(valorDesconto) || 0;
      totalComDesconto = Math.max(totalMesa - val, 0);
    }

    // 7. Taxa de serviço
    let taxaServicoValor = 0;
    if (cobrarTaxaServico) {
      taxaServicoValor = parseFloat(valorTaxaServico) || 0;
      totalComDesconto += taxaServicoValor;
    }

    // 8. Validar valor pago
    if (valorPago < totalComDesconto) {
      return res.status(400).json({ message: 'Valor pago é insuficiente.' });
    }

    // 9. Criar Comanda
    const comandaData = {
      mesa: mesa.numeroMesa,
      ambienteId: mesa.ambiente._id,
      garcomId,
      pedidos: pedidos.map((p) => p._id),
      valorTotal: totalMesa,
      tipoDesconto: tipoDesconto || 'nenhum',
      valorDesconto: parseFloat(valorDesconto) || 0,
      totalComDesconto,
      formaPagamento,
      valorPago: parseFloat(valorPago) || 0,
      cobrarTaxaServico: !!cobrarTaxaServico,
      troco:
        !!cobrarTaxaServico &&
        Array.isArray(formaPagamento) &&
        formaPagamento.includes('dinheiro')
          ? parseFloat(valorPago) - totalComDesconto
          : 0,
      dataFinalizacao: new Date(),
    };

    const comanda = new Comanda(comandaData);
    await comanda.save();

    // 10. Geração PDF
    let pdfPathRelative;
    try {
      pdfPathRelative = await pdfUtil.createInvoice(comanda);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      return res.status(500).json({ message: 'Erro ao gerar PDF da comanda.' });
    }
    comanda.pdfPath = pdfPathRelative;
    await comanda.save();

    // 11. Criação do FinalizedTable
    const finalizedMesa = new FinalizedTable({
      numeroMesa: mesa.numeroMesa,
      ambienteId: mesa.ambiente._id,
      garcomId,
      pedidos: pedidos.map((p) => p._id),
      valorTotal: totalMesa,
      formaPagamento,
      valorPago: parseFloat(valorPago) || 0,
      tipoDesconto: tipoDesconto || 'nenhum',
      valorDesconto: parseFloat(valorDesconto) || 0,
      valorTaxaServico: taxaServicoValor,
      cobrarTaxaServico: !!cobrarTaxaServico,
      dataFinalizacao: new Date(),
      pdfPath: pdfPathRelative,
    });
    await finalizedMesa.save();

    // 12. Atualizar mesa e pedidos
    // Define a mesa como "suja" ao finalizar
    mesa.status = 'suja';
    mesa.assentos.forEach(assento => {
      assento.nomeCliente = null;
    });
    mesa.seatSeparation = false;
    await mesa.save();
    await Order.updateMany({ mesa: mesaId, status: 'Entregue' }, { status: 'Finalizado' });

    return res.json({
      message: 'Mesa finalizada com sucesso.',
      comanda,
      finalizedMesa,
      pdfPath: pdfPathRelative,
    });
  } catch (error) {
    console.error('Erro ao finalizar mesa:', error);
    return res.status(500).json({ message: 'Erro ao finalizar mesa' });
  }
};

// Criar mesa (agora recebe também o campo "formato")
exports.createTable = async (req, res) => {
  try {
    const { numeroMesa, ambienteId, capacidade, formato } = req.body;

    const ambiente = await Ambiente.findById(ambienteId);
    if (!ambiente) {
      return res.status(404).json({ message: 'Ambiente não encontrado' });
    }

    const mesaExistente = await Table.findOne({ numeroMesa });
    if (mesaExistente) {
      return res.status(400).json({ message: 'Número da mesa já está em uso.' });
    }

    const assentos = [];
    for (let i = 1; i <= capacidade; i++) {
      assentos.push({ numeroAssento: i });
    }

    const table = new Table({
      numeroMesa,
      ambiente: ambienteId,
      capacidade,
      assentos,
      status: 'livre',
      // Se não for informado, define como "quadrada"
      formato: formato || 'quadrada'
    });

    await table.save();

    res.status(201).json({ message: 'Mesa criada com sucesso', table });
  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    res.status(400).json({ message: 'Erro ao criar mesa', error: error.message });
  }
};

// Pegar todas as mesas
exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find().populate('ambiente');
    res.json(tables);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter mesas', error: error.message });
  }
};

exports.getTablesDashboard = async (req, res) => {
  try {
    const tables = await Table.find().populate('ambiente');
    res.json({ tables });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter mesas', error: error.message });
  }
};

// Pegar mesas com paginação/ordenacao/pesquisa
exports.getAdvancedTables = async (req, res) => {
  try {
    let { page = 1, limit = 20, sort = 'numeroMesa', order = 'asc', search = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const sortOptions = {};
    if (sort) {
      sortOptions[sort] = order === 'asc' ? 1 : -1;
    }

    const query = {};
    if (search) {
      query.$or = [
        { numeroMesa: { $regex: search, $options: 'i' } }
      ];
    }

    const tables = await Table.find(query)
      .populate('ambiente')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await Table.countDocuments(query).exec();

    res.json({
      tables,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Erro ao obter mesas avançadas:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

exports.freeTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada' });
    }

    // Verifica se a mesa está em um estado que pode ser liberado: "ocupada" ou "suja"
    if (table.status !== 'ocupada' && table.status !== 'suja') {
      return res.status(400).json({ message: 'A mesa não está ocupada nem suja e, portanto, não pode ser liberada.' });
    }

    table.status = 'livre';
    await table.save();

    // Emite evento via Socket.IO para notificar que a mesa foi liberada
    const io = req.app.get('io');
    io.emit('tableFreed', { tableNumber: table.numeroMesa, capacity: table.capacidade });

    res.json({ message: 'Mesa liberada', table });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateSeatSeparation = async (req, res) => {
  try {
    const { id } = req.params;
    const { seatSeparation } = req.body;

    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    table.seatSeparation = seatSeparation;

    if (!seatSeparation) {
      table.assentos.forEach((assento) => {
        assento.nomeCliente = null;
      });
    } else {
      const currentAssentos = table.assentos.length;
      if (currentAssentos < table.capacidade) {
        for (let i = currentAssentos + 1; i <= table.capacidade; i++) {
          table.assentos.push({ numeroAssento: i, nomeCliente: null, pedidos: [] });
        }
      } else if (currentAssentos > table.capacidade) {
        table.assentos = table.assentos.slice(0, table.capacidade);
      }
    }

    await table.save();

    return res.json({
      message: 'seatSeparation atualizado com sucesso.',
      table,
    });
  } catch (error) {
    console.error('Erro ao atualizar seatSeparation:', error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

exports.updateAssentos = async (req, res) => {
  try {
    const { id } = req.params;
    const { assentos } = req.body;

    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    if (!table.seatSeparation) {
      return res.status(400).json({ message: 'Separação por assentos não está ativada para esta mesa.' });
    }

    if (assentos.length !== table.capacidade) {
      return res.status(400).json({ message: `Número de assentos deve ser igual à capacidade (${table.capacidade}).` });
    }

    assentos.forEach((reqSeat) => {
      const seat = table.assentos.find((s) => s.numeroAssento === reqSeat.numeroAssento);
      if (seat) {
        seat.nomeCliente = reqSeat.nomeCliente || null;
      } else {
        table.assentos.push({
          numeroAssento: reqSeat.numeroAssento,
          nomeCliente: reqSeat.nomeCliente || null,
          pedidos: [],
        });
      }
    });

    await table.save();
    return res.json({
      message: 'Assentos atualizados com sucesso!',
      table,
    });
  } catch (error) {
    console.error('Erro ao atualizar assentos:', error);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

// Atualizar mesa (agora também atualiza o campo "formato" se fornecido)
// Atualizar mesa (agora também atualiza o campo "formato" e "rotation" se fornecidos)
exports.updateTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const updates = req.body;

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada' });
    }

    // Atualizar número da mesa
    if (updates.numeroMesa !== undefined) {
      const mesaExistente = await Table.findOne({
        numeroMesa: updates.numeroMesa,
        _id: { $ne: tableId },
      });
      if (mesaExistente) {
        return res.status(400).json({ message: 'Número da mesa já está em uso.' });
      }
      table.numeroMesa = updates.numeroMesa;
    }

    // Atualizar ambiente
    if (updates.ambienteId || updates.ambiente !== undefined) {
      const ambienteId = updates.ambienteId || updates.ambiente;
      const ambiente = await Ambiente.findById(ambienteId);
      if (!ambiente) {
        return res.status(404).json({ message: 'Ambiente não encontrado' });
      }
      table.ambiente = ambienteId;
    }

    // Atualizar capacidade
    if (updates.capacidade !== undefined && updates.capacidade !== table.capacidade) {
      if (updates.capacidade < 1) {
        return res.status(400).json({ message: 'Capacidade deve ser pelo menos 1.' });
      }
      if (updates.capacidade > table.capacidade) {
        for (let i = table.capacidade + 1; i <= updates.capacidade; i++) {
          table.assentos.push({ numeroAssento: i });
        }
      } else {
        table.assentos = table.assentos.slice(0, updates.capacidade);
      }
      table.capacidade = updates.capacidade;
    }

    // Atualizar o campo "formato" se fornecido
    if (updates.formato !== undefined) {
      table.formato = updates.formato;
    }

    // **Novo:** Atualizar o campo "rotation" se fornecido
    if (updates.rotation !== undefined) {
      table.rotation = updates.rotation;
    }

    // Atualizar posição (pos_x, pos_y, width, height)
    if (updates.posicao && Array.isArray(updates.posicao)) {
      if (updates.posicao.length > 0) {
        const { pos_x, pos_y, width, height } = updates.posicao[0];
        if (table.posicao.length === 0) {
          table.posicao = updates.posicao;
        } else {
          table.posicao[0].pos_x = pos_x;
          table.posicao[0].pos_y = pos_y;
          table.posicao[0].width = width;
          table.posicao[0].height = height;
        }
      }
    }

    // Atualizações adicionais (ex.: width, height se existirem)
    if (updates.width !== undefined && typeof updates.width === 'number') {
      table.width = updates.width;
    }
    if (updates.height !== undefined && typeof updates.height === 'number') {
      table.height = updates.height;
    }

    await table.save();

    res.json({ message: 'Mesa atualizada com sucesso', table });
  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
    res.status(400).json({ message: 'Erro ao atualizar mesa', error: error.message });
  }
};


// Excluir mesa
exports.deleteTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await Table.findByIdAndDelete(tableId);
    if (!table) return res.status(404).json({ message: 'Mesa não encontrada' });
    res.json({ message: 'Mesa excluída com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir mesa', error: error.message });
  }
};

// Atualizar status da mesa
exports.updateTableStatus = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { status } = req.body;

    const validStatuses = ['livre', 'ocupada', 'reservada'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    const table = await Table.findById(tableId).populate({
      path: 'assentos.pedidos',
      model: 'Order',
    });

    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    if (status.toLowerCase() === 'livre') {
      table.occupiedSince = null;
    }

    if (status.toLowerCase() === 'ocupada') {
      if (table.status !== 'ocupada') {
        table.occupiedSince = new Date();
      }
    }

    if (status.toLowerCase() === 'reservada' && table.status !== 'livre') {
      return res.status(400).json({
        message: 'Só é possível marcar como reservada se a mesa estiver livre.'
      });
    }

    table.status = status.toLowerCase();
    await table.save();

    res.status(200).json({ message: 'Status da mesa atualizado com sucesso.', table });
  } catch (error) {
    console.error('Erro ao atualizar status da mesa:', error);
    res.status(400).json({ message: 'Erro ao atualizar status da mesa.', error: error.message });
  }
};

exports.getTablesByAmbiente = async (req, res) => {
  try {
    const { ambienteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ambienteId)) {
      return res.status(400).json({ message: 'ID de ambiente inválido.' });
    }

    const ambiente = await Ambiente.findById(ambienteId);
    if (!ambiente) {
      return res.status(404).json({ message: 'Ambiente não encontrado.' });
    }

    const tables = await Table.find({ ambiente: ambienteId })
      .populate('ambiente');

    res.json({ tables });
  } catch (error) {
    console.error('Erro ao obter mesas por ambiente:', error);
    res.status(500).json({ 
      message: 'Erro ao obter mesas por ambiente.', 
      error: error.message 
    });
  }
};
