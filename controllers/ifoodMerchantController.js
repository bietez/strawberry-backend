// controllers/ifoodMerchantController.js

const axios = require('axios');
const IfoodToken = require('../models/IfoodToken');

const BASE_URL = 'https://merchant-api.ifood.com.br/merchant/v1.0';

// -----------------------------------------
// Listar merchants
// -----------------------------------------
exports.listMerchants = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || token.isExpired()) {
      return res.status(401).json({ message: 'Token inválido ou expirado. Faça login novamente.' });
    }

    const { page = 1, size = 100 } = req.query;

    const response = await axios.get(`${BASE_URL}/merchants`, {
      headers: {
        Authorization: `Bearer ${token.ifoodAccessToken}`,
      },
      params: { page, size },
    });

    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar merchants.', details: error.response?.data || error.message });
  }
};

// -----------------------------------------
// Obter detalhes de um merchant
// -----------------------------------------
exports.getMerchantDetails = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || token.isExpired()) {
      return res.status(401).json({ message: 'Token inválido ou expirado. Faça login novamente.' });
    }

    const { merchantId } = req.params;

    const response = await axios.get(`${BASE_URL}/merchants/${merchantId}`, {
      headers: {
        Authorization: `Bearer ${token.ifoodAccessToken}`,
      },
    });

    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao obter detalhes do merchant.', details: error.response?.data || error.message });
  }
};

// -----------------------------------------
// Obter status de um merchant
// -----------------------------------------
exports.getMerchantStatus = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || token.isExpired()) {
      return res.status(401).json({ message: 'Token inválido ou expirado. Faça login novamente.' });
    }

    const { merchantId } = req.params;

    const response = await axios.get(`${BASE_URL}/merchants/${merchantId}/status`, {
      headers: {
        Authorization: `Bearer ${token.ifoodAccessToken}`,
      },
    });

    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao obter status do merchant.', details: error.response?.data || error.message });
  }
};

exports.createOpeningHours = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || token.isExpired()) {
      return res.status(401).json({ message: 'Token inválido ou expirado. Faça login novamente.' });
    }

    const { merchantId } = req.params;
    const openingHours = req.body;

    const response = await axios.put(
      `${BASE_URL}/merchants/${merchantId}/opening-hours`,
      openingHours,
      {
        headers: {
          Authorization: `Bearer ${token.ifoodAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(201).json(response.data);
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao criar horários de funcionamento.',
      details: error.response?.data || error.message,
    });
  }
};

// ------------------------------------------
// Listar hora de funcionamento
// ------------------------------------------
// ifoodMerchantController.js

// ----------------------------------------------------------
//  FUNÇÃO: getOpeningHours
//  Faz chamada GET para /merchants/{merchantId}/opening-hours
// ----------------------------------------------------------
exports.getOpeningHours = async (req, res) => {
  try {
    // 1) Busca o token no banco de dados (ex.: MongoDB)
    const token = await IfoodToken.findOne({});

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'Unauthorized',
          name: 'Token iFood não encontrado no banco de dados.',
        },
      });
    }

    if (token.isExpired()) {
      return res.status(401).json({
        error: {
          code: 'Unauthorized',
          name: 'Token iFood expirado. Faça login novamente.',
        },
      });
    }

    // 2) Pega o merchantId da URL (req.params)
    const { merchantId } = req.params;

    // 3) Faz a requisição GET ao endpoint de Opening Hours do iFood
    const url = `${BASE_URL}/merchants/${merchantId}/opening-hours`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token.ifoodAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // 4) Verifica se há a propriedade 'shifts' na resposta
    if (response.data && Array.isArray(response.data.shifts) && response.data.shifts.length > 0) {
      const { shifts } = response.data;

      return res.status(200).json(shifts); // Retorna diretamente o array de shifts
    } else {
      // Retorna um array vazio para o frontend tratar
      return res.status(200).json([]);
    }
  } catch (error) {
    // Log detalhado do erro
    if (error.response) {
      return res.status(error.response.status).json({
        error: {
          code: error.response.status === 404 ? 'NotFound' : 'InternalServerError',
          name:
            error.response.data?.error?.name ||
            'Erro inesperado da API do iFood.',
        },
      });
    } else if (error.request) {
      // A requisição foi feita, mas nenhuma resposta foi recebida
      return res.status(500).json({
        error: {
          code: 'InternalServerError',
          name: 'Nenhuma resposta recebida da API do iFood.',
        },
      });
    } else {
      // Algo aconteceu ao configurar a requisição
      return res.status(500).json({
        error: {
          code: 'InternalServerError',
          name: `Erro interno: ${error.message}`,
        },
      });
    }
  }
};

exports.getMerchantStatus = async (req, res) => {
  const { merchantId } = req.params;

  try {
    // Busca o token no banco de dados
    const token = await IfoodToken.findOne({});

    if (!token || token.isExpired()) {
      return res.status(401).json({ message: 'Token iFood inválido ou expirado.' });
    }

    // Monta a URL do endpoint de status
    const url = `${BASE_URL}/merchants/${merchantId}/status`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token.ifoodAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao buscar status do merchant.',
      details: error.response?.data || error.message,
    });
  }
};

/**
 * Função: getMerchantStatusByOperation
 * Descrição: Obtém o status de uma operação específica do merchant via API do iFood.
 */
exports.getMerchantStatusByOperation = async (req, res) => {
  const { merchantId, operation } = req.params;

  try {
    // Busca o token no banco de dados
    const token = await IfoodToken.findOne({});
    if (!token || token.isExpired()) {
      return res.status(401).json({ message: 'Token iFood inválido ou expirado.' });
    }

    // Monta a URL do endpoint de status por operação
    const url = `${BASE_URL}/merchants/${merchantId}/status/${operation}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token.ifoodAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({ message: `Erro ao buscar status da operação ${operation}.`, details: error.response?.data || error.message });
  }
};

/**
 * Função: listInterruptions
 * Descrição: Lista todas as interrupções de um merchant.
 */
exports.listInterruptions = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || token.isExpired()) {
      return res.status(401).json({ message: 'Token inválido ou expirado. Faça login novamente.' });
    }

    const { merchantId } = req.params;

    const response = await axios.get(`${BASE_URL}/merchants/${merchantId}/interruptions`, {
      headers: {
        Authorization: `Bearer ${token.ifoodAccessToken}`,
      },
    });

    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao listar interrupções.',
      details: error.response?.data || error.message,
    });
  }
};

/**
 * Função: createInterruption
 * Descrição: Cria uma interrupção para um merchant.
 */
exports.createInterruption = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || token.isExpired()) {
      return res.status(401).json({ message: 'Token inválido ou expirado. Faça login novamente.' });
    }

    const { merchantId } = req.params;
    const interruption = req.body;

    const response = await axios.post(
      `${BASE_URL}/merchants/${merchantId}/interruptions`,
      interruption,
      {
        headers: {
          Authorization: `Bearer ${token.ifoodAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(201).json(response.data);
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao criar interrupção.',
      details: error.response?.data || error.message,
    });
  }
};

/**
 * Função: deleteInterruption
 * Descrição: Deleta uma interrupção de um merchant.
 */
exports.deleteInterruption = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || token.isExpired()) {
      return res.status(401).json({ message: 'Token inválido ou expirado. Faça login novamente.' });
    }

    const { merchantId, interruptionId } = req.params;

    await axios.delete(`${BASE_URL}/merchants/${merchantId}/interruptions/${interruptionId}`, {
      headers: {
        Authorization: `Bearer ${token.ifoodAccessToken}`,
      },
    });

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao deletar interrupção.',
      details: error.response?.data || error.message,
    });
  }
};
