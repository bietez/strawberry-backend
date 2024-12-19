// controllers/salesGoalController.js

const SalesGoal = require('../models/SalesGoal');
const User = require('../models/User');
const Product = require('../models/Product'); // Importação do modelo Product
const FinalizedTable = require('../models/FinalizedTable'); // Importação do modelo FinalizedTable
const mongoose = require('mongoose');

// Obter uma meta de vendas por ID
exports.getSalesGoalById = async (req, res) => {
  const { id } = req.params;
  try {
    const salesGoal = await SalesGoal.findById(id).populate('employee manager product');
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }
    res.json(salesGoal);
  } catch (error) {
    console.error('Erro ao obter meta de vendas específica:', error);
    res.status(500).json({ message: 'Erro ao obter meta de vendas específica.', error: error.message });
  }
};

// Criar nova meta de vendas
exports.createSalesGoal = async (req, res) => {
  try {
    const { employeeId, productId, goalName, goalAmount, startDate, endDate } = req.body;

    // Verifica se o funcionário existe e é um agente
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'agent') {
      return res.status(404).json({ message: 'Funcionário não encontrado ou não é um agente' });
    }

    // Verifica se o produto existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Verifica se o gerente tem permissão para atribuir meta a este funcionário
    if (req.user.role === 'manager' && (!employee.manager || employee.manager.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Você não tem permissão para definir metas para este funcionário' });
    }

    // Verifica se startDate é antes de endDate
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'startDate deve ser antes de endDate' });
    }

    // Cria a meta de vendas
    const salesGoal = new SalesGoal({
      employee: employeeId,
      manager: req.user.id,
      product: productId,
      goalName,
      goalAmount,
      startDate,
      endDate,
    });

    await salesGoal.save();

    res.status(201).json({ message: 'Meta de vendas criada com sucesso', salesGoal });
  } catch (error) {
    console.error('Erro ao criar meta de vendas:', error);
    res.status(400).json({ message: 'Erro ao criar meta de vendas', error: error.message });
  }
};

// Obter todas as metas de vendas (Admin e Manager)
exports.getSalesGoals = async (req, res) => {
  try {
    let salesGoals;
    if (req.user.role === 'admin') {
      salesGoals = await SalesGoal.find().populate('employee manager product');
    } else if (req.user.role === 'manager') {
      salesGoals = await SalesGoal.find({ manager: req.user.id }).populate('employee manager product');
    } else {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(salesGoals);
  } catch (error) {
    console.error('Erro ao obter metas de vendas:', error);
    res.status(500).json({ message: 'Erro ao obter metas de vendas.' });
  }
};

// Atualizar uma meta de vendas
exports.updateSalesGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, goalName, goalAmount, startDate, endDate, productId } = req.body;

    const salesGoal = await SalesGoal.findById(id);
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }

    // Verifica permissão
    if (
      req.user.role === 'manager' &&
      salesGoal.manager.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar esta meta' });
    }

    // Verifica se startDate é antes de endDate
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'startDate deve ser antes de endDate' });
    }

    // Atualiza o funcionário se employeeId for fornecido
    if (employeeId !== undefined) {
      const employee = await User.findById(employeeId);
      if (!employee || employee.role !== 'agent') {
        return res.status(404).json({ message: 'Funcionário não encontrado ou não é um agente' });
      }

      // Se o usuário for gerente, verifica se ele gerencia o funcionário
      if (req.user.role === 'manager' && (!employee.manager || employee.manager.toString() !== req.user.id)) {
        return res.status(403).json({ message: 'Você não tem permissão para atribuir esta meta a este funcionário' });
      }

      salesGoal.employee = employeeId;
    }

    // Atualiza outros campos
    if (goalName !== undefined) salesGoal.goalName = goalName;
    if (goalAmount !== undefined) salesGoal.goalAmount = goalAmount;
    if (startDate !== undefined) salesGoal.startDate = startDate;
    if (endDate !== undefined) salesGoal.endDate = endDate;

    // Atualiza o produto se productId for fornecido
    if (productId !== undefined) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      salesGoal.product = productId;
    }

    await salesGoal.save();

    res.json({ message: 'Meta de vendas atualizada com sucesso', salesGoal });
  } catch (error) {
    console.error('Erro ao atualizar meta de vendas:', error);
    res.status(500).json({ message: 'Erro ao atualizar meta de vendas', error: error.message });
  }
};

// Excluir uma meta de vendas
exports.deleteSalesGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const salesGoal = await SalesGoal.findById(id);
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }

    // Verifica permissão
    if (
      req.user.role === 'manager' &&
      salesGoal.manager.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir esta meta' });
    }

    // Substitui salesGoal.remove() por salesGoal.deleteOne()
    await salesGoal.deleteOne();

    res.json({ message: 'Meta de vendas excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir meta de vendas:', error);
    res.status(500).json({ message: 'Erro ao excluir meta de vendas', error: error.message });
  }
};

// Obter metas de vendas por funcionário
exports.getSalesGoalsByEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o usuário autenticado tem permissão para acessar os dados
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    // Busca as metas de vendas do funcionário específico
    const salesGoals = await SalesGoal.find({ employee: id }).populate('employee manager product');

    res.json(salesGoals);
  } catch (error) {
    console.error('Erro ao obter metas de vendas do funcionário:', error);
    res.status(500).json({ message: 'Erro ao obter metas de vendas do funcionário.', error: error.message });
  }
};

// Obter metas de vendas avançadas com paginação e pesquisa
exports.getAdvancedSalesGoals = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'asc', search = '' } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { goalName: { $regex: search, $options: 'i' } },
        { 'employee.nome': { $regex: search, $options: 'i' } },
        { 'product.nome': { $regex: search, $options: 'i' } },
      ];
    }

    const salesGoals = await SalesGoal.find(query)
      .populate('employee manager product')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SalesGoal.countDocuments(query);

    res.json({
      salesGoals,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Erro ao obter metas de vendas avançadas:', error);
    res.status(500).json({ message: 'Erro ao obter metas de vendas avançadas.', error: error.message });
  }
};

// Obter detalhes da meta de vendas
exports.getSalesGoalDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const salesGoal = await SalesGoal.findById(id).populate('employee manager product');
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }

    // Agregando dados das mesas finalizadas (FinalizedTable)
    const finalizedTables = await FinalizedTable.find({
      garcomId: salesGoal.employee,
      dataFinalizacao: { $gte: salesGoal.startDate, $lte: salesGoal.endDate },
      // Filtra pedidos pelo produto da meta
      'pedidos.product': salesGoal.product,
    }).populate({
      path: 'pedidos.product',
      model: 'Product',
    });

    // Calculando o total vendido para o produto específico
    let totalSold = 0;
    const sales = [];

    finalizedTables.forEach(table => {
      table.pedidos.forEach(pedido => {
        if (pedido.product && pedido.product._id.toString() === salesGoal.product.toString()) {
          const saleAmount = (pedido.quantidade || 0) * (pedido.product.preco || 0); // Supondo que o produto tenha campo 'preco'
          totalSold += saleAmount;
          sales.push({
            date: table.dataFinalizacao,
            amount: saleAmount,
          });
        }
      });
    });

    // Limitando as últimas 10 vendas
    const lastTenSales = sales.slice(-10).reverse();

    res.json({ totalSold, sales: lastTenSales });
  } catch (error) {
    console.error('Erro ao obter detalhes da meta de vendas:', error);
    res.status(500).json({ message: 'Erro ao obter detalhes da meta de vendas.', error: error.message });
  }
};
