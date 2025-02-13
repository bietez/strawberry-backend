// controllers/ifoodOrdersController.js

const axios = require('axios');
const IfoodToken = require('../models/IfoodToken');

// Base URL para Orders
const BASE_URL = 'https://merchant-api.ifood.com.br/order/v1.0';

// ----------------------------------------------------------------------------
// Obter token
async function getValidToken() {
  let token = await IfoodToken.findOne({});
  if (!token) {
    throw new Error('Nenhum token encontrado. Faça a autenticação novamente.');
  }

  if (token.isExpired()) {
    console.log('Token expirado, tentando refresh automático...');
    try {
      // Chame seu serviço/método que faz refresh
      // Exemplo: ifoodAuthController.refreshTokenService() (você precisa ter algo do tipo)
      const newTokenData = await someRefreshTokenLogic(token.ifoodRefreshToken);
      
      token.ifoodAccessToken = newTokenData.access_token;
      token.ifoodRefreshToken = newTokenData.refresh_token;
      token.expiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000));
      await token.save();
    } catch (err) {
      throw new Error('Token expirado e falha ao renovar: ' + err.message);
    }
  }

  return token.ifoodAccessToken;
}

// ----------------------------------------------------------------------------
// 1) GET /orders/:id -> Detalhes do pedido
exports.getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getValidToken();

    const response = await axios.get(`${BASE_URL}/orders/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Erro em getOrderDetails:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao obter detalhes do pedido.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// 2) GET /orders/:id/virtual-bag -> Detalhes de pedido de groceries
exports.getOrderVirtualBag = async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getValidToken();

    const response = await axios.get(`${BASE_URL}/orders/${id}/virtual-bag`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Erro em getOrderVirtualBag:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao obter virtual bag do pedido.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// 3) POST /orders/:id/confirm -> Confirmar pedido
exports.confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getValidToken();

    const response = await axios.post(
      `${BASE_URL}/orders/${id}/confirm`,
      {}, // corpo vazio
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // 202 = Accepted
    return res.status(response.status).json({
      message: 'Pedido confirmado (confirmOrder).',
      ifoodResponse: response.data,
    });
  } catch (error) {
    console.error('Erro em confirmOrder:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao confirmar pedido.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// 4) POST /orders/:id/startPreparation -> Iniciar preparo
exports.startPreparation = async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getValidToken();

    const response = await axios.post(
      `${BASE_URL}/orders/${id}/startPreparation`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.status(response.status).json({
      message: 'Início de preparo (startPreparation).',
      ifoodResponse: response.data,
    });
  } catch (error) {
    console.error('Erro em startPreparation:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao iniciar preparo do pedido.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// 5) POST /orders/:id/readyToPickup -> Pedido pronto para retirar
exports.readyToPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getValidToken();

    const response = await axios.post(
      `${BASE_URL}/orders/${id}/readyToPickup`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.status(response.status).json({
      message: 'Pedido marcado como pronto para pickup.',
      ifoodResponse: response.data,
    });
  } catch (error) {
    console.error('Erro em readyToPickup:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao marcar pedido como pronto para retirada.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// 6) POST /orders/:id/dispatch -> Pedido despachado
exports.dispatchOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getValidToken();

    const response = await axios.post(
      `${BASE_URL}/orders/${id}/dispatch`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.status(response.status).json({
      message: 'Pedido despachado (dispatchOrder).',
      ifoodResponse: response.data,
    });
  } catch (error) {
    console.error('Erro em dispatchOrder:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao despachar pedido.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// 7) GET /orders/:id/cancellationReasons -> Motivos de cancelamento
exports.getCancellationReasons = async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getValidToken();

    const response = await axios.get(`${BASE_URL}/orders/${id}/cancellationReasons`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // iFood pode retornar array (200) ou 204 (sem motivos)
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Erro em getCancellationReasons:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao obter motivos de cancelamento do pedido.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// 8) POST /orders/:id/requestCancellation -> Solicitar cancelamento
exports.requestCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, cancellationCode } = req.body; // { reason: string, cancellationCode: string }
    const accessToken = await getValidToken();

    const response = await axios.post(
      `${BASE_URL}/orders/${id}/requestCancellation`,
      { reason, cancellationCode },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.status(response.status).json({
      message: 'Pedido enviado para cancelamento.',
      ifoodResponse: response.data,
    });
  } catch (error) {
    console.error('Erro em requestCancellation:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao solicitar cancelamento do pedido.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// 9) GET /orders/:id/tracking -> Acompanhar entrega (tracking)
exports.trackOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getValidToken();

    const response = await axios.get(`${BASE_URL}/orders/${id}/tracking`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Erro em trackOrder:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao obter tracking do pedido.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// 10) POST /orders/:id/requestDriver -> Solicitar motorista
exports.requestDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getValidToken();

    const response = await axios.post(
      `${BASE_URL}/orders/${id}/requestDriver`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.status(response.status).json({
      message: 'Pedido de driver (requestDriver) enviado.',
      ifoodResponse: response.data,
    });
  } catch (error) {
    console.error('Erro em requestDriver:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao solicitar motorista (driver).',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// 11) POST /orders/:id/cancelRequestDriver -> Cancelar solicitação de driver
exports.cancelDriverRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getValidToken();

    const response = await axios.post(
      `${BASE_URL}/orders/${id}/cancelRequestDriver`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.status(response.status).json({
      message: 'Solicitação de motorista cancelada.',
      ifoodResponse: response.data,
    });
  } catch (error) {
    console.error('Erro em cancelDriverRequest:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao cancelar solicitação de motorista.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// Handshake Platform
// 12) POST /disputes/:disputeId/accept -> Aceitar Disputa
exports.acceptDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const accessToken = await getValidToken();

    const response = await axios.post(
      `https://merchant-api.ifood.com.br/order/v1.0/disputes/${disputeId}/accept`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // 201 Created
    return res.status(response.status).json({
      message: 'Disputa aceita com sucesso.',
      ifoodResponse: response.data,
    });
  } catch (error) {
    console.error('Erro em acceptDispute:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao aceitar disputa.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// 13) POST /disputes/:disputeId/reject -> Rejeitar Disputa
exports.rejectDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { reason } = req.body; // { reason: 'string' }
    const accessToken = await getValidToken();

    const response = await axios.post(
      `https://merchant-api.ifood.com.br/order/v1.0/disputes/${disputeId}/reject`,
      { reason },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // 201 Created
    return res.status(response.status).json({
      message: 'Disputa rejeitada.',
      ifoodResponse: response.data,
    });
  } catch (error) {
    console.error('Erro em rejectDispute:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao rejeitar disputa.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// 14) POST /disputes/:disputeId/alternatives/:alternativeId -> Enviar proposta
exports.sendDisputeProposal = async (req, res) => {
  try {
    const { disputeId, alternativeId } = req.params;
    const payload = req.body; // { type, metadata, etc. }
    const accessToken = await getValidToken();

    const response = await axios.post(
      `https://merchant-api.ifood.com.br/order/v1.0/disputes/${disputeId}/alternatives/${alternativeId}`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.status(response.status).json({
      message: 'Proposta enviada na disputa.',
      ifoodResponse: response.data,
    });
  } catch (error) {
    console.error('Erro em sendDisputeProposal:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Erro ao enviar proposta na disputa.',
      details: error.response?.data || error.message,
    });
  }
};

// ----------------------------------------------------------------------------
// (Você pode adicionar aqui "Code Validation" e "Logistics" se necessário.)
// ----------------------------------------------------------------------------
