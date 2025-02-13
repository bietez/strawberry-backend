const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');
const rolePermissions = require('../rolePermissions');
const allPermissions = require('../permissions');
const bcrypt = require('bcrypt'); // para atualizar a senha no updateUser
const { sendEmail } = require('../utils/emailUtil');
const AuditLog = require('../models/AuditLog');

// ===========================================
// =============== REGISTER ==================
// ===========================================
exports.register = async (req, res) => {
  try {
    const { nome, email, senha, role, permissions, managerId } = req.body;

    let userPermissions = permissions;

    if (!permissions || permissions.length === 0) {
      // Se nenhuma permissão for fornecida, atribua as permissões padrão da role
      userPermissions = rolePermissions[role] || [];
    }

    if (role !== 'admin' && userPermissions.includes('*')) {
      return res
        .status(400)
        .json({ message: 'Somente usuários com role "admin" podem ter acesso total.' });
    }

    // Verificar se o usuário sendo criado é um agente e associar a um gerente
    let manager = null;
    if (role === 'agent') {
      // Verifica se o managerId foi fornecido
      if (!managerId) {
        return res
          .status(400)
          .json({ message: 'ID do gerente é obrigatório para agentes.' });
      }

      // Busca o gerente no banco de dados
      manager = await User.findById(managerId);
      if (!manager || (manager.role !== 'manager' && manager.role !== 'admin')) {
        return res.status(400).json({ message: 'Gerente inválido.' });
      }
    }

    const user = new User({
      nome,
      email,
      senha,
      role,
      permissions: userPermissions,
      manager: manager ? manager._id : undefined, // Associar o gerente se houver
    });

    await user.save();

    // Registrar ação de criação de usuário
    await AuditLog.create({
      userId: req.user ? req.user.id : user._id, // Caso o usuário não esteja logado (registro inicial)
      userEmail: req.user ? req.user.email : user.email,
      action: 'register_user',
      details: {
        createdUserId: user._id,
        createdUserEmail: user.email,
        role: user.role,
      },
    });

    return res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (error) {
    return res
      .status(400)
      .json({ message: 'Erro ao registrar usuário', error: error.message });
  }
};

// ===========================================
// ================= LOGIN ===================
// ===========================================
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    const isMatch = await user.comparePassword(senha);
    if (!isMatch) {
      return res.status(400).json({ message: 'Senha incorreta' });
    }

    // Se for admin, atribui todas as permissões
    if (user.role === 'admin') {
      user.permissions = allPermissions;
    }

    // =========== Gerar Access Token (30min) ===========
    const accessToken = jwt.sign(
      { id: user._id, role: user.role, permissions: user.permissions },
      config.jwtSecret,
      { expiresIn: '8h' } // <-- expira em 30 minutos
    );

    // =========== Gerar Refresh Token (7 dias) ===========
    const refreshToken = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Armazenar o refreshToken no usuário (pode ter vários)
    user.refreshTokens.push(refreshToken);
    await user.save();

    // Registrar ação de login
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      action: 'login',
      details: {
        message: 'Usuário fez login',
        ip: req.ip,
      },
    });

    return res.json({
      token: accessToken,      // Access Token
      refreshToken,            // Refresh Token
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: 'Erro ao fazer login', error: error.message });
  }
};

// ===========================================
// ============ REFRESH TOKEN ===============
// ===========================================
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token é obrigatório' });
    }

    // Verifica se esse refreshToken pertence a algum usuário
    const user = await User.findOne({ refreshTokens: refreshToken });
    if (!user) {
      return res
        .status(401)
        .json({ message: 'Refresh token inválido ou não encontrado.' });
    }

    // Verifica se o refreshToken ainda é válido
    jwt.verify(refreshToken, config.jwtSecret, async (err, decoded) => {
      if (err) {
        // Se der erro (expirado, inválido, etc.), remove do array e retorna 401
        user.refreshTokens = user.refreshTokens.filter((rt) => rt !== refreshToken);
        await user.save();
        return res.status(401).json({ message: 'Refresh token expirado ou inválido.' });
      }

      // Se chegou aqui, geramos um novo Access Token de 30 minutos
      const newAccessToken = jwt.sign(
        { id: user._id, role: user.role, permissions: user.permissions },
        config.jwtSecret,
        { expiresIn: '30m' }
      );

      return res.json({ token: newAccessToken });
    });
  } catch (error) {
    console.error('Erro ao dar refresh no token:', error);
    return res
      .status(500)
      .json({ message: 'Erro ao processar refresh token', error: error.message });
  }
};

// ===========================================
// ========== RECUPERAR SENHA ===============
// ===========================================
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar se o usuário existe
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    // Gerar OTP e tempo de expiração
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
    const expires = Date.now() + 10 * 60 * 1000; // Expira em 10 minutos

    // Atualizar o usuário com o OTP e expiração
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = expires;
    await user.save();

    // Enviar o email com o OTP
    const subject = 'Recuperação de Senha';
    const text = `Seu código de recuperação de senha é: ${otp}. Ele expira em 10 minutos.`;
    await sendEmail(user.email, subject, text);

    return res.json({ message: 'OTP enviado para o email cadastrado' });
  } catch (error) {
    console.error('[requestPasswordReset] - Erro no processo de recuperação de senha:', error);
    return res.status(500).json({
      message: 'Erro ao solicitar recuperação de senha',
      error: error.message,
    });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar se o usuário existe
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    // Gerar OTP e tempo de expiração
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
    const expires = Date.now() + 10 * 60 * 1000; // Expira em 10 minutos

    // Atualizar o usuário com o OTP e expiração
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = expires;
    await user.save();

    // Enviar o email com o OTP
    const subject = 'Recuperação de Senha';
    const text = `Seu código de recuperação de senha é: ${otp}. Ele expira em 10 minutos.`;
    await sendEmail(user.email, subject, text);

    return res.json({ message: 'OTP enviado para o email cadastrado' });
  } catch (error) {
    console.error('[requestPasswordReset] - Erro no processo de recuperação de senha:', error);
    return res.status(500).json({
      message: 'Erro ao solicitar recuperação de senha',
      error: error.message,
    });
  }
};

exports.resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, novaSenha } = req.body;

    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se o OTP é válido e não expirou
    if (user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP inválido ou expirado' });
    }

    // Atualizar a senha do usuário
    user.senha = novaSenha; // O hash será aplicado no .pre('save')
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Erro ao redefinir senha', error: error.message });
  }
};

// ===========================================
// =============== UPDATE USER ==============
// ===========================================
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { nome, email, role, managerId, permissions, senha } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Atualizar campos permitidos
    if (nome) user.nome = nome;
    if (email) user.email = email;
    if (role) user.role = role;
    if (managerId) user.manager = managerId;
    if (permissions) user.permissions = permissions;

    // Atualizar senha se fornecida
    if (senha) {
      const salt = await bcrypt.genSalt(10);
      user.senha = await bcrypt.hash(senha, salt);
    }

    await user.save();
    return res
      .status(200)
      .json({ message: 'Usuário atualizado com sucesso.', user });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res
      .status(500)
      .json({ message: 'Erro ao atualizar usuário.', error: error.message });
  }
};
