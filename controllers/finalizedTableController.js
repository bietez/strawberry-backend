// controllers/finalizedTableController.js
const FinalizedTable = require('../models/FinalizedTable');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const Table = require('../models/Table');
const Comanda = require('../models/Comanda');
const { createInvoice } = require('../utils/pdfUtil');
const Config = require('../models/Config');
const pdfUtil = require('../utils/pdfUtil');
const Product = require('../models/Product');
const Lancamento = require('../models/Lancamento');
const Categoria = require('../models/Categoria');
const Ambiente = require('../models/Ambiente'); 


exports.finalizarEntrega = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      formaPagamento,
      valorPago,
      tipoDesconto,
      valorDesconto,
      cobrarTaxaServico,
      valorTaxaServico
    } = req.body;

    // 1) Buscar pedido do tipo 'entrega'
    const pedido = await Order.findOne({
      _id: orderId,
      tipoPedido: 'entrega',
      status: { $ne: 'Finalizado' },
    }).populate('itens.product');

    if (!pedido) {
      return res.status(404).json({
        message: 'Pedido de entrega não encontrado ou já finalizado.'
      });
    }

    // 2) Calcular total
    const totalPedido = pedido.total || 0;

    // 3) Calcular desconto e taxa
    let descontoCalculado = 0;
    if (tipoDesconto === 'porcentagem') {
      descontoCalculado = (valorDesconto / 100) * totalPedido;
    } else if (tipoDesconto === 'valor') {
      descontoCalculado = valorDesconto;
    }
    if (descontoCalculado < 0) descontoCalculado = 0;

    let totalFinal = totalPedido - descontoCalculado;
    let taxaServicoValor = 0;
    if (cobrarTaxaServico) {
      taxaServicoValor = parseFloat(valorTaxaServico) || 0;
      totalFinal += taxaServicoValor;
    }

    if (valorPago < totalFinal) {
      return res.status(400).json({
        message: 'Valor pago é insuficiente.'
      });
    }

    // 4) Buscar ou criar um Ambiente = "Entrega"
    let ambienteEntrega = await Ambiente.findOne({ nome: 'Entrega' });
    if (!ambienteEntrega) {
      ambienteEntrega = await Ambiente.create({ nome: 'Entrega', status: 'ativo' });
    }

    // 5) Criar doc FinalizedTable
    // Aqui definimos numeroMesa = 9999 (um valor simbólico)
    const finalized = new FinalizedTable({
      numeroMesa: 9999,
      ambienteId: ambienteEntrega._id,
      garcomId: req.user ? req.user._id : null, // se quiser associar ao usuário logado
      pedidos: [pedido._id],
      valorTotal: totalFinal,
      formaPagamento,
      valorPago,
      tipoDesconto,
      valorDesconto: descontoCalculado,
      valorTaxaServico: taxaServicoValor,
      cobrarTaxaServico: !!cobrarTaxaServico,
      dataFinalizacao: new Date()
    });

    await finalized.save();

    // 6) Marcar pedido como Finalizado
    pedido.status = 'Finalizado';
    await pedido.save();

    return res.json({
      message: 'Entrega finalizada com sucesso.',
      finalized
    });
  } catch (error) {
    console.error('Erro ao finalizar entrega:', error);
    return res.status(500).json({
      message: 'Erro ao finalizar entrega',
      error: error.message
    });
  }
};

exports.updateFinalizedTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { garcomId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('ID inválido:', id);
      return res.status(400).json({ message: 'ID inválido.' });
    }

    console.log(`Buscando FinalizedTable com _id = ${id}...`);
    let finalized = await FinalizedTable.findById(id);
    if (!finalized) {
      console.log(`Comanda finalizada não encontrada para o ID: ${id}`);
      return res.status(404).json({ message: 'Comanda finalizada não encontrada.' });
    }

    console.log('FinalizedTable antes da atualização:', finalized);

    if (garcomId) {
      console.log('Atualizando garcomId para:', garcomId);
      finalized.garcomId = garcomId;
    } else {
      console.log('Nenhum garcomId fornecido no body, não atualizando esse campo.');
    }

    console.log('Salvando alterações...');
    await finalized.save();

    console.log('Realizando populate com Product...');
    const populated = await FinalizedTable.findById(finalized._id)
      .populate('ambienteId', 'nome')
      .populate('garcomId', 'nome')
      .populate({
        path: 'pedidos',
        populate: {
          path: 'itens.product',
          model: 'Product',
        },
      });

    console.log('FinalizedTable após populate:', JSON.stringify(populated, null, 2));

    console.log('Enviando resposta ao cliente...');
    return res.json({
      message: 'Comanda finalizada atualizada com sucesso.',
      finalized: populated,
    });
  } catch (error) {
    console.error('Erro ao atualizar comanda finalizada:', error);
    return res.status(500).json({
      message: 'Erro ao atualizar comanda finalizada.',
      error: error.message,
    });
  }
};

exports.finalizarMesa = async (req, res) => {
  try {
    const tableId = req.params.id;
    const {
      formaPagamento,
      valorPago,
      tipoDesconto,
      valorDesconto,
      cobrarTaxaServico,
      valorTaxaServico,
    } = req.body;

    console.log('Dados Recebidos na Finalização da Mesa:', {
      formaPagamento,
      valorPago,
      tipoDesconto,
      valorDesconto,
      cobrarTaxaServico,
      valorTaxaServico,
    });

    if (!formaPagamento || valorPago === undefined || !tipoDesconto || valorDesconto === undefined) {
      return res.status(400).json({ message: 'Dados de pagamento incompletos.' });
    }

    // 1) Buscar a mesa
    const mesa = await Table.findById(tableId).populate('ambiente').populate('garcomId', 'nome');
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }
    if (mesa.status !== 'ocupada') {
      return res.status(400).json({ message: 'Mesa não está ocupada.' });
    }

    // 2) Define garcomId a partir do user autenticado
    const garcomId = req.user._id;
    mesa.garcomId = garcomId;
    await mesa.save();

    // 3) Buscar pedidos
    const pedidos = await Order.find({ mesa: tableId, status: { $ne: 'Finalizado' } })
      .populate('itens.product')
      .populate('garcom', 'nome');

    if (pedidos.length === 0) {
      return res.status(400).json({ message: 'Não há pedidos para esta mesa.' });
    }

    // 4) Calcular total
    let total = 0;
    pedidos.forEach((ord) => {
      total += ord.total || 0;
    });

    // 5) Calcular desconto e taxa de serviço
    let descontoCalculado = 0;
    if (tipoDesconto === 'porcentagem') {
      descontoCalculado = (valorDesconto / 100) * total;
    } else if (tipoDesconto === 'valor') {
      descontoCalculado = valorDesconto;
    }
    if (descontoCalculado < 0) descontoCalculado = 0;

    let totalFinal = total - descontoCalculado;

    let taxaServicoValor = 0;
    if (cobrarTaxaServico) {
      taxaServicoValor = parseFloat(valorTaxaServico) || 0;
      totalFinal += taxaServicoValor;
    }

    console.log('Total Final após Desconto e Taxa de Serviço:', totalFinal);

    if (valorPago < totalFinal) {
      return res.status(400).json({ message: 'Valor pago é insuficiente.' });
    }

    // 6) Criar doc FinalizedTable
    const finalized = new FinalizedTable({
      numeroMesa: mesa.numeroMesa,
      ambienteId: mesa.ambiente?._id,
      garcomId: mesa.garcomId,
      pedidos: pedidos.map((ord) => ord._id),
      valorTotal: totalFinal,
      formaPagamento,
      valorPago,
      tipoDesconto,
      valorDesconto: descontoCalculado,
      valorTaxaServico: taxaServicoValor,
      cobrarTaxaServico: !!cobrarTaxaServico,
      dataFinalizacao: new Date(),
    });
    await finalized.save();

    // 7) Atualiza pedidos -> Finalizado
    await Order.updateMany(
      { mesa: tableId, status: { $ne: 'Finalizado' } },
      { status: 'Finalizado' }
    );

    // 8) Mesa vira 'livre'
    mesa.status = 'livre';
    await mesa.save();

    // 9) Gerar PDF Invoice
    const comanda = {
      mesa: mesa,
      garcomId: garcomId,
      pedidos: pedidos,
      formaPagamento,
      valorPago,
      tipoDesconto,
      valorDesconto: descontoCalculado,
      valorTaxaServico: taxaServicoValor,
      cobrarTaxaServico,
      dataFinalizacao: finalized.dataFinalizacao,
    };

    const pdfPath = await pdfUtil.createInvoice(comanda);
    finalized.pdfPath = pdfPath;
    await finalized.save();

    // 10) --- CRIA O LANÇAMENTO-SUMÁRIO EM "Mesas Finalizadas" ---
    let catMesas = await Categoria.findOne({ nome: 'Mesas Finalizadas', tipo: 'Receita' });
    if (!catMesas) {
      catMesas = await Categoria.create({ nome: 'Mesas Finalizadas', tipo: 'Receita' });
    }
    const novoLanc = new Lancamento({
      tipo: 'Receita',
      clienteFornecedor: mesa?.garcomId?.nome || `Mesa #${mesa.numeroMesa}`,
      descricao: `Finalized table #${finalized._id}`,
      categoria: catMesas._id,
      data: new Date(),
      valor: totalFinal,
      status: 'pago',
      importId: finalized._id,
      importSource: 'finalized-tables',
    });
    await novoLanc.save();

    // 11) --- CRIAR LANÇAMENTOS DETALHADOS (por item/produto) ---
    for (const ord of pedidos) {
      for (const item of ord.itens) {
        const valorItem = (item.product?.preco || 0) * (item.quantidade || 1);
        const lancDetalhado = new Lancamento({
          tipo: 'Receita',
          clienteFornecedor: mesa?.garcomId?.nome || `Mesa #${mesa.numeroMesa}`,
          descricao: `Prod: ${item.product?.nome} (MesaFinalizada#${finalized._id})`,
          categoria: item.product?.categoria,
          data: finalized.dataFinalizacao,
          valor: valorItem,
          status: 'pago',
          importId: `${finalized._id}`,
          importSource: 'finalized-tables:product-item',
        });
        await lancDetalhado.save();
      }
    }

    // 12) Criar Comanda
    const comandaDoc = new Comanda({
      finalizedTable: finalized._id,
      pdfPath: pdfPath,
    });
    await comandaDoc.save();

    // 13) Associar Comanda à FinalizedTable
    finalized.comanda = comandaDoc._id;
    await finalized.save();

    // Retorna ao cliente
    return res.json({
      message: 'Mesa finalizada com sucesso.',
      finalized: finalized,
      lancamentoSumario: novoLanc,
    });
  } catch (error) {
    console.error('Erro ao finalizar mesa:', error);
    return res.status(500).json({ message: 'Erro ao finalizar mesa', error: error.message });
  }
};

exports.getSalesByCategory = async (req, res) => {
  try {
    let { dataInicial, dataFinal } = req.query;

    const matchStage = { status: 'Finalizado' };

    if (dataInicial || dataFinal) {
      matchStage.dataFinalizacao = {};
      if (dataInicial) {
        matchStage.dataFinalizacao.$gte = new Date(dataInicial);
      }
      if (dataFinal) {
        matchStage.dataFinalizacao.$lte = new Date(dataFinal);
      }
    }

    console.log('\n[DEBUG] matchStage utilizado no aggregation: ', JSON.stringify(matchStage,null,2));

    const aggregation = [
      { $match: matchStage },
      { $unwind: '$pedidos' },
      { $unwind: '$pedidos.itens' },
      {
        $group: {
          _id: '$pedidos.itens.product.categoria.nome',
          totalVendido: { $sum: '$pedidos.itens.quantidade' },
        },
      },
      { $sort: { totalVendido: -1 } },
      { $limit: 10 },
    ];

    console.log('\n[DEBUG] Aggregation pipeline: ', JSON.stringify(aggregation,null,2));

    const salesByCategory = await FinalizedTable.aggregate(aggregation);

    console.log('\n[DEBUG] salesByCategory retornado pelo aggregate: ', salesByCategory);

    res.json({ salesByCategory });
  } catch (error) {
    console.error('Erro ao obter sales-by-category:', error);
    res.status(500).json({ message: 'Erro interno ao obter vendas por categoria.' });
  }
};

exports.getFinalizedTables = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 50,
      search = '',
      sort = 'dataFinalizacao',
      order = 'desc',
      dataInicial,
      dataFinal
    } = req.query;

    const pg = parseInt(page, 10);
    const lm = parseInt(limit, 10);

    const query = {};

    // Filtro por "search" (para numeroMesa)
    if (search && search.trim() !== '') {
      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        query.numeroMesa = searchNum;
      }
    }

    // Filtro por data
    let inicio = dataInicial && dataInicial.trim() !== '' ? new Date(dataInicial) : null;
    let fim = dataFinal && dataFinal.trim() !== '' ? new Date(dataFinal) : null;

    if (inicio && fim) {
      query.dataFinalizacao = { $gte: inicio, $lte: fim };
    } else if (inicio) {
      query.dataFinalizacao = { $gte: inicio };
    } else if (fim) {
      query.dataFinalizacao = { $lte: fim };
    }

    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    const total = await FinalizedTable.countDocuments(query);
    const finalized = await FinalizedTable.find(query)
      .populate('ambienteId')
      .populate({
        path: 'pedidos',
        populate: { path: 'itens.product', model: 'Product' }
      })
      .populate('garcomId', 'nome')
      .sort(sortOption)
      .skip((pg - 1) * lm)
      .limit(lm);

    // Soma total taxa e total final no período (desconsiderando paginação)
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          sumTaxaServicoAll: { $sum: '$valorTaxaServico' },
          sumTotalFinalAll: {
            $sum: {
              $add: [
                '$valorTotal',
                { $ifNull: ['$valorTaxaServico', 0] }
              ]
            }
          }
        }
      }
    ];

    const aggResult = await FinalizedTable.aggregate(pipeline);
    let sumTaxaServicoAll = 0;
    let sumTotalFinalAll = 0;
    if (aggResult && aggResult.length > 0) {
      sumTaxaServicoAll = aggResult[0].sumTaxaServicoAll || 0;
      sumTotalFinalAll = aggResult[0].sumTotalFinalAll || 0;
    }

    return res.json({
      finalized,
      total,
      totalPages: Math.ceil(total / lm),
      currentPage: pg,
      sumTaxaServicoAll,
      sumTotalFinalAll
    });
  } catch (error) {
    console.error('Erro ao obter mesas finalizadas:', error);
    return res.status(500).json({ message: 'Erro interno ao obter mesas finalizadas' });
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
