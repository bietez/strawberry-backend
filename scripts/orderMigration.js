const mongoose = require('mongoose');
const Order = require('../models/Order');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Conectado ao MongoDB');

    // Encontra todos os pedidos que ainda utilizam 'receita' nos itens
    const orders = await Order.find({ 'itens.receita': { $exists: true } });
    console.log(`Encontrados ${orders.length} pedidos com itens.receita`);

    for (const order of orders) {
      const updatedItens = order.itens.map(item => {
        if (item.receita) {
          return { product: item.receita, quantidade: item.quantidade, tipo: item.tipo || 'prato principal' };
        }
        return item;
      });
      order.itens = updatedItens;
      await order.save();
      console.log(`Pedido ${order._id} atualizado`);
    }

    console.log('Migração concluída');
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('Erro na migração:', error);
    mongoose.disconnect();
  });
