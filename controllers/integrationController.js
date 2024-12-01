// controllers/integrationController.js
const axios = require('axios');
const config = require('../config');
const Order = require('../models/Order');

exports.fetchDeliveryOrders = async (req, res) => {
  try {
    // Exemplo: Buscar pedidos da API do iFood
    const response = await axios.get('https://api.ifood.com.br/v1/orders', {
      headers: {
        Authorization: `Bearer ${config.deliveryPlatformApiKey}`,
      },
    });

    const externalOrders = response.data;

    // Processar e salvar pedidos no sistema
    for (const extOrder of externalOrders) {
      // Mapear pedido externo para o formato do seu sistema
      // Implementar lógica de mapeamento aqui

      // Salvar o pedido no banco de dados
      const order = new Order({
        // Mapear campos apropriadamente
      });
      await order.save();

      // Emite evento
      global.io.emit('novo_pedido', order);
    }

    res.json({ message: 'Pedidos de entrega importados e processados' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter pedidos de entrega', error: error.message });
  }
};
