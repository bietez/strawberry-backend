// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const allPermissions = require("../permissions");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader)
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });

  const token = authHeader.split(' ')[1]; // Extrai o token após 'Bearer '

  if (!token)
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user)
      return res.status(401).json({ message: 'Usuário não encontrado.' });

    // Preparar as permissões do usuário
    let userPermissions = user.permissions;

    // Se a função for admin, atribuir todas as permissões ao usuário
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

    console.log(req.user);

    next();
  } catch (err) {
    console.error('Erro na verificação do token:', err);
    res.status(400).json({ message: 'Token inválido.' });
  }
}

module.exports = authMiddleware;
