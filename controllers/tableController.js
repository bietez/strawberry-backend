// controllers/tableController.js
const mongoose = require('mongoose');
const Table = require('../models/Table');
const Ambiente = require('../models/Ambiente');
const FinalizedTable = require('../models/FinalizedTable');
const Order = require('../models/Order');
const { createInvoice } = require('../utils/pdfUtil'); // Supondo que createInvoice está em utils/pdfUtil.js
const Comanda = require('../models/Comanda'); // Importando o modelo Comanda
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


async function areAllOrdersPaid(pedidos) {
  const pendingOrder = await Order.findOne({ _id: { $in: pedidos }, status: { $ne: 'Entregue' } });
  return !pendingOrder;
}

async function sumOrdersValue(pedidos) {
  const orders = await Order.find({ _id: { $in: pedidos } });
  return orders.reduce((acc, order) => acc + order.total, 0);
};

// **Função única getAvailableTables com populate**
exports.getAvailableTables = async (req, res) => {
  try {
    const availableTables = await Table.find({ status: 'livre' }).populate('ambiente');
    res.json({ tables: availableTables });
  } catch (error) {
    console.error('Erro ao obter mesas disponíveis:', error);
    res.status(500).json({ message: 'Erro ao obter mesas disponíveis.', error: error.message });
  }
};

exports.getTableById = async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await Table.findById(tableId).populate('ambiente');

    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    res.json({ table });
  } catch (error) {
    console.error('Erro ao obter mesa por ID:', error);
    res.status(500).json({ message: 'Erro ao obter mesa.', error: error.message });
  }
};




// Finalizar uma mesa
exports.finalizarMesa = async (req, res) => {
  const mesaId = req.params.id;
  const { formaPagamento, valorPago, tipoDesconto, valorDesconto } = req.body;

  try {
    // Validar mesa
    const mesa = await Table.findById(mesaId).populate('ambiente');
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada' });
    }

    if (mesa.status !== 'ocupada') {
      return res.status(400).json({ message: 'Mesa já está finalizada ou não está ocupada' });
    }

    // Buscar pedidos da mesa com status 'Entregue'
    const pedidos = await Order.find({ mesa: mesaId, status: 'Entregue' }).populate('itens.product');
    if (pedidos.length === 0) {
      return res.status(400).json({ message: 'Nenhum pedido entregue para finalizar nesta mesa' });
    }

    // Calcular total da mesa
    let totalMesa = pedidos.reduce((acc, pedido) => acc + pedido.total, 0);

    // Aplicar desconto
    let totalComDesconto = totalMesa;
    if (tipoDesconto === 'porcentagem') {
      const pct = parseFloat(valorDesconto) || 0;
      totalComDesconto = totalMesa - (totalMesa * (pct / 100));
    } else if (tipoDesconto === 'valor') {
      const val = parseFloat(valorDesconto) || 0;
      totalComDesconto = Math.max(totalMesa - val, 0);
    }

    // Verificar se o valor pago é suficiente (caso pagamento em dinheiro)
    if (formaPagamento === 'dinheiro') {
      const pago = parseFloat(valorPago) || 0;
      if (pago < totalComDesconto) {
        return res.status(400).json({ message: 'Valor pago menor que o total com desconto' });
      }
    }

    // Criar comanda
    const comandaData = {
      mesa: mesa.numeroMesa,
      pedidos: pedidos.map(pedido => ({
        orderNumber: pedido.orderNumber,
        itens: pedido.itens.map(item => ({
          quantidade: item.quantidade,
          nome: item.product.nome,
          preco: item.product.preco,
          total: item.product.preco * item.quantidade,
        })),
        total: pedido.total,
      })),
      valorTotal: totalMesa,
      tipoDesconto,
      valorDesconto: parseFloat(valorDesconto) || 0,
      totalComDesconto,
      formaPagamento,
      valorPago: parseFloat(valorPago) || 0,
      troco: 0, // Pode ser calculado se necessário
      dataFinalizacao: new Date(),
    };

    // Se for dinheiro, calcular troco
    if (formaPagamento === 'dinheiro') {
      const pago = parseFloat(valorPago) || 0;
      const troco = pago > totalComDesconto ? (pago - totalComDesconto) : 0;
      comandaData.troco = troco;
    }

    const comanda = new Comanda(comandaData);
    await comanda.save();

    // Gerar PDF da comanda
    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const path = require('path');

    const pdfDoc = new PDFDocument();
    const pdfDir = path.join(__dirname, '../public/comandas');
    const pdfFilename = `${comanda._id}.pdf`;
    const pdfPathFull = path.join(pdfDir, pdfFilename);

    fs.mkdirSync(pdfDir, { recursive: true });

    pdfDoc.pipe(fs.createWriteStream(pdfPathFull));

    // Cabeçalho do PDF
    pdfDoc.fontSize(20).text(`Comanda - Mesa ${mesa.numeroMesa}`, { align: 'center' });
    pdfDoc.moveDown();

    pedidos.forEach(pedido => {
      pdfDoc.fontSize(16).text(`Pedido #${pedido.orderNumber}`);
      pedido.itens.forEach(item => {
        pdfDoc.fontSize(12).text(`${item.quantidade} x ${item.product.nome} - R$ ${(item.product.preco * item.quantidade).toFixed(2)}`);
      });
      pdfDoc.fontSize(14).text(`Total do Pedido: R$ ${pedido.total.toFixed(2)}`);
      pdfDoc.moveDown();
    });

    pdfDoc.fontSize(14).text(`Total da Mesa: R$ ${totalMesa.toFixed(2)}`);
    if (tipoDesconto === 'porcentagem') {
      pdfDoc.text(`Desconto: ${valorDesconto}%`);
    } else if (tipoDesconto === 'valor') {
      pdfDoc.text(`Desconto: R$ ${parseFloat(valorDesconto).toFixed(2)}`);
    } else {
      pdfDoc.text(`Desconto: Nenhum`);
    }

    pdfDoc.text(`Total com Desconto: R$ ${totalComDesconto.toFixed(2)}`);
    pdfDoc.text(`Forma de Pagamento: ${formaPagamento}`);
    pdfDoc.text(`Valor Pago: R$ ${(parseFloat(valorPago) || 0).toFixed(2)}`);
    if (formaPagamento === 'dinheiro') {
      const pago = parseFloat(valorPago) || 0;
      const troco = pago - totalComDesconto;
      if (troco > 0) {
        pdfDoc.text(`Troco: R$ ${troco.toFixed(2)}`);
      }
    }

    pdfDoc.end();

    const pdfPathRelative = `/comandas/${pdfFilename}`;

    // Criar registro de mesa finalizada
    const finalizedMesa = new FinalizedTable({
      numeroMesa: mesa.numeroMesa,
      ambienteId: mesa.ambiente._id,
      garcomId: req.user.id,
      pedidos: pedidos.map(pedido => pedido._id),
      valorTotal: totalMesa,
      formaPagamento,
      valorPago: parseFloat(valorPago) || 0,
      tipoDesconto: tipoDesconto || 'nenhum',
      valorDesconto: parseFloat(valorDesconto) || 0,
      dataFinalizacao: new Date(),
      pdfPath: pdfPathRelative,
    });

    await finalizedMesa.save();

    // Atualizar status da mesa para 'livre'
    mesa.status = 'livre';
    await mesa.save();

    // Atualizar status dos pedidos para 'Finalizado'
    await Order.updateMany({ mesa: mesaId, status: 'Entregue' }, { status: 'Finalizado' });

    // Retornar resposta com o caminho do PDF
    res.json({ comanda, pdfPath: pdfPathRelative });
  } catch (error) {
    console.error('Erro ao finalizar mesa:', error);
    res.status(500).json({ message: 'Erro ao finalizar mesa' });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { numeroMesa, ambienteId, capacidade } = req.body;

    console.log('Dados recebidos para criação de mesa:', req.body);

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
      status: 'livre'
    });

    await table.save();

    console.log('Mesa criada:', table);

    res.status(201).json({ message: 'Mesa criada com sucesso', table });
  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    res.status(400).json({ message: 'Erro ao criar mesa', error: error.message });
  }
};

// **Remova a segunda definição de getAvailableTables**
/*
exports.getAvailableTables = async (req, res) => {
  try {
    const availableTables = await Table.find({ status: 'livre' });
    res.json({ tables: availableTables });
  } catch (error) {
    console.error('Erro ao obter mesas disponíveis:', error);
    res.status(500).json({ message: 'Erro ao obter mesas disponíveis.', error: error.message });
  }
};
*/

exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find().populate('ambiente');
    res.json(tables);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter mesas', error: error.message });
  }
};

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

exports.updateTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const updates = req.body;

    console.log('Dados recebidos para atualização de mesa:', updates);

    if (updates.capacidade && updates.capacidade < 1) {
      return res.status(400).json({ message: 'Capacidade deve ser pelo menos 1.' });
    }

    if (updates.ambienteId || updates.ambiente) { // Ajustado para capturar ambienteId ou ambiente
      const ambienteId = updates.ambienteId || updates.ambiente;
      const ambiente = await Ambiente.findById(ambienteId);
      if (!ambiente) {
        return res.status(404).json({ message: 'Ambiente não encontrado' });
      }
    }

    if (updates.numeroMesa) {
      const mesaExistente = await Table.findOne({ numeroMesa: updates.numeroMesa, _id: { $ne: tableId } });
      if (mesaExistente) {
        return res.status(400).json({ message: 'Número da mesa já está em uso.' });
      }
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada' });
    }

    // Atualizar capacidade
    if (updates.capacidade && updates.capacidade !== table.capacidade) {
      if (updates.capacidade > table.capacidade) {
        for (let i = table.capacidade + 1; i <= updates.capacidade; i++) {
          table.assentos.push({ numeroAssento: i });
        }
      } else {
        table.assentos = table.assentos.slice(0, updates.capacidade);
      }
      table.capacidade = updates.capacidade;
    }

    if (updates.numeroMesa !== undefined) table.numeroMesa = updates.numeroMesa;
    if (updates.ambienteId || updates.ambiente !== undefined) table.ambiente = updates.ambienteId || updates.ambiente;
    if (updates.position !== undefined) table.position = updates.position;

    await table.save();

    console.log('Mesa atualizada:', table);

    res.json({ message: 'Mesa atualizada com sucesso', table });
  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
    res.status(400).json({ message: 'Erro ao atualizar mesa', error: error.message });
  }
};

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

exports.updateTableStatus = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { status } = req.body;

    const validStatuses = ['livre', 'ocupada', 'reservada'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    // Populando os pedidos dentro dos assentos
    const table = await Table.findById(tableId).populate({
      path: 'assentos.pedidos',
      model: 'Order',
    });

    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    if (status.toLowerCase() === 'livre') {
      // Extrair todos os IDs de pedidos dos assentos
      const pedidoIds = table.assentos.reduce((acc, assento) => {
        if (assento.pedidos && assento.pedidos.length > 0) {
          return acc.concat(assento.pedidos.map(pedido => pedido._id));
        }
        return acc;
      }, []);

      if (pedidoIds.length > 0) {
        const allPaid = await areAllOrdersPaid(pedidoIds);
        if (!allPaid) {
          return res.status(400).json({ message: 'Não é possível marcar como livre. Há pedidos pendentes.' });
        }
      }
    }

    if (status.toLowerCase() === 'ocupada' && table.status !== 'livre') {
      return res.status(400).json({ message: 'Só é possível marcar como ocupada se a mesa estiver livre.' });
    }

    if (status.toLowerCase() === 'reservada' && table.status !== 'livre') {
      return res.status(400).json({ message: 'Só é possível marcar como reservada se a mesa estiver livre.' });
    }

    table.status = status.toLowerCase();
    await table.save();

    res.status(200).json({ message: 'Status da mesa atualizado com sucesso.', table });
  } catch (error) {
    console.error('Erro ao atualizar status da mesa:', error);
    res.status(400).json({ message: 'Erro ao atualizar status da mesa.', error: error.message });
  }
};

exports.finalizeTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { formaPagamento, valorPago, valorDesconto, tipoDesconto } = req.body;

    const table = await Table.findById(tableId).populate('orders');
    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada' });
    }

    if (table.status !== 'ocupada') {
      return res.status(400).json({ message: 'Mesa não está ocupada.' });
    }

    const pedidoIds = table.pedidos.map(p => p._id || p);

    const allPaid = await areAllOrdersPaid(pedidoIds);
    if (!allPaid) {
      return res.status(400).json({ message: 'Existem pedidos pendentes nesta mesa.' });
    }

    let valorTotal = await sumOrdersValue(pedidoIds);

    // Aplicar desconto, se houver
    let valorFinal = valorTotal;
    if (tipoDesconto === 'porcentagem' && valorDesconto > 0) {
      valorFinal = valorFinal - (valorFinal * (valorDesconto / 100));
    } else if (tipoDesconto === 'valor' && valorDesconto > 0) {
      valorFinal = Math.max(valorFinal - valorDesconto, 0);
    }

    // Caso pagamento em dinheiro, verificar se valorPago é suficiente
    if (formaPagamento === 'dinheiro' && valorPago < valorFinal) {
      return res.status(400).json({ message: 'Valor pago menor que o total final com desconto.' });
    }

    const finalizedTable = new FinalizedTable({
      numeroMesa: table.numeroMesa,
      ambienteId: table.ambiente,
      pedidos: pedidoIds,
      valorTotal: valorFinal,
      formaPagamento: formaPagamento || 'dinheiro',
      valorPago: valorPago || 0,
      tipoDesconto: tipoDesconto || 'nenhum',
      valorDesconto: valorDesconto || 0,
    });
    await finalizedTable.save();

    table.status = 'livre';
    table.pedidos = [];
    await table.save();

    return res.status(200).json({ message: 'Mesa finalizada com sucesso', table, finalizedTable });
  } catch (error) {
    console.error('Erro ao finalizar mesa:', error);
    return res.status(500).json({ message: 'Erro ao finalizar mesa', error: error.message });
  }
};
