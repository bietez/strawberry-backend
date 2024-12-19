const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const allPermissions = require('../permissions')


exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, role, permissions, managerId, senha } = req.body;

    // Buscar o usuário que se deseja atualizar
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar permissões de quem está logado (req.user)
    if (req.user.role !== 'admin') {
      // Se não for admin
      if (req.user.role === 'manager') {
        // Manager só pode atualizar seus agentes
        // Verificar se o userToUpdate é agent e se manager dele é o req.user
        if (userToUpdate.role !== 'agent' || String(userToUpdate.manager) !== String(req.user.id)) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
      } else {
        // Se não é admin nem manager, não pode atualizar
        return res.status(403).json({ message: 'Acesso negado' });
      }
    }

    // Filtrar permissões para incluir apenas as válidas
    let filteredPermissions = [];
    if (Array.isArray(permissions)) {
      filteredPermissions = permissions.filter((perm) => allPermissions.includes(perm));
    }

    // Montar objeto de atualização
    const updateData = {
      nome,
      email,
      role,
      permissions: filteredPermissions
    };

    // Se for agent, managerId é obrigatório
    if (role === 'agent') {
      if (!managerId) {
        return res.status(400).json({ message: 'managerId é obrigatório para agentes' });
      }
      updateData.manager = managerId;
    } else {
      // Caso contrário, remove o campo manager
      updateData.manager = undefined;
    }

    // Se senha for enviada, atualizar a senha
    if (senha && senha.trim() !== '') {
      const hashedPassword = await bcrypt.hash(senha, 10);
      updateData.senha = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado após atualização' });
    }

    res.json({ message: 'Usuário atualizado com sucesso', user: updatedUser });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar membro da equipe', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    // Supondo que o req.user foi definido pelo authMiddleware com { id: ..., role: ..., permissions: ... }
    const userId = req.user.id;
    const user = await User.findById(userId).select({ nome: 1, email: 1, role: 1, permissions: 1 });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao obter usuário logado:', error);
    res.status(500).json({ message: 'Erro ao obter usuário logado', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Valide o ID se necessário
    const user = await User.findById(id).select('-password'); // Exclui a senha se existir

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return res.status(500).json({ message: 'Erro ao obter usuário.' });
  }
};

exports.getTeamMembers = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    let teamMembers;
    if (req.user.role === 'admin') {
      // Admin pode ver todos os agentes e gerentes
      teamMembers = await User.find({ role: { $in: ['agent', 'manager'] } })
        .populate('manager', 'nome email role');
    } else {
      // Manager vê apenas seus agentes
      teamMembers = await User.find({ manager: req.user.id, role: 'agent' })
        .populate('manager', 'nome email role');
    }

    res.json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter membros da equipe', error: error.message });
  }
};
