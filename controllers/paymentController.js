const Payment = require('../models/Payment');
const Order = require('../models/Order');

exports.processPayment = async (req, res) => {
  try {
    const { pedidoId, metodoPagamento, valorPago } = req.body;

    const order = await Order.findById(pedidoId);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    if (order.total > valorPago) {
      return res.status(400).json({ message: 'Valor pago insuficiente' });
    }

    const troco = valorPago - order.total;

    const payment = new Payment({
      pedido: pedidoId,
      metodoPagamento,
      valorPago,
      troco,
      notaFiscalEmitida: false, // Atualizar conforme a emissão da nota fiscal
    });

    await payment.save();

    // Atualizar status do pedido para "Entregue"
    order.status = 'Entregue';
    await order.save();

    // Emissão da NFC-e (Implementar conforme a integração com serviços de emissão)

    res.status(201).json({ message: 'Pagamento processado com sucesso', payment });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao processar pagamento', error: error.message });
  }
};
