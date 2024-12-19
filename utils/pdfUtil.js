// cash-register-backend/utils/pdfUtil.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Config = require('../models/Config');

exports.createInvoice = async (comanda) => {
  return new Promise(async (resolve, reject) => {
    // Obter configuração do estabelecimento
    const config = await Config.findOne();
    if (!config) {
      return reject(new Error('Configuração do estabelecimento não encontrada. Não é possível gerar comanda.'));
    }

    const doc = new PDFDocument({
      size: [227, 800],
      margins: { top: 10, bottom: 10, left: 5, right: 5 }
    });

    const invoiceDir = path.join(__dirname, '..', 'public', 'comandas');
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }

    const filePath = path.join(invoiceDir, `${comanda._id}.pdf`);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.font('Helvetica').fontSize(10);

    // Cabeçalho baseado na config
    if (config.logotipo) {
      try {
        doc.image(path.join(__dirname, '..', 'public', 'images', config.logotipo), { fit: [60, 60], align: 'center', valign: 'top' });
        doc.moveDown(1);
      } catch(e) {
        // Se não achar logotipo, ignora
      }
    }

    doc.fontSize(12).text(config.razaoSocial.toUpperCase(), { align: 'center', underline: true });
    doc.moveDown(0.5);

    doc.fontSize(8)
      .text(`CNPJ: ${config.cnpj}`, { align: 'center' })
      .text(`IE: ${config.ie}`, { align: 'center' })
      .text(`${config.logradouro}, ${config.numero} - ${config.bairro}`, { align: 'center' })
      .text(`${config.cidade} - ${config.uf}`, { align: 'center' })
      .text(`Fone: ${config.telefone}`, { align: 'center' })
      .text(`Email: ${config.email}`, { align: 'center' });

    if (config.site) {
      doc.text(`Site: ${config.site}`, { align: 'center' });
    }

    doc.moveDown(1);

    doc.fontSize(10).text(`Comanda da Mesa: ${comanda.mesa}`, { align: 'left' });
    doc.text(`Data: ${new Date(comanda.createdAt).toLocaleString()}`, { align: 'left' });
    doc.text(`Finalização: ${new Date(comanda.dataFinalizacao).toLocaleString()}`, { align: 'left' });
    doc.moveDown(1);
    doc.text('--------------------------------', { align: 'center' });

    let totalGeral = 0;

    (comanda.pedidos || []).forEach(pedido => {
      doc.moveDown(0.5).text(`Pedido #${pedido.orderNumber}`, { underline: true });
      pedido.itens.forEach(item => {
        const nomeProduto = item.product ? item.product.nome : 'Produto';
        const valorItem = (item.quantidade * (item.product ? item.product.preco : 0));
        doc.text(`${item.quantidade} x ${nomeProduto}`, { align: 'left' });
        doc.text(`R$ ${valorItem.toFixed(2)}`, { align: 'right' });
        totalGeral += valorItem;
      });
      doc.moveDown(0.5);
      doc.text('--------------------------------', { align: 'center' });
    });

    doc.moveDown(0.5);
    doc.text(`Subtotal: R$ ${totalGeral.toFixed(2)}`, { align: 'right' });

    // Aplica taxa de serviço
    const taxa = config.taxaServico || 0;
    let valorTaxa = (totalGeral * (taxa / 100));
    if (taxa > 0) {
      doc.text(`Taxa de Serviço (${taxa}%): R$ ${valorTaxa.toFixed(2)}`, { align: 'right' });
    }

    let totalFinal = totalGeral + valorTaxa;

    // Caso tenha desconto na comanda
    if (comanda.tipoDesconto !== 'nenhum') {
      let descTexto = comanda.tipoDesconto === 'porcentagem' ? `${comanda.valorDesconto}%` : `R$ ${comanda.valorDesconto.toFixed(2)}`;
      doc.text(`Desconto: ${descTexto}`, { align: 'right' });
      // Recalcula total final
      if (comanda.tipoDesconto === 'porcentagem') {
        totalFinal = totalFinal - (totalFinal * (comanda.valorDesconto / 100));
      } else {
        totalFinal = Math.max(totalFinal - comanda.valorDesconto, 0);
      }
    }

    doc.text(`Total Final: R$ ${totalFinal.toFixed(2)}`, { align: 'right', bold: true });

    doc.moveDown(0.5);
    doc.text(`Forma de Pagamento: ${comanda.formaPagamento}`, { align: 'left' });

    doc.moveDown(1);
    doc.text('Obrigado pela preferência!', { align: 'center' });
    doc.moveDown(1);
    doc.text('Volte Sempre!', { align: 'center' });

    if (config.observacoes) {
      doc.moveDown(1);
      doc.fontSize(8).text(config.observacoes, { align: 'center' });
    }

    doc.end();

    writeStream.on('finish', () => {
      resolve(`/comandas/${comanda._id}.pdf`);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
};
