// controllers/finalizedOrderController.js
const FinalizedOrder = require('../models/FinalizedOrder');
const Order = require('../models/Order');
const Table = require('../models/Table');

exports.createFinalizedOrder = async (req, res) => {
  try {
    const { mesaId } = req.body;
    if (!mesaId) {
      return res.status(400).json({ message: 'ID da mesa é obrigatório.' });
    }

    // Buscar a mesa
    const table = await Table.findById(mesaId).populate('ambiente');
    if (!table) return res.status(404).json({ message: 'Mesa não encontrada' });

    // Buscar todos os pedidos dessa mesa com status != Entregue (ou conforme sua lógica)
    // Aqui assumimos que finalizamos todos os pedidos PENDENTES ou PREPARANDO dessa mesa.
    // Mas se sua lógica é outra, ajuste conforme necessário.
    const orders = await Order.find({ mesa: mesaId, status: 'Entregue' }).populate('itens.product').populate('garcom');

    if (!orders || orders.length === 0) {
      return res.status(400).json({ message: 'Nenhum pedido entregue para finalizar nesta mesa.' });
    }

    let valorTotal = 0;
    const consumoPorAssento = {};

    // Calcular valor total e consumo por assento
    orders.forEach((order) => {
      valorTotal += order.total;
      const assentoKey = order.assento || 'Sem Assento';
      if (!consumoPorAssento[assentoKey]) {
        consumoPorAssento[assentoKey] = 0;
      }
      consumoPorAssento[assentoKey] += order.total;
    });

    const consumoArray = Object.keys(consumoPorAssento).map((assento) => ({
      assento,
      valor: consumoPorAssento[assento],
    }));

    const garcom = orders[0].garcom ? orders[0].garcom._id : null; 
    const ambienteId = table.ambiente._id;

    const finalizedOrder = new FinalizedOrder({
      mesaId,
      pedidos: orders.map(o => o._id),
      garcom: garcom,
      valorTotal,
      consumoPorAssento: consumoArray,
      ambienteId,
    });

    await finalizedOrder.save();

    // Atualizar a mesa para 'livre' já que finalizamos
    table.status = 'livre';
    await table.save();

    res.status(201).json({ message: 'Mesa finalizada com sucesso', finalizedOrder });
  } catch (error) {
    console.error('Erro ao finalizar mesa:', error);
    res.status(500).json({ message: 'Erro ao finalizar mesa', error: error.message });
  }
};

exports.getFinalizedOrders = async (req, res) => {
  try {
    const finalizedOrders = await FinalizedOrder.find().populate('mesaId').populate('garcom').populate('pedidos');
    res.json(finalizedOrders);
  } catch (error) {
    console.error('Erro ao obter finalized orders:', error);
    res.status(500).json({ message: 'Erro ao obter finalized orders', error: error.message });
  }
};

exports.getFinalizedOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const finalizedOrder = await FinalizedOrder.findById(id).populate('mesaId').populate('garcom').populate({
      path: 'pedidos',
      populate: {
        path: 'itens.product',
        model: 'Product'
      }
    });

    if (!finalizedOrder) return res.status(404).json({ message: 'Registro não encontrado' });

    res.json(finalizedOrder);
  } catch (error) {
    console.error('Erro ao obter finalized order:', error);
    res.status(500).json({ message: 'Erro ao obter finalized order', error: error.message });
  }
};
