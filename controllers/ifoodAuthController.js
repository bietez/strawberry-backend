// controllers/ifoodAuthController.js

const axios = require('axios');
const qs = require('querystring');
const IfoodToken = require('../models/IfoodToken');
const IfoodAuthState = require('../models/IfoodAuthState'); // ou caminho relativo correto
require('dotenv').config();

// Variáveis de ambiente
const IFOOD_CLIENT_ID = process.env.IFOOD_CLIENT_ID;
const IFOOD_CLIENT_SECRET = process.env.IFOOD_CLIENT_SECRET;
const IFOOD_USER_CODE_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/userCode';
const IFOOD_TOKEN_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';

// --------------------------------------------
// Controle de Polling
let pollingIntervalId = null;  // <--- Declare aqui
let POLLING_INTERVAL_MS = 30000;

// Base URLs para requisições
const BASE_URL_ORDER = 'https://merchant-api.ifood.com.br/order/v1.0';

// -------------------------------------------------------------
// Se preferir, use um getValidToken() para sempre buscar token
// -------------------------------------------------------------
async function getValidToken() {
  const token = await IfoodToken.findOne({});
  if (!token) {
    throw new Error('Nenhum token do iFood no banco. Faça a autenticação primeiro.');
  }
  if (token.isExpired()) {
    throw new Error('Token do iFood expirado. Faça refresh ou reautenticação.');
  }
  return token.ifoodAccessToken;
}

// -------------------------------------------------------------
// startEventsPolling: inicia setInterval, chamando GET /events
// -------------------------------------------------------------
async function startEventsPolling({ categories, groups, types } = {}) {
  // Evita criar múltiplos intervals
  if (pollingIntervalId) {
    console.log('Polling de eventos já está ativo.');
    return;
  }

  console.log('Iniciando polling de eventos iFood...');

  pollingIntervalId = setInterval(async () => {
    try {
      const accessToken = await getValidToken();

      // Montar parâmetros de filtragem
      const params = {};
      if (categories) params.categories = categories;
      if (groups) params.groups = groups;
      if (types) params.types = types;

      // Chamar endpoint /events:polling
      const eventsUrl = `${BASE_URL_ORDER}/events:polling`;
      const response = await axios.get(eventsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params
      });

      // Se não tiver eventos, a API costuma retornar 204 (No Content) ou array vazio
      const events = response.data;
      if (!Array.isArray(events) || events.length === 0) {
        // console.log('Nenhum evento recebido neste ciclo.');
        return;
      }

      console.log('Eventos recebidos:', events);

      // Dar ACK nos eventos
      const ackUrl = `${BASE_URL_ORDER}/events/ack`;
      const eventIds = events.map(ev => ({ id: ev.id }));
      await axios.post(ackUrl, { events: eventIds }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`ACK enviado para ${eventIds.length} evento(s).`);
    } catch (error) {
      console.error('Erro no polling de eventos iFood:', error.response?.data || error.message);
    }
  }, POLLING_INTERVAL_MS);

  console.log(`Polling de eventos iniciado. Intervalo: ${POLLING_INTERVAL_MS}ms`);
}

// -------------------------------------------------------------
// stopEventsPolling: parar setInterval
// -------------------------------------------------------------
function stopEventsPolling() {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
    console.log('Polling de eventos iFood interrompido.');
  } else {
    console.log('Polling já estava inativo.');
  }
}


// ifoodAuthController.js
exports.startPolling = async (req, res) => {
  try {
    const { categories, groups, types } = req.body;
    await startEventsPolling({ categories, groups, types });
    return res.status(200).json({ message: 'Polling started' });
  } catch (error) {
    console.error('Erro ao iniciar polling:', error.message);
    return res.status(500).json({ error: 'Failed to start polling', details: error.message });
  }
};


// Parar o polling
exports.stopPolling = async (req, res) => {
  try {
    stopEventsPolling();
    return res.json({ message: 'Polling parado com sucesso.' });
  } catch (error) {
    console.error('Erro ao parar polling:', error.message);
    return res.status(500).json({ message: 'Erro ao parar polling.', details: error.message });
  }
};

// Iniciar o processo de autenticação
exports.startAuth = async (req, res) => {
  try {
    // 1. Obter ifoodUserCode e ifoodAuthorizationCodeVerifier do iFood
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

    // 2. Salvar esse "estado" no banco (IfoodAuthState)
    const authState = new IfoodAuthState({
      // se tiver userId no token JWT, você pode armazenar aqui:
      // userId: req.user.id, 
      ifoodUserCode: userCode,
      ifoodAuthorizationCodeVerifier: authorizationCodeVerifier,
      verificationUrlComplete,
    });
    await authState.save();

    // 3. Retornar para o front-end
    //    Retornamos o ID para o front-end poder usar na etapa "completeAuth"
    return res.json({
      message: 'Processo de autenticação iniciado',
      ifoodAuthStateId: authState._id,       // importante
      ifoodUserCode: userCode,
      verificationUrlComplete
    });
  } catch (error) {
    console.error('Erro ao iniciar autenticação com iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao iniciar autenticação com iFood.' });
  }
};

exports.completeAuth = async (req, res) => {
  try {
    const { ifoodAuthStateId, authorizationCode } = req.body;
    if (!ifoodAuthStateId || !authorizationCode) {
      return res.status(400).json({ message: 'ifoodAuthStateId e authorizationCode são obrigatórios.' });
    }

    // 1. Buscar o estado no banco
    const authState = await IfoodAuthState.findById(ifoodAuthStateId);
    if (!authState) {
      return res.status(400).json({ message: 'Estado de autenticação não encontrado ou expirado.' });
    }

    // 2. Montar payload
    const payload = {
      grantType: 'authorization_code',
      clientId: IFOOD_CLIENT_ID,
      clientSecret: IFOOD_CLIENT_SECRET,
      authorizationCode,
      authorizationCodeVerifier: authState.ifoodAuthorizationCodeVerifier,
    };

    // 3. Chamar o endpoint do iFood para obter tokens
    const response = await axios.post(
      IFOOD_TOKEN_URL,
      qs.stringify(payload),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { accessToken: ifoodAccessToken, refreshToken: ifoodRefreshToken, expiresIn } = response.data;

    // 4. Salvar/Atualizar token no banco
    //    (Opcionalmente, você pode guardar por userId, se houver multiusuário)
    await IfoodToken.deleteMany({}); // se quiser sempre limpar antes
    const token = new IfoodToken({
      ifoodAccessToken,
      ifoodRefreshToken,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      createdAt: new Date()
    });
    await token.save();

    // 5. Remover authState (opcional) ou mantê-lo para logs
    await IfoodAuthState.findByIdAndDelete(ifoodAuthStateId);

    return res.json({ message: 'Autenticação concluída com sucesso!', ifoodAccessToken });
  } catch (error) {
    console.error('Erro ao concluir autenticação com iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao concluir a autenticação com o iFood.' });
  }
};

// Obter status da autenticação (se há token válido)
exports.getStatus = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token) {
      return res.json({ authenticated: false, expired: false, message: 'Nenhum token armazenado' });
    }
    const expired = token.isExpired();
    return res.json({
      authenticated: !expired,
      expired,
      message: expired ? 'Token expirado' : 'Token válido'
    });
  } catch (error) {
    console.error('Erro ao obter status iFood:', error.message);
    return res.status(500).json({ message: 'Erro ao obter status da autenticação iFood.' });
  }
};

// Função para refresh do token (se houver ifoodRefreshToken)
exports.refreshToken = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || !token.ifoodRefreshToken) {
      return res.status(400).json({ message: 'Não há ifoodRefreshToken salvo para renovar o token.' });
    }

    const payload = {
      grantType: 'refresh_token',
      clientId: IFOOD_CLIENT_ID,
      clientSecret: IFOOD_CLIENT_SECRET,
      refreshToken: token.ifoodRefreshToken
    };

    const response = await axios.post(
      IFOOD_TOKEN_URL,
      qs.stringify(payload),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { accessToken: newIfoodAccessToken, refreshToken: newIfoodRefreshToken, expiresIn } = response.data;

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    token.ifoodAccessToken = newIfoodAccessToken;
    if (newIfoodRefreshToken) token.ifoodRefreshToken = newIfoodRefreshToken;
    token.expiresAt = expiresAt;
    token.createdAt = new Date();

    await token.save();

    return res.json({
      message: 'Token renovado com sucesso!',
      ifoodAccessToken: newIfoodAccessToken
    });
  } catch (error) {
    console.error('Erro ao renovar token do iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao renovar token do iFood.' });
  }
};

// Exemplo de rota para testar integração (obter lista de pedidos)
exports.getOrders = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token) {
      return res.status(401).json({ message: 'Nenhum token armazenado.' });
    }
    if (token.isExpired()) {
      return res.status(401).json({ message: 'Token iFood expirado, faça refresh.' });
    }

    // Exemplo de endpoint real. Ajuste conforme docs iFood:
    // https://developer.ifood.com.br/ -> ex: GET /order/v1.0/orders
    const ordersUrl = 'https://merchant-api.ifood.com.br/order/v1.0/orders';
    const response = await axios.get(ordersUrl, {
      headers: {
        Authorization: `Bearer ${token.ifoodAccessToken}`
      }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Erro ao obter pedidos do iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao obter pedidos do iFood.' });
  }
};

// Exemplo de endpoint do iFood para polling:
const IFOOD_EVENTS_POLLING_URL = 'https://merchant-api.ifood.com.br/order/v1.0/events:polling';
// E para ack:
const IFOOD_EVENTS_ACK_URL = 'https://merchant-api.ifood.com.br/order/v1.0/events/ack';

// ---------------------------------
// (6) Buscar novos eventos (polling)
// GET /ifood/events
// Query params opcionais: types, groups, categories
// Header opcional: x-polling-merchants
// ---------------------------------
exports.getEvents = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token) {
      return res.status(401).json({ message: 'Nenhum token do iFood armazenado.' });
    }
    if (token.isExpired()) {
      return res.status(401).json({ message: 'Token do iFood expirado. Faça refresh.' });
    }

    const accessToken = token.ifoodAccessToken;

    // Filtragem opcional
    const { types, groups, categories } = req.query;
    const params = {};
    if (types) params.types = types;
    if (groups) params.groups = groups;
    if (categories) params.categories = categories;

    const eventsUrl = `${BASE_URL_ORDER}/events:polling`;
    const response = await axios.get(eventsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Erro ao obter eventos:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao obter eventos.', details: error.message });
  }
};

// ---------------------------------
// (7) Dar ACK em eventos
// POST /ifood/events/ack
// Body: { eventIds: ["id1", "id2", ...] }
// ---------------------------------
exports.ackEvents = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token) {
      return res.status(401).json({ message: 'Nenhum token do iFood armazenado.' });
    }
    if (token.isExpired()) {
      return res.status(401).json({ message: 'Token do iFood expirado. Faça refresh.' });
    }

    const accessToken = token.ifoodAccessToken;

    const { eventIds } = req.body; // { eventIds: ["id1","id2"] }
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ message: 'Informe um array eventIds.' });
    }

    const ackUrl = `${BASE_URL_ORDER}/events/ack`;
    const ackBody = { events: eventIds.map((id) => ({ id })) };

    await axios.post(ackUrl, ackBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return res.json({ message: 'ACK enviado!', eventIds });
  } catch (error) {
    console.error('Erro ao dar ACK em eventos:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao dar ACK em eventos.',
      details: error.response?.data || error.message
    });
  }
};
