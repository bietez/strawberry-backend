// controllers/ifoodAuthController.js
const axios = require('axios');
const qs = require('querystring');
const IfoodToken = require('../models/IfoodToken');
require('dotenv').config();

const IFOOD_CLIENT_ID = process.env.IFOOD_CLIENT_ID;
const IFOOD_CLIENT_SECRET = process.env.IFOOD_CLIENT_SECRET;
const IFOOD_USER_CODE_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/userCode';
const IFOOD_TOKEN_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';

// Iniciar o processo de autenticação
exports.startAuth = async (req, res) => {
  try {
    const response = await axios.post(
      IFOOD_USER_CODE_URL,
      qs.stringify({ clientId: IFOOD_CLIENT_ID }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const {
      userCode,
      authorizationCodeVerifier,
      verificationUrlComplete
    } = response.data;

    // Salvar temporariamente no session ou retornar ao frontend
    // Uma abordagem simples é retornar para o frontend e o frontend guardar em estado local.
    req.session.authorizationCodeVerifier = authorizationCodeVerifier;

    return res.json({
      userCode,
      verificationUrlComplete
    });
  } catch (error) {
    console.error('Erro ao iniciar autenticação com iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao iniciar autenticação com iFood.' });
  }
};

// Concluir autenticação com o código de autorização
exports.completeAuth = async (req, res) => {
  try {
    const { authorizationCode } = req.body;
    const authorizationCodeVerifier = req.session.authorizationCodeVerifier;
    if (!authorizationCodeVerifier) {
      return res.status(400).json({ message: 'Faltando authorizationCodeVerifier na sessão.' });
    }

    const payload = {
      grantType: 'authorization_code',
      clientId: IFOOD_CLIENT_ID,
      clientSecret: IFOOD_CLIENT_SECRET,
      authorizationCode: authorizationCode,
      authorizationCodeVerifier: authorizationCodeVerifier
    };

    const response = await axios.post(
      IFOOD_TOKEN_URL,
      qs.stringify(payload),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { accessToken, refreshToken, expiresIn } = response.data;

    // Salvar no banco de dados
    await IfoodToken.deleteMany({});
    const token = new IfoodToken({ accessToken, refreshToken, expiresIn });
    await token.save();

    // Limpar a session
    req.session.authorizationCodeVerifier = null;

    return res.json({ message: 'Autenticação concluída com sucesso!', accessToken });
  } catch (error) {
    console.error('Erro ao concluir autenticação com iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao concluir autenticação com o iFood.' });
  }
};

// Obter status da autenticação (se há token válido)
exports.getStatus = async (req, res) => {
  const token = await IfoodToken.findOne({});
  if (!token) {
    return res.json({ authenticated: false, message: 'Nenhum token armazenado' });
  }

  const expired = token.isExpired();
  return res.json({ authenticated: !expired, expired });
};

// Função para refresh do token (se houver refreshToken)
exports.refreshToken = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || !token.refreshToken) {
      return res.status(400).json({ message: 'Não há refreshToken para renovar o token.' });
    }

    const payload = {
      grantType: 'refresh_token',
      clientId: IFOOD_CLIENT_ID,
      clientSecret: IFOOD_CLIENT_SECRET,
      refreshToken: token.refreshToken
    };

    const response = await axios.post(
      IFOOD_TOKEN_URL,
      qs.stringify(payload),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { accessToken, refreshToken, expiresIn } = response.data;

    token.accessToken = accessToken;
    if (refreshToken) token.refreshToken = refreshToken;
    token.expiresIn = expiresIn;
    token.createdAt = new Date();

    await token.save();

    return res.json({ message: 'Token renovado com sucesso!', accessToken });
  } catch (error) {
    console.error('Erro ao renovar token do iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao renovar token do iFood.' });
  }
};

// Exemplo de rota para testar integração (obter lista de pedidos)
exports.getOrders = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || token.isExpired()) {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }

    // Exemplo de chamada a algum endpoint do iFood (alterar para endpoint real de pedidos)
    // Documentação do iFood: precisará definir endpoint correto.
    const ordersUrl = 'https://merchant-api.ifood.com.br/order/v1.0/orders';
    const response = await axios.get(ordersUrl, {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`
      }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Erro ao obter pedidos do iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao obter pedidos do iFood.' });
  }
};
