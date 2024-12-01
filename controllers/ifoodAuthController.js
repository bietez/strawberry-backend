// controllers/ifoodAuthController.js
const axios = require('axios');
const qs = require('querystring');
const IfoodToken = require('../models/IfoodToken');
require('dotenv').config();

const IFOOD_CLIENT_ID = process.env.IFOOD_CLIENT_ID;
const IFOOD_CLIENT_SECRET = process.env.IFOOD_CLIENT_SECRET;
const IFOOD_TOKEN_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';
const IFOOD_USER_CODE_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/userCode';

// Função para iniciar o processo de autenticação
exports.startAuth = async (req, res) => {
  try {
    const response = await axios.post(IFOOD_USER_CODE_URL, qs.stringify({
      clientId: IFOOD_CLIENT_ID,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { userCode, authorizationCodeVerifier, verificationUrlComplete } = response.data;

    // Salvar o authorizationCodeVerifier na sessão ou em um armazenamento temporário
    req.session.authorizationCodeVerifier = authorizationCodeVerifier;

    res.json({
      userCode,
      verificationUrlComplete,
    });
  } catch (error) {
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
};

// Função para concluir a autenticação e obter o token de acesso
exports.completeAuth = async (req, res) => {
  const { authorizationCode } = req.body;
  const authorizationCodeVerifier = req.session.authorizationCodeVerifier;

  if (!authorizationCode || !authorizationCodeVerifier) {
    return res.status(400).json({ error: 'Código de autorização e verificador são necessários.' });
  }

  try {
    const response = await axios.post(IFOOD_TOKEN_URL, qs.stringify({
      grantType: 'authorization_code',
      clientId: IFOOD_CLIENT_ID,
      clientSecret: IFOOD_CLIENT_SECRET,
      authorizationCode: authorizationCode,
      authorizationCodeVerifier: authorizationCodeVerifier,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { accessToken, refreshToken, expiresIn } = response.data;

    // Salvar o token no banco de dados
    const tokenData = new IfoodToken({
      accessToken,
      refreshToken,
      expiresIn,
    });

    await tokenData.save();

    // Limpar o authorizationCodeVerifier da sessão
    req.session.authorizationCodeVerifier = null;

    res.json({ message: 'Token de acesso salvo com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
};
