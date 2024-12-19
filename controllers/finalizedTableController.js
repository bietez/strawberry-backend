// controllers/finalizedTableController.js
const FinalizedTable = require('../models/FinalizedTable');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const Table = require('../models/Table');
const Comanda = require('../models/Comanda');
const { createInvoice } = require('../utils/pdfUtil');

exports.finalizarMesa = async (req, res) => {
  try {
    const tableId = req.params.id;
    const { formaPagamento, valorPago, tipoDesconto, valorDesconto } = req.body;

    // Validações básicas
    if (!formaPagamento || valorPago === undefined || tipoDesconto === undefined || valorDesconto === undefined) {
      return res.status(400).json({ message: 'Dados de pagamento incompletos.' });
    }

    // Encontrar a mesa
    const mesa = await Table.findById(tableId).populate('ambiente');
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    if (mesa.status !== 'ocupada') {
      return res.status(400).json({ message: 'Mesa não está ocupada.' });
    }

    // Obter todos os pedidos da mesa que não estão finalizados
    const pedidos = await Order.find({ mesa: tableId, status: { $ne: 'Finalizado' } })
      .populate('itens.product')
      .populate('garcom')
      .populate('cliente');

    if (pedidos.length === 0) {
      return res.status(400).json({ message: 'Não há pedidos para esta mesa.' });
    }

    // Calcular o total dos pedidos
    let total = 0;
    pedidos.forEach(order => {
      total += order.total;
    });

    // Calcular desconto
    let desconto = 0;
    if (tipoDesconto === 'porcentagem') {
      desconto = (valorDesconto / 100) * total;
    } else if (tipoDesconto === 'valor') {
      desconto = valorDesconto;
    }

    const totalFinal = total - desconto;

    // Verificar se o valor pago é suficiente
    if (valorPago < totalFinal) {
      return res.status(400).json({ message: 'Valor pago é insuficiente.' });
    }

    // Criar a comanda
    const comanda = new Comanda({
      mesa: tableId,
      orders: pedidos.map(order => order._id),
      formaPagamento,
      valorPago,
      tipoDesconto,
      valorDesconto: desconto,
      total: totalFinal,
      status: 'Finalizada',
    });

    await comanda.save();

    // Atualizar o status dos pedidos para 'Finalizado'
    await Order.updateMany({ mesa: tableId, status: { $ne: 'Finalizado' } }, { status: 'Finalizado' });

    // Atualizar o status da mesa para 'livre'
    mesa.status = 'livre';
    await mesa.save();

    // Emitir evento via Socket.io, se necessário
    if (global.io) {
      global.io.emit('mesa_finalizada', { mesaId, comanda });
    }

    // Gerar a nota fiscal para PDF
    const pdfPath = await createInvoice(comanda);

    res.json({ message: 'Mesa finalizada com sucesso.', comanda, pdfPath });
  } catch (error) {
    console.error('Erro ao finalizar mesa:', error);
    res.status(500).json({ message: 'Erro ao finalizar mesa', error: error.message });
  }
};

exports.getFinalizedTables = async (req, res) => {
  try {
    let { 
      page = 1, 
      limit = 20, 
      search = '', 
      sort = 'dataFinalizacao', 
      order = 'desc', 
      dataInicial, 
      dataFinal 
    } = req.query;

    const pg = parseInt(page);
    const lm = parseInt(limit);

    const query = {};

    // Se search não estiver vazio e for um número, filtra por numeroMesa
    if (search && search.trim() !== '') {
      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        // search é numérico, filtra por numeroMesa igual ao número
        query.numeroMesa = searchNum;
      } else {
        // Caso queira filtrar por outro campo textual futuramente, pode implementar aqui
        // Por agora, se não é número, não filtra. Ou seja, sem filtro por search textual.
      }
    }

    // Filtragem por data
    // Apenas aplica filtro se dataInicial ou dataFinal estiverem preenchidas
    let inicio = dataInicial && dataInicial.trim() !== '' ? new Date(dataInicial) : null;
    let fim = dataFinal && dataFinal.trim() !== '' ? new Date(dataFinal) : null;

    if (inicio && fim) {
      query.dataFinalizacao = { $gte: inicio, $lte: fim };
    } else if (inicio) {
      query.dataFinalizacao = { $gte: inicio };
    } else if (fim) {
      query.dataFinalizacao = { $lte: fim };
    }

    // Caso search esteja vazio e datas também, query permanece vazia, retornando todos
    // Isso significa que se não tiver nenhum parâmetro, retornará todos os registros

    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    const total = await FinalizedTable.countDocuments(query);
    const finalized = await FinalizedTable.find(query)
      .populate('ambienteId')
      .populate({
        path: 'pedidos',
        populate: { path: 'itens.product', model: 'Product' }
      })
      .sort(sortOption)
      .skip((pg - 1) * lm)
      .limit(lm);

    res.json({
      finalized,
      total,
      totalPages: Math.ceil(total / lm),
      currentPage: pg
    });
  } catch (error) {
    console.error('Erro ao obter mesas finalizadas:', error);
    res.status(500).json({ message: 'Erro interno ao obter mesas finalizadas' });
  }
};

exports.getFinalizedTableById = async (req, res) => {
  try {
    const { id } = req.params;
    const finalized = await FinalizedTable.findById(id)
      .populate('ambienteId')
      .populate({
        path: 'pedidos',
        populate: { path: 'itens.product', model: 'Product' }
      });

    if (!finalized) return res.status(404).json({ message: 'Registro não encontrado' });

    res.json(finalized);
  } catch (error) {
    console.error('Erro ao obter mesa finalizada:', error);
    res.status(500).json({ message: 'Erro interno ao obter mesa finalizada' });
  }
};



// Relatório de vendas por período
exports.getVendasPorPeriodo = async (req, res) => {
  try {
    const { dataInicial, dataFinal } = req.query;

    if (!dataInicial || !dataFinal) {
      return res.status(400).json({ message: 'Data inicial e final são obrigatórias' });
    }

    const inicio = new Date(dataInicial);
    const fim = new Date(dataFinal);
    fim.setHours(23,59,59,999);

    const vendas = await FinalizedTable.aggregate([
      {
        $match: {
          dataFinalizacao: {
            $gte: inicio,
            $lte: fim
          }
        }
      },
      {
        $group: {
          _id: null,
          totalVendas: { $sum: "$valorTotal" },
          totalMesas: { $sum: 1 }
        }
      }
    ]);

    const result = vendas[0] || { totalVendas: 0, totalMesas: 0 };

    res.json({
      dataInicial,
      dataFinal,
      totalVendas: result.totalVendas,
      totalMesas: result.totalMesas
    });
  } catch (error) {
    console.error('Erro ao obter vendas por período:', error);
    res.status(500).json({ message: 'Erro interno ao obter vendas por período' });
  }
};

// Relatório de vendas por garçom
exports.getVendasPorGarcom = async (req, res) => {
  try {
    const { dataInicial, dataFinal } = req.query;

    const inicio = dataInicial ? new Date(dataInicial) : new Date('1970-01-01');
    const fim = dataFinal ? new Date(dataFinal) : new Date();
    fim.setHours(23,59,59,999);

    // Agregado que desce nos pedidos, acha o garçom (se houver) e soma total
    const vendas = await FinalizedTable.aggregate([
      {
        $match: {
          dataFinalizacao: { $gte: inicio, $lte: fim }
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'pedidos',
          foreignField: '_id',
          as: 'pedidoDetails'
        }
      },
      { $unwind: '$pedidoDetails' },
      {
        $lookup: {
          from: 'users',
          localField: 'pedidoDetails.garcom',
          foreignField: '_id',
          as: 'garcomDetails'
        }
      },
      { $unwind: { path: '$garcomDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$garcomDetails.nome',
          totalVendas: { $sum: '$pedidoDetails.total' },
          pedidosCount: { $sum: 1 }
        }
      },
      { $sort: { totalVendas: -1 } }
    ]);

    res.json({ dataInicial, dataFinal, vendas });
  } catch (error) {
    console.error('Erro ao obter vendas por garçom:', error);
    res.status(500).json({ message: 'Erro interno ao obter vendas por garçom' });
  }
};
