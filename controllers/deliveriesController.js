// deliveriesController.js
const Order = require('../models/Order');


exports.finalizarEntrega = async (req, res) => {
    try {
      const { orderId } = req.params;
  
      // 1) Buscar o pedido com tipoPedido = 'entrega'
      const pedido = await Order.findOne({ _id: orderId, tipoPedido: 'entrega' });
      if (!pedido) {
        return res.status(404).json({ message: 'Pedido de entrega não encontrado.' });
      }
  
      // 2) Receber dados de pagamento, desconto, etc.
      const {
        formaPagamento,  // array de métodos
        valorPago,       // soma total
        tipoDesconto,
        valorDesconto,
        cobrarTaxaServico,
        valorTaxaServico,
        garcomId         // ou entregadorId, se desejar
      } = req.body;
  
      // 3) Atualizar status do pedido
      pedido.status = 'Finalizado';
  
      // 4) (Opcional) gerar PDF de conferência
      // ... Sua lógica de gerar PDF ...
      // const pdfPath = await gerarPDFConferenciaEntrega(pedido, ...);
  
      // 5) Salvar no banco de dados
      await pedido.save();
  
      // Retornar sucesso + (opcional) pdfPath
      return res.json({
        message: 'Entrega finalizada com sucesso!',
        // pdfPath,
      });
    } catch (error) {
      console.error('Erro ao finalizar entrega:', error);
      return res
        .status(500)
        .json({ message: 'Erro ao finalizar entrega', error: error.message });
    }
  };
  