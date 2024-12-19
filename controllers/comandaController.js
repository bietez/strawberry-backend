// controllers/comandaController.js
const Comanda = require('../models/Comanda');
const path = require('path');
const fs = require('fs');

exports.sendComandaEmail = async (req, res) => {
  try {
    const { comandaId, email } = req.body;

    if (!comandaId || !email) {
      return res.status(400).json({ message: 'comandaId e email são obrigatórios.' });
    }

    // Buscar a comanda
    const comanda = await Comanda.findById(comandaId)
      .populate('orders')
      .populate({
        path: 'orders',
        populate: { path: 'itens.product', model: 'Product' }
      })
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' }
      });

    if (!comanda) {
      return res.status(404).json({ message: 'Comanda não encontrada.' });
    }

    // Verificar se há PDF da comanda
    // Supondo que o pdfPath foi salvo no campo 'pdfPath' da comanda (caso contrário, ajuste a lógica)
    // Caso isso não tenha sido salvo, precisaria gerar novamente o PDF ou ter sido salvo em outro lugar.
    // Para este exemplo, presumiremos que pdfPath existe. Caso contrário, retorne erro.
    const pdfPath = comanda.pdfPath; 
    if (!pdfPath) {
      return res.status(400).json({ message: 'Não há PDF associado a esta comanda.' });
    }

    const absolutePdfPath = path.join(__dirname, '..', 'public', pdfPath);
    if (!fs.existsSync(absolutePdfPath)) {
      return res.status(404).json({ message: 'Arquivo PDF da comanda não encontrado no servidor.' });
    }

    // Montar corpo do email em HTML
    let htmlBody = `<h2>Comanda da Mesa ${comanda.mesa.numeroMesa}</h2>`;
    htmlBody += `<p><strong>Data da Finalização:</strong> ${new Date(comanda.createdAt).toLocaleString()}</p>`;
    htmlBody += `<p><strong>Forma de Pagamento:</strong> ${comanda.formaPagamento}</p>`;
    htmlBody += `<p><strong>Total Final:</strong> R$ ${comanda.total.toFixed(2)}</p>`;

    if (comanda.tipoDesconto === 'porcentagem') {
      htmlBody += `<p><strong>Desconto:</strong> ${comanda.valorDesconto}%</p>`;
    } else if (comanda.tipoDesconto === 'valor') {
      htmlBody += `<p><strong>Desconto:</strong> R$ ${comanda.valorDesconto.toFixed(2)}</p>`;
    } else {
      htmlBody += `<p><strong>Desconto:</strong> Nenhum</p>`;
    }

    htmlBody += `<h3>Pedidos:</h3>`;
    if (comanda.orders && comanda.orders.length > 0) {
      comanda.orders.forEach((order) => {
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
      `Comanda Finalizada - Mesa ${comanda.mesa.numeroMesa}`,
      'Segue em anexo a comanda finalizada.',
      htmlBody,
      [
        {
          filename: `Comanda_Mesa_${comanda.mesa.numeroMesa}.pdf`,
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



exports.getComandas = async (req, res) => {
  try {
    const comandas = await Comanda.find()
      .populate('mesa')
      .populate({
        path: 'orders',
        populate: { path: 'itens.product', model: 'Product' },
      })
      .sort({ createdAt: -1 });

    res.json({ comandas });
  } catch (error) {
    console.error('Erro ao obter comandas:', error);
    res.status(500).json({ message: 'Erro ao obter comandas.' });
  }
};

/**
 * Endpoint para baixar o PDF da comanda
 */
exports.downloadComandaPDF = async (req, res) => {
  try {
    const comandaId = req.params.id;
    const comanda = await Comanda.findById(comandaId).populate('mesa');

    if (!comanda) {
      return res.status(404).json({ message: 'Comanda não encontrada.' });
    }

    // Assumindo que pdfPath já foi definido e salvo no campo comanda.pdfPath pelo controller de finalização
    // Ex: comanda.pdfPath = '/comandas/<id>.pdf'
    if (!comanda.pdfPath) {
      return res.status(400).json({ message: 'Nenhum PDF associado a esta comanda.' });
    }

    const absolutePath = path.join(__dirname, '..', 'public', comanda.pdfPath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'PDF da comanda não encontrado.' });
    }

    // Se quiser apenas baixar, use res.download
    res.download(absolutePath, `Comanda_Mesa_${comanda.mesa.numeroMesa}.pdf`, (err) => {
      if (err) {
        console.error('Erro ao enviar o PDF:', err);
        res.status(500).json({ message: 'Erro ao enviar o PDF.' });
      }
    });

  } catch (error) {
    console.error('Erro ao baixar PDF da comanda:', error);
    res.status(500).json({ message: 'Erro ao baixar PDF da comanda.', error: error.message });
  }
};
