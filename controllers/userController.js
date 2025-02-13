// backend/controllers/userController.js

const User = require('../models/User'); 
const bcrypt = require('bcrypt');
const allPermissions = require('../permissions');

// Função para criar usuário
// Função para criar usuário
exports.createUser = async (req, res) => {
  console.log('createUser: Requisição recebida', {
    headers: req.headers,
    params: req.params,
    query: req.query,
    body: req.body,
  });

  try {
    const {
      nome,
      email,
      role,
      permissions,
      managerId,
      senha,
      telefone,
      imagem,
      vacancy,
      contractType,
      hiredSince, // <-- Novo campo
    } = req.body;

    // Verifique se o nome ou email já existem
    const existingUser = await User.findOne({ $or: [{ nome }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Nome ou Email já está em uso.' });
    }

    // Crie o usuário
    const newUser = new User({
      nome,
      email,
      role,
      permissions,
      manager: managerId || null,
      senha, // Será hasheada pelo middleware
      telefone,
      imagem,
      vacancy,
      contractType,
      hiredSince: hiredSince || null, // Se vier vazio, fica null
    });

    await newUser.save();

    return res.status(201).json({ message: 'Usuário criado com sucesso.', user: newUser });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};


// Função para atualizar usuário
exports.updateUser = async (req, res) => {
  console.log('updateUser: Requisição recebida', {
    headers: req.headers,
    params: req.params,
    query: req.query,
    body: req.body,
  });

  const { id } = req.params;
  const {
    nome,
    email,
    role,
    permissions,
    managerId,
    senha,
    telefone,
    imagem,
    vacancy,
    contractType,
    hiredSince, // <-- Novo campo
  } = req.body;

  try {
    // Preparar os dados a serem atualizados
    const updateData = {
      nome,
      email,
      role,
      permissions,
      telefone,
      contractType,
    };

    // Atualiza campos somente se vierem da requisição
    if (imagem) {
      updateData.imagem = imagem;
    }
    if (vacancy) {
      updateData.vacancy = vacancy;
    }
    if (managerId) {
      updateData.manager = managerId;
    } else {
      updateData.manager = null;
    }
    if (hiredSince) {
      updateData.hiredSince = hiredSince;
    }

    // Caso senha venha preenchida
    if (senha && senha.trim() !== '') {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(senha, saltRounds);
      updateData.senha = hashedPassword;
    }

    // Atualizar o usuário no banco de dados
    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.json({ message: 'Usuário atualizado com sucesso.', user: updatedUser });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar usuário.' });
  }
};


// Função para verificar duplicidade do nome
exports.checkNomeDuplicado = async (req, res) => {
  try {
    const { nome } = req.params;

    const existingUser = await User.findOne({ nome });

    if (existingUser) {
      return res.json({ exists: true, userId: existingUser._id });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error('Erro ao verificar duplicidade do nome:', error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

// Função para obter membros da equipe
exports.getTeamMembers = async (req, res) => {
  try {
    // Supondo que somente admin ou manager podem listar
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    let teamMembers;
    if (req.user.role === 'admin') {
      // Admin pode ver todos os cargos que você desejar
      // Exemplo: Todos exceto admin
      teamMembers = await User.find({
        role: {
          $in: [
            'agent',
            'manager',
            'chef',
            'waiter',
            'receptionist',
            'deliveryMan',
            'kitchenAssistant',
            'barman',
            'cleaning',
            'feeder',
          ],
        },
      })
        .populate('manager', 'nome email role');
    } else {
      // Se for manager, pode ver apenas seus agentes
      teamMembers = await User.find({
        manager: req.user.id,
        role: 'agent',
      }).populate('manager', 'nome email role');
    }

    res.json(teamMembers);
  } catch (error) {
    console.error('Erro ao obter membros da equipe:', error);
    res.status(500).json({
      message: 'Erro ao obter membros da equipe',
      error: error.message,
    });
  }
};

// Função para obter dados do usuário logado
exports.getMe = async (req, res) => {
  try {
    // Supondo que o req.user foi definido pelo authMiddleware com { id: ..., role: ..., permissions: ... }
    const userId = req.user.id;
    // Inclua quaisquer campos adicionais que queira retornar
    const user = await User.findById(userId).select({
      nome: 1,
      email: 1,
      role: 1,
      permissions: 1,
      vacancy: 1,
      contractType: 1,
      imagem: 1,
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao obter usuário logado:', error);
    res.status(500).json({
      message: 'Erro ao obter usuário logado',
      error: error.message,
    });
  }
};

exports.checkNomeDuplicado = async (req, res) => {
  const { nome } = req.params;

  if (!nome) {
    return res.status(400).json({ message: 'Nome é obrigatório.' });
  }

  try {
    // Busca insensível a maiúsculas/minúsculas
    const user = await User.findOne({ nome: { $regex: new RegExp(`^${nome.trim()}$`, 'i') } }).exec();

    if (user) {
      res.json({
        exists: true,
        userId: user._id.toString(),
      });
    } else {
      res.json({
        exists: false,
        userId: null,
      });
    }
  } catch (error) {
    console.error('Erro ao verificar duplicidade do nome:', error);
    res.status(500).json({
      message: 'Erro interno do servidor ao verificar o nome.',
    });
  }
};
// Função para obter usuário por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Valide o ID se necessário
    // Exemplo: if (!mongoose.Types.ObjectId.isValid(id)) ...

    // Exclui o campo `senha` e qualquer outro campo sensível
    const user = await User.findById(id).select('-senha');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return res.status(500).json({ message: 'Erro ao obter usuário.' });
  }
};
