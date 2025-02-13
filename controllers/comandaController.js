// controllers/comandaController.js

const Comanda = require('../models/Comanda');
const Order = require('../models/Order');
const path = require('path');
const fs = require('fs');
const { createConferencePDF, createInvoice } = require('../utils/pdfUtil');
const Table = require('../models/Table');
const sendEmail = require('../utils/emailUtil');
const PDFDocument = require('pdfkit');



/**
 * Função para buscar pedidos "Entregue" de uma mesa e agrupá-los por assento.
 * @param {String} tableId - ID da mesa (ObjectId)
 * @returns {Object} Objeto com assentos como chaves e arrays de pedidos como valores
 */
const buscarPedidosPorMesa = async (tableId) => {
  try {
    // Buscar pedidos no BD com status 'Entregue'
    const orders = await Order.find({
      mesa: tableId,
      status: 'Entregue',
    }).populate('itens.product');

    // Agrupar pedidos por assento
    const pedidosPorAssento = {};

    orders.forEach((ord) => {
      const assento = ord.assento || 'Assento Único'; // Caso não haja assento, consideramos um único assento

      if (!pedidosPorAssento[assento]) {
        pedidosPorAssento[assento] = [];
      }

      const itensFormatados = ord.itens.map((item) => ({
        nome: item.product?.nome || 'Desconhecido',
        quantidade: item.quantidade,
        preco: item.product?.preco || 0,
        total: (item.product?.preco || 0) * item.quantidade,
        product: item.product, // Adiciona o produto populado
      }));

      pedidosPorAssento[assento].push({
        orderNumber: ord.orderNumber || ord._id,
        total: ord.total || 0,
        itens: itensFormatados,
        nomeCliente: ord.nomeCliente || 'Desconhecido',
      });
    });

    return pedidosPorAssento;
  } catch (err) {
    console.error('Erro ao buscar pedidos por mesa:', err);
    throw err;
  }
};



// Conversor mm -> pontos
const mmToPoints = (mm) => mm * 2.83465;

const gerarConferencia = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1) Buscar pedido e popular dados
    const pedido = await Order.findById(orderId)
      .populate('cliente', 'nome email') // se quiser exibir nome do cliente
      .populate('garcom', 'nome')
      .populate('itens.product');

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // 2) Criar pasta se não existir
    const pdfsDir = path.join(__dirname, '..', 'public', 'pdfs');
    if (!fs.existsSync(pdfsDir)) {
      fs.mkdirSync(pdfsDir, { recursive: true });
    }

    // 3) Nome do arquivo
    const pdfFilename = `conferencia-${orderId}.pdf`;
    const pdfFullPath = path.join(pdfsDir, pdfFilename);

    // 4) Definir tamanho para impressora térmica (80mm x 300mm)
    const width = mmToPoints(80);
    const height = mmToPoints(300);

    const doc = new PDFDocument({
      size: [width, height],
      margin: 10,
      layout: 'portrait',
    });

    // 5) Criar writeStream
    const writeStream = fs.createWriteStream(pdfFullPath);
    doc.pipe(writeStream);

    // 6) Conteúdo do PDF

    // Título e identificação do pedido
    doc.fontSize(12).text('Conferência do Pedido', { align: 'center' });
    doc.moveDown();
    doc
      .fontSize(10)
      .text(`Pedido #${pedido.orderNumber || orderId}`, { align: 'center' });

    // Nome do cliente
    // Se você armazenou no campo "pedido.cliente?.nome"
    // ou se for "pedido.nomeCliente", ajuste conforme a sua lógica
    const nomeCliente = pedido.cliente?.nome || pedido.nomeCliente;
    if (nomeCliente) {
      doc.text(`Cliente: ${nomeCliente}`, { align: 'center' });
    }

    // Endereço de entrega
    if (pedido.enderecoEntrega) {
      doc.text(`Endereço: ${pedido.enderecoEntrega}`, { align: 'center' });
    }

    // Valor da taxa de entrega (se existir no schema)
    // Use "pedido.deliveryCost", "pedido.valorEntrega" etc.
    if (pedido.deliveryCost) {
      doc.moveDown(0.5);
      doc.text(`Taxa de Entrega: R$ ${pedido.deliveryCost.toFixed(2)}`, {
        align: 'center',
      });
    }

    doc.moveDown();

    // Itens do pedido
    doc.text('Itens:', { underline: true });
    pedido.itens.forEach((item) => {
      const nome = item.product?.nome || '???';
      const qtde = item.quantidade || 0;
      const preco = item.product?.preco || 0;
      const subtotal = (qtde * preco).toFixed(2);
      doc.text(`${qtde} x ${nome} = R$ ${subtotal}`, { indent: 20 });
    });
    doc.moveDown();

    // Total do pedido
    doc.text(`Total: R$ ${pedido.total?.toFixed(2)}`, { align: 'right' });

    // 7) Mensagem final de agradecimento
    doc.moveDown(1);
    doc.fontSize(10).text('Obrigado pela preferência!', { align: 'center' });

    // 8) Finalizar doc
    doc.end();

    // Evento de finalização
    writeStream.on('finish', () => {
      const pdfPath = `/pdfs/${pdfFilename}`;
      return res.json({ pdfPath });
    });

    writeStream.on('error', (err) => {
      console.error('Erro ao escrever PDF:', err);
      return res
        .status(500)
        .json({ message: 'Falha ao gerar PDF de conferência' });
    });
  } catch (error) {
    console.error('Erro ao gerar PDF de conferência:', error);
    res
      .status(500)
      .json({ message: 'Erro ao gerar PDF de conferência', error: error.message });
  }
};


/**
 * GET /api/comandas/:comandaId/invoice
 * Gera PDF de Invoice para uma comanda
 */
const generateInvoicePDF = async (req, res) => {
  try {
    const { comandaId } = req.params;

    // Buscar a comanda
    const comanda = await Comanda.findById(comandaId)
      .populate({
        path: 'finalizedTable',
        populate: {
          path: 'pedidos',
          populate: { path: 'itens.product', model: 'Product' },
        },
      })
      .populate('finalizedTable.mesa');

    if (!comanda) {
      return res.status(404).json({ message: 'Comanda não encontrada.' });
    }

    // Gerar PDF usando o utilitário
    const pdfPathRelative = await createInvoice(comanda.finalizedTable);

    // Atualizar comanda com o caminho do PDF, se necessário
    comanda.pdfPath = pdfPathRelative;
    await comanda.save();

    return res.json({ pdfPath: pdfPathRelative });
  } catch (error) {
    console.error('Erro ao gerar PDF de invoice:', error);
    return res.status(500).json({
      message: 'Erro ao gerar PDF de invoice',
      error: error.message,
    });
  }
};

/**
 * Enviar email com o PDF da comanda
 */
const sendComandaEmail = async (req, res) => {
  try {
    const { comandaId, email } = req.body;

    if (!comandaId || !email) {
      return res.status(400).json({ message: 'comandaId e email são obrigatórios.' });
    }

    // Buscar a comanda
    const comanda = await Comanda.findById(comandaId)
      .populate({
        path: 'finalizedTable',
        populate: { path: 'pedidos.itens.product', model: 'Product' },
      })
      .populate('finalizedTable.mesa')
      .populate('finalizedTable.garcomId', 'nome');

    if (!comanda) {
      return res.status(404).json({ message: 'Comanda não encontrada.' });
    }

    // Verificar se há PDF da comanda
    const pdfPath = comanda.pdfPath;
    if (!pdfPath) {
      return res.status(400).json({ message: 'Não há PDF associado a esta comanda.' });
    }

    const absolutePdfPath = path.join(__dirname, '..', 'public', pdfPath);
    if (!fs.existsSync(absolutePdfPath)) {
      return res.status(404).json({ message: 'Arquivo PDF da comanda não encontrado no servidor.' });
    }

    // Montar corpo do email em HTML
    let htmlBody = `<h2>Comanda da Mesa ${comanda.finalizedTable.mesa.numeroMesa}</h2>`;
    htmlBody += `<p><strong>Data da Finalização:</strong> ${new Date(comanda.finalizedTable.dataFinalizacao).toLocaleString('pt-BR')}</p>`;
    htmlBody += `<p><strong>Forma de Pagamento:</strong> ${Array.isArray(comanda.finalizedTable.formaPagamento) ? comanda.finalizedTable.formaPagamento.join(', ') : comanda.finalizedTable.formaPagamento}</p>`;
    htmlBody += `<p><strong>Total Final:</strong> R$ ${comanda.finalizedTable.valorTotal.toFixed(2)}</p>`;

    if (comanda.finalizedTable.tipoDesconto === 'porcentagem') {
      htmlBody += `<p><strong>Desconto:</strong> ${comanda.finalizedTable.valorDesconto}%</p>`;
    } else if (comanda.finalizedTable.tipoDesconto === 'valor') {
      htmlBody += `<p><strong>Desconto:</strong> R$ ${comanda.finalizedTable.valorDesconto.toFixed(2)}</p>`;
    } else {
      htmlBody += `<p><strong>Desconto:</strong> Nenhum</p>`;
    }

    htmlBody += `<h3>Pedidos:</h3>`;
    if (comanda.finalizedTable.pedidos && comanda.finalizedTable.pedidos.length > 0) {
      comanda.finalizedTable.pedidos.forEach((order) => {
        htmlBody += `<h4>Pedido #${order.orderNumber} - Total: R$ ${order.total.toFixed(2)}</h4>`;
        htmlBody += `<ul>`;
        order.itens.forEach((item) => {
          const nomeProduto = item.product ? item.product.nome : 'Produto Desconhecido';
          const valorItem = (item.product ? item.product.preco : 0) * item.quantidade;
          htmlBody += `<li>${item.quantidade} x ${nomeProduto} (R$ ${valorItem.toFixed(2)})</li>`;
        });
        htmlBody += `</ul>`;
      });
    } else {
      htmlBody += `<p>Nenhum pedido associado.</p>`;
    }

    htmlBody += `<hr><p>Em anexo, o PDF da comanda para impressão ou armazenamento.</p>`;

    // Enviar email com anexo
    await sendEmail(
      email,
      `Comanda Finalizada - Mesa ${comanda.finalizedTable.mesa.numeroMesa}`,
      'Segue em anexo a comanda finalizada.',
      htmlBody,
      [
        {
          filename: `Comanda_Mesa_${comanda.finalizedTable.mesa.numeroMesa}.pdf`,
          path: absolutePdfPath,
          contentType: 'application/pdf',
        },
      ]
    );

    res.json({ message: 'Email enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar email da comanda:', error);
    res.status(500).json({ message: 'Erro interno ao enviar email da comanda', error: error.message });
  }
};

/**
 * GET /api/comandas
 * Lista todas as comandas
 */
const getComandas = async (req, res) => {
  try {
    const comandas = await Comanda.find()
      .populate({
        path: 'finalizedTable',
        populate: {
          path: 'pedidos',
          populate: { path: 'itens.product', model: 'Product' },
        },
      })
      .populate('finalizedTable.mesa');

    res.json({ comandas });
  } catch (error) {
    console.error('Erro ao obter comandas:', error);
    res.status(500).json({ message: 'Erro ao obter comandas.' });
  }
};

/**
 * GET /api/comandas/:id/pdf
 * Baixa o PDF da comanda
 */
const downloadComandaPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const comanda = await Comanda.findById(id);
    if (!comanda) {
      return res.status(404).json({ message: 'Comanda não encontrada' });
    }
    if (!comanda.pdfPath) {
      return res.status(400).json({ message: 'Nenhum PDF associado a esta comanda.' });
    }
    const absolutePath = path.join(__dirname, '..', 'public', comanda.pdfPath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'PDF não encontrado no servidor.' });
    }
    res.download(absolutePath, `Comanda_${id}.pdf`);
  } catch (err) {
    console.error('Erro ao baixar PDF da comanda:', err);
    res.status(500).json({ message: 'Erro ao baixar PDF da comanda.', error: err.message });
  }
};

/**
 * GET /api/comandas/:tableId/conferencia
 * Gera PDF de conferência (antes de finalizar)
 */
const generateConferencePDF = async (req, res) => {
  try {
    const { tableId } = req.params;

    // Verificar se a mesa existe
    const mesa = await Table.findById(tableId).populate('ambiente');
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    // Buscar pedidos "Entregue" para essa mesa agrupados por assento
    const pedidosPorAssento = await buscarPedidosPorMesa(tableId);

    // Gerar PDF usando o utilitário
    const pdfPathRelative = await createConferencePDF(mesa, pedidosPorAssento);

    return res.json({ pdfPath: pdfPathRelative });
  } catch (error) {
    console.error('Erro ao gerar PDF de conferência:', error);
    return res.status(500).json({
      message: 'Erro ao gerar PDF de conferência',
      error: error.message,
    });
  }
};

/**
 * PUT /api/comandas/:comandaId/payments
 * Adiciona um pagamento parcial
 */
const addPayment = async (req, res) => {
  try {
    const { comandaId } = req.params;
    const { metodo, valor } = req.body;

    const comanda = await Comanda.findById(comandaId);
    if (!comanda) {
      return res.status(404).json({ message: 'Comanda não encontrada.' });
    }

    comanda.pagamentos.push({
      metodo: metodo || 'dinheiro',
      valor: parseFloat(valor) || 0,
      data: new Date(),
    });
    await comanda.save();

    return res.json({ message: 'Pagamento adicionado com sucesso', comanda });
  } catch (err) {
    console.error('Erro ao adicionar pagamento:', err);
    return res.status(500).json({ message: 'Erro ao adicionar pagamento', error: err.message });
  }
};

module.exports = {
  generateInvoicePDF,
  sendComandaEmail,
  getComandas,
  downloadComandaPDF,
  generateConferencePDF,
  addPayment,
  gerarConferencia,     // <-- ADICIONAR ESTA LINHA
};