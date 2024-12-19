// controllers/qrController.js
const User = require('../models/User');
const QrToken = require('../models/QrToken');
const jwt = require('jsonwebtoken');
const config = require('../config');
const crypto = require('crypto');
const QRCode = require('qrcode');

exports.generateQrToken = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId é obrigatório' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    // Gerar um token aleatório
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expira em 5 minutos

    await QrToken.create({ user: user._id, token, expiresAt });

    // Gerar QR Code com o token
    const qrData = { token }; // Apenas o token
    const qrString = JSON.stringify(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString);

    res.json({ qrCodeDataURL, expiresAt });
  } catch (error) {
    console.error('Erro ao gerar QR Token:', error);
    res.status(500).json({ message: 'Erro interno ao gerar QR Token' });
  }
};

exports.loginWithQr = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token do QR Code é obrigatório' });

    const qrRecord = await QrToken.findOne({ token, used: false });
    if (!qrRecord) return res.status(400).json({ message: 'Token inválido ou expirado' });

    if (qrRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Token expirado' });
    }

    const user = await User.findById(qrRecord.user);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    // Marcar token como usado
    qrRecord.used = true;
    await qrRecord.save();

    // Gerar JWT
    const jwtToken = jwt.sign({ id: user._id, role: user.role, permissions: user.permissions }, config.jwtSecret, { expiresIn: '8h' });

    res.json({ token: jwtToken, user });
  } catch (error) {
    console.error('Erro ao fazer login com QR:', error);
    res.status(500).json({ message: 'Erro interno ao fazer login com QR' });
  }
};

exports.generatePermanentQr = async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: 'userId é obrigatório' });
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
  
      // Definir a senha fixa de acordo com a role
      let senhaEmTextoClaro;
      if (user.role === 'admin') {
        senhaEmTextoClaro = 'mzgxdyj8';
      } else {
        senhaEmTextoClaro = 'senha123';
      }
  
      const data = {
        usuario: user.email,
        senha: senhaEmTextoClaro
      };
  
      const qrString = JSON.stringify(data);
      const qrCodeDataURL = await QRCode.toDataURL(qrString);
  
      res.json({ qrCodeDataURL });
    } catch (error) {
      console.error('Erro ao gerar QR Code Permanente:', error);
      res.status(500).json({ message: 'Erro interno ao gerar QR Code', error: error.message });
    }
  };
