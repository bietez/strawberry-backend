// controllers/customerController.js
const Customer = require('../models/Customer');

exports.createCustomer = async (req, res) => {
  try {
    const {
      cpfCnpj,
      nome,
      contato,
      telefone,
      whatsapp,
      email,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
    } = req.body;

    const customer = new Customer({
      cpfCnpj,
      nome,
      contato,
      telefone,
      whatsapp,
      email,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
    });

    await customer.save();
    res.status(201).json({ message: 'Cliente criado com sucesso', customer });
  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `${duplicatedField.toUpperCase()} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao criar cliente', error: error.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate('historicoPedidos');
    res.json(customers);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter clientes', error: error.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('historicoPedidos');
    if (!customer) return res.status(404).json({ message: 'Cliente não encontrado' });
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter cliente', error: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const {
      cpfCnpj,
      nome,
      contato,
      telefone,
      whatsapp,
      email,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
    } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        cpfCnpj,
        nome,
        contato,
        telefone,
        whatsapp,
        email,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      },
      { new: true, runValidators: true }
    );

    if (!customer) return res.status(404).json({ message: 'Cliente não encontrado' });
    res.json({ message: 'Cliente atualizado com sucesso', customer });
  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `${duplicatedField.toUpperCase()} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao atualizar cliente', error: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Cliente não encontrado' });
    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir cliente', error: error.message });
  }
};
