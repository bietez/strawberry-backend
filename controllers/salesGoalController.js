// controllers/salesGoalController.js
const SalesGoal = require('../models/SalesGoal');
const User = require('../models/User');

exports.createSalesGoal = async (req, res) => {
  try {
    const { employeeId, goalName, goalAmount, startDate, endDate } = req.body;

    // Verifica se o funcionário existe
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'agent') {
      return res.status(404).json({ message: 'Funcionário não encontrado ou não é um agente' });
    }

    // Verifica se o gerente tem permissão para atribuir meta a este funcionário
    if (req.user.role === 'manager' && employee.manager.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Você não tem permissão para definir metas para este funcionário' });
    }

    // Cria a meta de vendas
    const salesGoal = new SalesGoal({
      employee: employeeId,
      manager: req.user.id,
      goalName,
      goalAmount,
      startDate,
      endDate,
    });

    await salesGoal.save();

    res.status(201).json({ message: 'Meta de vendas criada com sucesso', salesGoal });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar meta de vendas', error: error.message });
  }
};

exports.getSalesGoals = async (req, res) => {
  try {
    let salesGoals;
    if (req.user.role === 'admin') {
      salesGoals = await SalesGoal.find().populate('employee manager');
    } else if (req.user.role === 'manager') {
      salesGoals = await SalesGoal.find({ manager: req.user.id }).populate('employee manager');
    } else {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(salesGoals);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter metas de vendas', error: error.message });
  }
};

exports.updateSalesGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { goalName, goalAmount, startDate, endDate } = req.body;

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

    // Atualiza a meta
    salesGoal.goalName = goalName || salesGoal.goalName;
    salesGoal.goalAmount = goalAmount || salesGoal.goalAmount;
    salesGoal.startDate = startDate || salesGoal.startDate;
    salesGoal.endDate = endDate || salesGoal.endDate;

    await salesGoal.save();

    res.json({ message: 'Meta de vendas atualizada com sucesso', salesGoal });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar meta de vendas', error: error.message });
  }
};

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

    await salesGoal.remove();

    res.json({ message: 'Meta de vendas excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir meta de vendas', error: error.message });
  }
};
