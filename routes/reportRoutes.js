// Conteúdo de: routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const User = require('../models/User');

router.get('/statistics', async (req, res) => {
  try {
    // Total de Vendas
    const totalVendasResult = await Order.aggregate([
      { $match: { status: 'Pago' } },
      { $group: { _id: null, totalVendas: { $sum: '$total' } } },
    ]);
    const totalVendas = totalVendasResult[0]?.totalVendas || 0;

    // Pedidos Hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const pedidosHoje = await Order.countDocuments({
      createdAt: { $gte: hoje },
    });

    // Clientes Ativos
    const clientesAtivos = await Customer.countDocuments();

    // Produtos em Falta (quantidade em estoque menor ou igual a 5)
    const produtosEmFalta = await Product.countDocuments({ quantidadeEstoque: { $lte: 5 } });

    // Novos Clientes (últimos 7 dias)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const novosClientes = await Customer.countDocuments({
      createdAt: { $gte: seteDiasAtras },
    });

    // Pedidos Pendentes
    const pedidosPendentes = await Order.countDocuments({ status: { $ne: 'Pago' } });

    // Vendas nos Últimos 7 Dias
    const vendasUltimos7Dias = await Order.aggregate([
      { $match: { status: 'Pago', createdAt: { $gte: seteDiasAtras } } },
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

    // Pedidos por Categoria
    const pedidosPorCategoria = await Order.aggregate([
      { $match: { status: 'Pago' } },
      { $unwind: '$itens' },
      {
        $lookup: {
          from: 'products',
          localField: 'itens',
          foreignField: '_id',
          as: 'produto',
        },
      },
      { $unwind: '$produto' },
      {
        $lookup: {
          from: 'categories',
          localField: 'produto.categoria',
          foreignField: '_id',
          as: 'categoria',
        },
      },
      { $unwind: '$categoria' },
      {
        $group: {
          _id: '$categoria.categoria',
          quantidade: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          categoria: '$_id',
          quantidade: 1,
        },
      },
    ]);

    // Métodos de Pagamento
    const metodosPagamento = await Order.aggregate([
      { $match: { status: 'Pago' } },
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
      { $match: { status: 'Pago' } },
      {
        $group: {
          _id: '$employeeId',
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
    const vendasPorMes = await Order.aggregate([
      { $match: { status: 'Pago', createdAt: { $gte: dozeMesesAtras } } },
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
      pedidosHoje,
      clientesAtivos,
      produtosEmFalta,
      novosClientes,
      pedidosPendentes,
      vendasUltimos7Dias,
      pedidosPorCategoria,
      metodosPagamento,
      vendasPorFuncionario,
      vendasPorMes,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
});

module.exports = router;
