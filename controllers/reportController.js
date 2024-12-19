// src/controllers/reportController.js

const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Reservation = require('../models/Reservation'); 
const Payment = require('../models/Payment'); 

/**
 * Obtém todas as estatísticas do sistema.
 */
exports.getStatistics = async (req, res) => {
  try {
    // Total de Vendas
    const totalVendasResult = await Order.aggregate([
      { $match: { status: 'Pago' } }, // Ajustado para 'Pago'
      { $group: { _id: null, totalVendas: { $sum: '$total' } } },
    ]);
    const totalVendas = totalVendasResult[0]?.totalVendas || 0;

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
          total: { $sum: '$itens.quantidade' },
        },
      },
      {
        $project: {
          _id: 0,
          categoria: '$_id',
          total: 1,
        },
      },
    ]);

    // Produtos Mais Vendidos
    const produtosMaisVendidos = await Order.aggregate([
      { $unwind: '$itens' },
      {
        $group: {
          _id: '$itens.product',
          total: { $sum: '$itens.quantidade' },
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

    // Produtos com Estoque Baixo
    const produtosComEstoqueBaixo = await Product.find({ quantidadeEstoque: { $lte: 5 }, disponivel: true })
      .sort({ quantidadeEstoque: 1 })
      .limit(10)
      .populate('categoria');

    // Vendas nos Últimos 7 Dias
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 6); // Inclui hoje
    seteDiasAtras.setHours(0, 0, 0, 0);

    const vendasUltimos7Dias = await Order.aggregate([
      { $match: { status: 'Pago', createdAt: { $gte: seteDiasAtras } } }, // Ajustado para 'Pago'
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalVendas: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          dia: '$_id',
          totalVendas: 1,
        },
      },
    ]);

    // Métodos de Pagamento
    const metodosPagamento = await Payment.aggregate([
      { $match: { status: 'Pago' } }, // Ajustado para 'Pago'
      {
        $group: {
          _id: '$metodoPagamento',
          quantidade: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          metodo: '$_id',
          quantidade: 1,
        },
      },
    ]);

    // Vendas por Funcionário
    const vendasPorFuncionario = await Order.aggregate([
      { $match: { status: 'Pago' } }, // Ajustado para 'Pago'
      {
        $group: {
          _id: '$garcom',
          totalVendas: { $sum: '$total' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'funcionario',
        },
      },
      { $unwind: '$funcionario' },
      {
        $project: {
          _id: 0,
          funcionario: '$funcionario.nome',
          totalVendas: 1,
        },
      },
    ]);

    // Vendas por Mês (últimos 12 meses)
    const dozeMesesAtras = new Date();
    dozeMesesAtras.setMonth(dozeMesesAtras.getMonth() - 11);
    dozeMesesAtras.setDate(1);
    dozeMesesAtras.setHours(0, 0, 0, 0);

    const vendasPorMes = await Order.aggregate([
      { $match: { status: 'Pago', createdAt: { $gte: dozeMesesAtras } } }, // Ajustado para 'Pago'
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalVendas: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          mes: '$_id',
          totalVendas: 1,
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
      produtosComEstoqueBaixo,
      vendasUltimos7Dias,
      metodosPagamento,
      vendasPorFuncionario,
      vendasPorMes,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
};

/**
 * Obtém os 10 produtos com menor quantidade em estoque.
 */
exports.getProdutosComEstoqueBaixo = async (req, res) => {
  try {
    const produtosComEstoqueBaixo = await Product.find({ quantidadeEstoque: { $lte: 5 }, disponivel: true })
      .sort({ quantidadeEstoque: 1 })
      .limit(10)
      .populate('categoria');

    res.json(produtosComEstoqueBaixo);
  } catch (error) {
    console.error('Erro ao obter produtos com estoque baixo:', error);
    res.status(500).json({ message: 'Erro ao obter produtos com estoque baixo' });
  }
};
