// controllers/reportController.js

const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Reservation = require('../models/Reservation');
const SalesGoal = require('../models/SalesGoal');
const User = require('../models/User');

exports.getStatistics = async (req, res) => {
  try {
    // Total de Vendas
    const totalVendasResult = await Order.aggregate([
      { $match: { status: 'pago' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalVendas = totalVendasResult[0]?.total || 0;

    // Total de Pedidos
    const totalPedidos = await Order.countDocuments();

    // Total de Clientes
    const totalClientes = await Customer.countDocuments();

    // Total de Produtos
    const totalProdutos = await Product.countDocuments();

    // Total de Reservas
    const totalReservas = await Reservation.countDocuments();

    // Vendas por Categoria
    const vendasPorCategoria = await Order.aggregate([
      { $unwind: '$itens' },
      {
        $lookup: {
          from: 'products',
          localField: 'itens.product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.categoria',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      { $unwind: '$categoryDetails' },
      {
        $group: {
          _id: '$categoryDetails.categoria',
          total: { $sum: '$itens.quantity' },
        },
      },
    ]);

    // Produtos Mais Vendidos
    const produtosMaisVendidos = await Order.aggregate([
      { $unwind: '$itens' },
      {
        $group: {
          _id: '$itens.product',
          total: { $sum: '$itens.quantity' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          nome: '$productDetails.nome',
          total: 1,
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);

    // Reservas por Ambiente
    const reservasPorAmbiente = await Reservation.aggregate([
      {
        $lookup: {
          from: 'tables',
          localField: 'mesa',
          foreignField: '_id',
          as: 'tableDetails',
        },
      },
      { $unwind: '$tableDetails' },
      {
        $lookup: {
          from: 'ambientes',
          localField: 'tableDetails.ambiente',
          foreignField: '_id',
          as: 'ambienteDetails',
        },
      },
      { $unwind: '$ambienteDetails' },
      {
        $group: {
          _id: '$ambienteDetails.nome',
          total: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalVendas,
      totalPedidos,
      totalClientes,
      totalProdutos,
      totalReservas,
      vendasPorCategoria,
      produtosMaisVendidos,
      reservasPorAmbiente,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
};
