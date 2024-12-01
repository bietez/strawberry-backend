// controllers/EmployeeController.js
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');

exports.createEmployee = async (req, res) => {
  try {
    const { nome, funcao, email, senha } = req.body;

    // Definir permissões com base na função
    let permissoes = [];
    switch (funcao) {
      case 'Garçom':
        permissoes = ['createOrder', 'viewOrder'];
        break;
      case 'Cozinheiro':
        permissoes = ['viewOrder', 'updateOrderStatus'];
        break;
      case 'Gerente':
        permissoes = ['manageEmployees', 'manageProducts', 'manageOrders', 'viewReports'];
        break;
      default:
        permissoes = [];
    }

    const employee = new Employee({ nome, funcao, email, senha, permissoes });
    await employee.save();

    // Remover a senha antes de enviar a resposta
    const employeeResponse = employee.toObject();
    delete employeeResponse.senha;

    res.status(201).json({ message: 'Funcionário criado com sucesso', employee: employeeResponse });
  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `${duplicatedField.toUpperCase()} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao criar funcionário', error: error.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select('-senha');
    res.json(employees);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter funcionários', error: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select('-senha');
    if (!employee) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter funcionário', error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { nome, funcao, email, senha } = req.body;

    let updateData = { nome, funcao, email };
    if (senha) {
      updateData.senha = senha;
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!employee) return res.status(404).json({ message: 'Funcionário não encontrado' });

    // Remover a senha antes de enviar a resposta
    const employeeResponse = employee.toObject();
    delete employeeResponse.senha;

    res.json({ message: 'Funcionário atualizado com sucesso', employee: employeeResponse });
  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `${duplicatedField.toUpperCase()} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao atualizar funcionário', error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id).select('-senha');
    if (!employee) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json({ message: 'Funcionário excluído com sucesso', employee });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir funcionário', error: error.message });
  }
};

exports.loginEmployee = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(404).json({ message: 'Funcionário não encontrado' });

    const isMatch = await employee.comparePassword(senha);
    if (!isMatch) return res.status(400).json({ message: 'Senha incorreta' });

    const token = jwt.sign(
      { id: employee._id, funcao: employee.funcao, permissoes: employee.permissoes },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ message: 'Login bem-sucedido', token });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao realizar login', error: error.message });
  }
};
