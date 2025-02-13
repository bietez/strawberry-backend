const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const allPermissions = require("../permissions");
const { unless } = require('express-unless'); // Importação via desestruturação

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }

    let userPermissions = user.permissions;

    if (user.role === 'admin') {
      userPermissions = allPermissions;
    }

    req.user = {
      nome: user.nome,
      id: user._id,
      role: user.role,
      manager: user.manager,
      permissions: userPermissions,
    };

    next();
  } catch (err) {
    res.status(400).json({ message: 'Token inválido.' });
  }
}

authMiddleware.unless = unless; // Anexa o método unless

module.exports = authMiddleware;
