// services/ifoodKeepAliveService.js

const axios = require('axios');
const IfoodToken = require('../models/IfoodToken');
require('dotenv').config();

// Endpoints
const BASE_URL_MERCHANT = 'https://merchant-api.ifood.com.br/merchant/v1.0';
const BASE_URL_ORDER = 'https://merchant-api.ifood.com.br/order/v1.0';

let pollingIntervalId = null;

/**
 * Obtém um token válido. Se expirado, lança um erro.
 */
async function getValidToken() {
  const token = await IfoodToken.findOne({});
  if (!token) {
    throw new Error('Nenhum token encontrado. Faça a autenticação novamente.');
  }
  if (token.isExpired()) {
    throw new Error('Token iFood expirado. Faça a renovação do token.');
  }
  return token.ifoodAccessToken;
}

/**
 * Remove TODAS as interrupções para deixar a loja disponível.
 */
async function removeAllInterruptions(merchantId, accessToken) {
  try {
    // Pegar lista de interrupções
    const listUrl = `${BASE_URL_MERCHANT}/merchants/${merchantId}/interruptions`;
    const { data: interruptions } = await axios.get(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Deletar cada interrupção
    if (interruptions && interruptions.length > 0) {
      for (const it of interruptions) {
        const delUrl = `${BASE_URL_MERCHANT}/merchants/${merchantId}/interruptions/${it.id}`;
        await axios.delete(delUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log(`Interrupção ${it.id} removida com sucesso!`);
      }
    } else {
      console.log('Nenhuma interrupção ativa encontrada.');
    }
  } catch (error) {
    console.error('Erro ao remover interrupções:', error.response?.data || error.message);
    throw error;
  }
}


/**
 * Faz polling de eventos e envia ACK, rodando em loop (setInterval).
 */
// Exemplo simplificado
async function startEventsPolling() {
  if (pollingIntervalId) {
    console.log('Polling de eventos já está ativo.');
    return;
  }

  const INTERVAL_MS = 30000; // 30s
  pollingIntervalId = setInterval(async () => {
    try {
      const accessToken = await getValidToken();
      
      const eventsUrl = `${BASE_URL_ORDER}/events:polling`;
      // Aqui você pode passar parâmetros de filtragem:
      const eventsResponse = await axios.get(eventsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // Caso precise filtrar por merchant(s):
          // 'x-polling-merchants': 'merchantId1,merchantId2,...'
        },
        params: {
          // Exemplo: filtrar por categoria: FOOD, GROCERY
          // categories: 'FOOD,GROCERY',
          // groups: 'ORDER_STATUS',
          // types: 'PLC,CFM'
        },
      });

      // Se não tiver eventos, geralmente vem 204 (No Content), ou data=[]
      const events = eventsResponse.data;
      if (!Array.isArray(events) || events.length === 0) {
        return;
      }

      console.log('Eventos recebidos:', events);

      // Ack de cada evento
      const ackUrl = `${BASE_URL_ORDER}/events/ack`;
      const eventIds = events.map((e) => e.id);
      await axios.post(ackUrl, {
        events: eventIds.map((id) => ({ id })),
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`ACK enviado para ${eventIds.length} evento(s).`);
    } catch (error) {
      console.error('Erro no polling de eventos:', error.response?.data || error.message);
    }
  }, INTERVAL_MS);

  console.log(`Polling de eventos iniciado, intervalo = ${INTERVAL_MS / 1000}s`);
}


/**
 * Parar o polling (caso queira desligar)
 */
function stopEventsPolling() {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
    console.log('Polling de eventos interrompido.');
  }
}

/**
 * "Confirma ao iFood" que estamos funcionando:
 * 1) Pegar merchantId
 * 2) Remover interrupções (fica "aberto")
 * 3) (Opcional) Definir horários
 * 4) Iniciar polling de eventos
 */
async function keepStoreAlive(merchantId) {
  try {
    console.log(`keepStoreAlive() chamado para merchantId=${merchantId}`);
    const accessToken = await getValidToken();

    // Remover interrupções
    await removeAllInterruptions(merchantId, accessToken);

    // (Opcional) Definir horários de funcionamento
    // await setBasicOpeningHours(merchantId, accessToken);

    // Iniciar polling de eventos
    startEventsPolling();
  } catch (error) {
    console.error('Erro em keepStoreAlive:', error.message);
  }
}

module.exports = {
  keepStoreAlive,
  startEventsPolling,
  stopEventsPolling,
};
