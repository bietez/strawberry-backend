// controllers/orderController.js
const Order = require('../models/Order');
const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const Table = require('../models/Table');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const printUtil = require('../utils/printUtil');

exports.createOrder = async (req, res) => {
  try {
    const { mesaId, assentos, itens, clienteId, garcomId, tipoPedido, numeroAssento, nomeCliente, enderecoEntrega } = req.body;

    let total = 0;

    // Calcula o total do pedido e verifica a existência das receitas
    for (const item of itens) {
      const recipe = await Recipe.findById(item.receita);
      if (!recipe) {
        return res.status(404).json({ message: `Receita com ID ${item.receita} não encontrada` });
      }
      total += recipe.precoVenda * item.quantidade;
    }

    const orderData = {
      mesa: mesaId,
      assentos,
      itens,
      cliente: clienteId,
      garcom: garcomId,
      total,
      status: 'Pendente',
    };

    // Ajustes específicos para pedidos locais ou de entrega
    if (tipoPedido === 'local') {
      orderData.tipoPedido = 'local';
      orderData.numeroAssento = numeroAssento;

      // Atualiza status da mesa para 'ocupada'
      await Table.findByIdAndUpdate(mesaId, { status: 'ocupada' });
    } else if (tipoPedido === 'entrega') {
      orderData.tipoPedido = 'entrega';
      orderData.nomeCliente = nomeCliente;
      orderData.enderecoEntrega = enderecoEntrega;
    }

    const order = new Order(orderData);
    await order.save();

    // Atualizar estoque de ingredientes
    for (const item of itens) {
      const recipe = await Recipe.findById(item.receita).populate('ingredientes.ingrediente');
      for (const ing of recipe.ingredientes) {
        const ingredient = await Ingredient.findById(ing.ingrediente._id);
        if (ingredient.quantidadeEstoque < ing.quantidade * item.quantidade) {
          return res.status(400).json({ message: `Estoque insuficiente para o ingrediente ${ingredient.nome}` });
        }
        ingredient.quantidadeEstoque -= ing.quantidade * item.quantidade;
        await ingredient.save();
      }
    }

    // Emissão de nota fiscal (NFC-e) - Implementar conforme a integração necessária
    // Exemplo simplificado:
    // const invoice = await generateNFCe(order);
    // order.notaFiscal = invoice._id;
    // await order.save();

    // Envia para impressão remota
    printUtil.printOrder(order);

    // Emite evento em tempo real para notificações de novo pedido
    if (global.io) {
      global.io.emit('novo_pedido', order);
    }

    res.status(201).json({ message: 'Pedido criado com sucesso', order });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(400).json({ message: 'Erro ao criar pedido', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Validação do status
    const validStatuses = ['Pendente', 'Preparando', 'Pronto', 'Entregue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('mesa').populate('assentos').populate('itens.receita').populate('cliente').populate('garcom');

    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    // Emite evento em tempo real para atualizações de status de pedidos
    if (global.io) {
      global.io.emit('atualizacao_pedido', order);
    }

    res.json({ message: 'Status do pedido atualizado com sucesso', order });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(400).json({ message: 'Erro ao atualizar status do pedido', error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('mesa')
      .populate('assentos')
      .populate('itens.receita')
      .populate('cliente')
      .populate('garcom')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Erro ao obter pedidos:', error);
    res.status(400).json({ message: 'Erro ao obter pedidos', error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('mesa')
      .populate('assentos')
      .populate('itens.receita')
      .populate('cliente')
      .populate('garcom');
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    res.json(order);
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(400).json({ message: 'Erro ao obter pedido', error: error.message });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('cliente').populate('garcom');
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    // Lógica para geração de NFC-e deve ser implementada conforme a integração escolhida
    // Aqui, apenas simulamos a criação de uma fatura
    const numeroFatura = `FAT-${Date.now()}`;
    const invoice = new Invoice({
      pedido: orderId,
      numeroFatura,
      valorTotal: order.total,
      cliente: order.cliente,
      garcom: order.garcom,
    });

    await invoice.save();

    // Atualizar o pedido com a referência da nota fiscal, se necessário
    // order.notaFiscal = invoice._id;
    // await order.save();

    res.json({ message: 'Fatura gerada com sucesso', invoice });
  } catch (error) {
    console.error('Erro ao gerar fatura:', error);
    res.status(400).json({ message: 'Erro ao gerar fatura', error: error.message });
  }
};
