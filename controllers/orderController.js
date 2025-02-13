// controllers/orderController.js

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Table = require('../models/Table');
const Customer = require('../models/Customer');
// const Invoice = require('../models/Invoice');
// const Payment = require('../models/Payment');
// const printUtil = require('../utils/printUtil');

exports.createOrder = async (req, res) => {
  try {
    const {
      clienteId,
      mesaId,
      tipoPedido,
      assento,
      itens,
      nomeCliente,      // <--- PEGAMOS AQUI
      enderecoEntrega,
      preparar,
      observacao,
    } = req.body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ message: 'Nenhum item no pedido.' });
    }

    // Valida se cada item tem "product"
    for (const item of itens) {
      if (!item.product) {
        return res.status(400).json({ message: 'Algum item não possui produto selecionado.' });
      }
    }

    // Se você quer um garçom logado
    const garcomId = req.user ? req.user.id : null;

    // Calcula total
    let total = 0;
    for (const item of itens) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Produto com ID ${item.product} não encontrado` });
      }
      if (product.quantidadeEstoque < item.quantidade) {
        return res.status(400).json({
          message: `Estoque insuficiente para o produto ${product.nome}`,
        });
      }
      total += product.preco * item.quantidade;
    }

    // Se for entrega, define o endereço
    let enderecoEntregaFinal = enderecoEntrega;
    if (tipoPedido === 'entrega') {
      if (!clienteId) {
        return res.status(400).json({ message: 'clienteId é obrigatório para pedidos de entrega.' });
      }

      if (!enderecoEntregaFinal) {
        const cliente = await Customer.findById(clienteId);
        if (cliente) {
          enderecoEntregaFinal = `${cliente.rua}, ${cliente.numero}, ${cliente.complemento || ''}, ${cliente.bairro}, ${cliente.cidade}, ${cliente.estado}, CEP: ${cliente.cep}`;
        } else {
          return res.status(404).json({ message: `Cliente com ID ${clienteId} não encontrado` });
        }
      }
    }

    // Monta os dados do pedido
    const orderData = {
      tipoPedido,
      itens,
      nomeCliente,
      total,
      garcom: garcomId,
      preparar: preparar,
      status: 'Pendente',
      observacao,
    };

    // Se local, define mesa e assento
    if (tipoPedido === 'local') {
      if (!mesaId) {
        return res.status(400).json({ message: 'mesaId é obrigatório para pedidos local.' });
      }
      orderData.mesa = mesaId;
      if (assento) {
        orderData.assento = assento;
      }
      if (nomeCliente) {
        orderData.nomeCliente = nomeCliente; // SALVA
      }
    }

    // Se entrega, define cliente e endereço
    if (tipoPedido === 'entrega') {
      orderData.cliente = clienteId;
      orderData.enderecoEntrega = enderecoEntregaFinal;
    }

    // Cria e salva
    const order = new Order(orderData);
    await order.save();

    // Atualiza estoque
    for (const item of itens) {
      const product = await Product.findById(item.product);
      product.quantidadeEstoque -= item.quantidade;
      await product.save();
    }

    // Se local, marcar mesa como 'ocupada'
    if (tipoPedido === 'local' && mesaId) {
      await Table.findByIdAndUpdate(mesaId, { status: 'ocupada' });
    }

    // Emitir evento de socket, se quiser
    if (global.io) {
      global.io.emit('novo_pedido', order);
    }

    res.status(201).json({ message: 'Pedido criado com sucesso', order });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(400).json({ message: 'Erro ao criar pedido', error: error.message });
  }
};

// Resto do controller permanece igual
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Tentando excluir o pedido com ID: ${id}`);

    // Encontre o pedido
    const order = await Order.findById(id).populate('itens.product');
    if (!order) {
      console.log('Pedido não encontrado.');
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    // Reverter alterações de estoque
    for (const item of order.itens) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.quantidadeEstoque += item.quantidade;
        await product.save();
        console.log(`Estoque atualizado para o produto ${product.nome}. Novo estoque: ${product.quantidadeEstoque}`);
      }
    }

    // Excluir o pedido sem transações
    await Order.findByIdAndDelete(id);
    console.log('Pedido excluído com sucesso.');

    // Emitir evento 'exclusao_pedido' via Socket.IO
    if (global.io) {
      global.io.emit('exclusao_pedido', id);
    }

    res.status(200).json({ message: 'Pedido excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    res.status(500).json({ message: 'Erro ao excluir pedido.', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params; // Alterado de orderId para id
  const { status } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    order.status = status;
    await order.save();

    // Emitir evento 'atualizacao_pedido' via Socket.IO
    if (global.io) {
      global.io.emit('atualizacao_pedido', order);
    }

    res.json({ message: 'Status do pedido atualizado com sucesso', order });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ message: 'Erro ao atualizar status do pedido' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    let { page, limit, mesaId, status, tipoPedido } = req.query;

    // Converte para número e define valores padrão
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;

    const query = {};

    // Se mesaId for fornecido, filtra por mesa
    if (mesaId) {
      query.mesa = mesaId;
    }

    // Se for informado um status, valida e filtra
    if (status) {
      const allowedStatuses = ['Pendente', 'Preparando', 'Pronto', 'Entregue', 'Finalizado'];
      if (!allowedStatuses.includes(status)) {
        return res
          .status(400)
          .json({ message: `Status inválido. Status permitidos: ${allowedStatuses.join(', ')}` });
      }
      query.status = status;
    }

    // Se for informado um tipoPedido, filtra por ele
    if (tipoPedido) {
      query.tipoPedido = tipoPedido;
    }

    // Conta quantos pedidos existem para o filtro informado
    const totalOrders = await Order.countDocuments(query);

    // Busca os pedidos com paginação e popula os relacionamentos
    const orders = await Order.find(query)
      .populate('mesa')
      .populate('cliente')
      .populate('garcom')
      .populate('itens.product')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Calcula o total de páginas
    const totalPages = Math.ceil(totalOrders / limit);

    // Para cada pedido, adiciona a flag "canDelete" (não pode excluir se estiver "Finalizado")
    const ordersWithFlag = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.canDelete = order.status !== 'Finalizado';
      return orderObj;
    });

    res.json({ orders: ordersWithFlag, totalOrders, totalPages });
  } catch (error) {
    console.error('Erro ao obter pedidos:', error);
    res.status(500).json({ message: 'Erro ao obter pedidos.' });
  }
};


exports.getSalesByCategory = async (req, res) => {
  try {
    const { dataInicial, dataFinal } = req.query;

    // Filtro básico para pegar apenas pedidos finalizados
    const match = {
      status: 'Finalizado',
    };

    // Se você quiser filtrar por intervalo de datas de criação
    if (dataInicial && dataFinal) {
      match.createdAt = {
        $gte: new Date(dataInicial),
        $lte: new Date(dataFinal),
      };
    }

    // Faz o 'unwind' de itens e agrupa por 'tipo'
    const salesByCategory = await Order.aggregate([
      { $match: match },
      { $unwind: '$itens' },
      {
        $group: {
          _id: '$itens.tipo',
          // Aqui, você soma a quantidade (ou valor total, se tiver preço)
          totalVendido: { $sum: '$itens.quantidade' },
        },
      },
      {
        $project: {
          _id: 1,
          totalVendido: 1,
        },
      },
    ]);

    return res.status(200).json({ salesByCategory });
  } catch (error) {
    console.error('Erro ao obter vendas por categoria:', error);
    return res.status(500).json({ message: 'Erro ao obter vendas por categoria.' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('mesa')
      .populate('cliente')
      .populate('garcom')
      .populate('itens.product'); // Popula os detalhes dos produtos nos itens
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    res.json(order);
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(400).json({ message: 'Erro ao obter pedido', error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.tipoPedido === 'entrega' && !updates.clienteId) {
      return res.status(400).json({ message: 'clienteId é obrigatório para pedidos de entrega.' });
    }

    if (updates.tipoPedido === 'entrega' && !updates.enderecoEntrega) {
      const cliente = await Customer.findById(updates.clienteId);
      if (cliente) {
        updates.enderecoEntrega = `${cliente.rua}, ${cliente.numero}, ${cliente.complemento || ''}, ${cliente.bairro}, ${cliente.cidade}, ${cliente.estado}, CEP: ${cliente.cep}`;
      } else {
        return res.status(404).json({ message: `Cliente com ID ${updates.clienteId} não encontrado` });
      }
    }

    const order = await Order.findById(id).populate('itens.product');
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    // Handle stock adjustments
    const oldItens = order.itens.map(item => ({
      product: item.product._id.toString(),
      quantidade: item.quantidade,
    }));
    const newItens = updates.itens || order.itens.map(item => ({
      product: item.product.toString(),
      quantidade: item.quantidade,
    }));

    // Create a map for old and new items
    const oldMap = {};
    oldItens.forEach(item => {
      oldMap[item.product] = item.quantidade;
    });

    const newMap = {};
    newItens.forEach(item => {
      newMap[item.product] = item.quantidade;
    });

    // Adjust stock
    for (const productId in newMap) {
      const newQty = newMap[productId];
      const oldQty = oldMap[productId] || 0;
      if (newQty > oldQty) {
        // Decrease stock by the difference
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: `Produto com ID ${productId} não encontrado` });
        }
        if (product.quantidadeEstoque < (newQty - oldQty)) {
          return res.status(400).json({
            message: `Estoque insuficiente para o produto ${product.nome}`,
          });
        }
        product.quantidadeEstoque -= (newQty - oldQty);
        await product.save();
      } else if (newQty < oldQty) {
        // Increase stock by the difference
        const product = await Product.findById(productId);
        if (product) {
          product.quantidadeEstoque += (oldQty - newQty);
          await product.save();
        }
      }
      // Remove from oldMap to identify removed items
      delete oldMap[productId];
    }

    // Items in oldMap are removed in the update, so restore their stock
    for (const productId in oldMap) {
      const oldQty = oldMap[productId];
      const product = await Product.findById(productId);
      if (product) {
        product.quantidadeEstoque += oldQty;
        await product.save();
      }
    }

    // Agora, aplicar as atualizações
    const allowedUpdates = ['mesa', 'assento', 'itens', 'cliente', 'garcom', 'tipoPedido', 'enderecoEntrega', 'preparar', 'observacao'];
    allowedUpdates.forEach((field) => {
      if (field in updates) {
        order[field] = updates[field];
      }
    });

    // Recalcular total
    if (updates.itens) {
      let total = 0;
      for (const item of updates.itens) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ message: `Produto com ID ${item.product} não encontrado` });
        }
        total += product.preco * item.quantidade;
      }
      order.total = total;
    }

    await order.save();

    // Emitir evento 'atualizacao_pedido' via Socket.IO
    if (global.io) {
      global.io.emit('atualizacao_pedido', order);
    }

    // Re-populate the order before sending
    const updatedOrder = await Order.findById(id)
      .populate('mesa')
      .populate('cliente')
      .populate('garcom')
      .populate('itens.product');

    res.json({ message: 'Pedido atualizado com sucesso.', order: updatedOrder });
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(400).json({ message: 'Erro ao atualizar pedido.', error: error.message });
  }
};
