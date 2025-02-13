// src/utils/pdfUtil.js

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Config = require('../models/Config');

/**
 * Gera um PDF contendo várias metas de vendas, salvando-o em disco numa pasta pública.
 * @param {Array} salesGoals - Array de metas (já populadas com employee, manager, product).
 * @returns {Promise<String>} Retorna o caminho relativo do arquivo PDF (ex.: /sales-goal/xxx.pdf)
 */
const createSalesGoalsPDF = (salesGoals) => {
  return new Promise((resolve, reject) => {
    try {
      // Defina uma pasta (por exemplo, "public/sales-goal")
      const pdfDir = path.join(__dirname, '..', 'public', 'sales-goal');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      // Criar nome do arquivo
      const timestamp = Date.now();
      const pdfFilename = `salesGoals_${timestamp}.pdf`;
      const pdfPath = path.join(pdfDir, pdfFilename);

      // Instancia doc PDFKit
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      // Cria writeStream
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      // Título
      doc.fontSize(18).text('Relatório de Metas de Vendas', { align: 'center' });
      doc.moveDown();

      // Iterar metas e adicionar ao PDF
      salesGoals.forEach((goal, index) => {
        doc.fontSize(12).text(`Meta #${index + 1}`, { underline: true });
        doc
          .fontSize(10)
          .text(`Funcionário: ${goal.employee?.nome || 'N/A'}`)
          .text(`Manager: ${goal.manager?.nome || 'N/A'}`)
          .text(`Produto: ${goal.product?.nome || 'N/A'}`)
          .text(`Nome da Meta: ${goal.goalName}`)
          .text(`Valor da Meta: R$ ${goal.goalAmount.toLocaleString('pt-BR')}`)
          .text(`Valor Atual: R$ ${goal.currentSales?.toLocaleString('pt-BR') || '0,00'}`)
          .text(`Progresso: ${goal.progress?.toFixed(2)}%`)
          .text(`Status: ${goal.status || 'N/A'}`)
          .text(
            `Início: ${
              goal.startDate ? new Date(goal.startDate).toLocaleDateString('pt-BR') : 'N/A'
            }`
          )
          .text(
            `Término: ${
              goal.endDate ? new Date(goal.endDate).toLocaleDateString('pt-BR') : 'N/A'
            }`
          );

        doc.moveDown();
      });

      // Finalizar doc
      doc.end();

      // Escuta quando terminar de gravar
      writeStream.on('finish', () => {
        // Montar path relativo para servir via express static
        const relativePath = `/sales-goal/${pdfFilename}`;
        resolve(relativePath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Gera um PDF finalizado para a mesa, salvando-o em disco numa pasta pública.
 * @param {Object} finalizedDoc - Objeto FinalizedTable com informações populadas.
 * @returns {Promise<String>} Retorna o caminho relativo do arquivo PDF (ex.: /comandas/finalized_xxx.pdf)
 */
const createFinalizedPDF = async (finalizedDoc) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
      });

      // Pasta
      const dir = path.join(__dirname, '..', 'public', 'comandas');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const fileName = `finalized_${finalizedDoc._id}.pdf`;
      const filePath = path.join(dir, fileName);

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Conteúdo do PDF
      doc.fontSize(16).text('Comanda Finalizada', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Mesa: ${finalizedDoc.numeroMesa}`);
      doc.text(`Ambiente: ${finalizedDoc.ambienteId?.nome || 'N/A'}`);
      doc.text(`Garçom: ${finalizedDoc.garcomId?.nome || 'Desconhecido'}`);
      doc.text(`Data Finalização: ${new Date(finalizedDoc.dataFinalizacao).toLocaleString()}`);
      doc.moveDown();

      // Pedidos
      if (finalizedDoc.pedidos && finalizedDoc.pedidos.length > 0) {
        doc.text('Pedidos:', { underline: true });
        finalizedDoc.pedidos.forEach((pedido) => {
          doc.moveDown(0.5);
          doc.text(`Pedido #${pedido.orderNumber || pedido._id}`, { indent: 20 });
          if (pedido.itens) {
            pedido.itens.forEach((item) => {
              const nomeProduto = item.product?.nome ?? 'Produto?';
              const qtde = item.quantidade ?? 0;
              const preco = item.product?.preco ?? 0;
              const subtotal = (qtde * preco).toFixed(2);
              doc.text(`${qtde}x ${nomeProduto} - R$ ${subtotal}`, { indent: 40 });
            });
          }
          doc.text(`Total do Pedido: R$ ${pedido.total?.toFixed(2)}`, { indent: 20 });
        });
      }

      doc.moveDown();
      doc.text(`Forma de Pagamento: ${Array.isArray(finalizedDoc.formaPagamento) ? finalizedDoc.formaPagamento.join(', ') : finalizedDoc.formaPagamento}`);
      doc.text(`Valor Pago: R$ ${finalizedDoc.valorPago?.toFixed(2)}`);
      if (finalizedDoc.tipoDesconto === 'porcentagem') {
        doc.text(`Desconto: ${finalizedDoc.valorDesconto}%`);
      } else if (finalizedDoc.tipoDesconto === 'valor') {
        doc.text(`Desconto: R$ ${finalizedDoc.valorDesconto?.toFixed(2)}`);
      } else {
        doc.text(`Desconto: Nenhum`);
      }
      doc.text(`Total Final: R$ ${finalizedDoc.valorTotal?.toFixed(2)}`);

      doc.end();

      writeStream.on('finish', () => {
        // Retorna caminho que o front acessará: ex. "/comandas/finalized_xxx.pdf"
        const publicPath = `/comandas/${fileName}`;
        resolve(publicPath);
      });
      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Função para gerar PDF de conferência.
 * @param {Object} mesa - Objeto da mesa com informações populadas.
 * @param {Object} pedidosPorAssento - Objeto com pedidos agrupados por assento.
 * @returns {Promise<String>} Caminho relativo do PDF gerado.
 */
const createConferencePDF = async (mesa, pedidosPorAssento) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Obter configuração do estabelecimento
      const config = await Config.findOne();
      if (!config) {
        return reject(
          new Error(
            'Configuração do estabelecimento não encontrada. Não é possível gerar conferência.'
          )
        );
      }

      // 2. Definir dimensões para impressoras térmicas (80mm de largura)
      const mmToPoints = (mm) => mm * 2.83465; // 1mm = 2.83465 pontos
      const width = mmToPoints(80); // Aproximadamente 227 pontos
      const height = mmToPoints(300); // Altura inicial ajustável (pode aumentar conforme necessário)

      // 3. Instanciar o documento PDF
      const doc = new PDFDocument({
        size: [width, height],
        margin: 10,
        layout: 'portrait',
      });

      // 4. Registrar a fonte personalizada (se disponível)
      const fontPath = path.join(
        __dirname,
        '..',
        'public',
        'fonts',
        'RobotoCondensed.ttf'
      ); // Atualize o caminho conforme necessário
      if (fs.existsSync(fontPath)) {
        doc.registerFont('RobotoCondensed', fontPath);
        doc.font('RobotoCondensed');
      } else {
        doc.font('Courier'); // Fonte padrão caso a personalizada não esteja disponível
      }

      // 5. Definir o diretório onde o PDF será salvo
      const pdfDir = path.join(__dirname, '..', 'public', 'conferences');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      // 6. Criar o nome e caminho do arquivo PDF
      const filename = `conference_${mesa.numeroMesa}_${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, filename);

      // 7. Criar o stream de escrita para o arquivo PDF
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // 8. Adicionar logotipo se existir
      if (config.logotipo) {
        const logoPath = path.join(
          __dirname,
          '..',
          'public',
          'images',
          config.logotipo
        );
        if (fs.existsSync(logoPath)) {
          const imageWidth = 50; // Largura da imagem (ajuste conforme necessário)
          const pageWidth = doc.page.width; // Largura da página
          const centerX = (pageWidth - imageWidth) / 2; // Calcula o ponto inicial para centralizar

          doc.image(logoPath, centerX, doc.y, {
            fit: [imageWidth, 50], // Ajusta para 50x50 (largura x altura)
          });
          doc.moveDown(4); // Adiciona espaçamento após a imagem
        }
      }

      // 9. Cabeçalho do Emitente
      doc
        .fontSize(14)
        .text(config.razaoSocial.toUpperCase(), { align: 'center', underline: true })
        .fontSize(10)
        .text(`CNPJ: ${config.cnpj}`, { align: 'center' })
        .text(
          `Endereço: ${config.logradouro}, ${config.numero} - ${config.bairro}`,
          { align: 'center' }
        )
        .text(`${config.cidade} - ${config.uf}`, { align: 'center' })
        .text(`Telefone: ${config.telefone} | Email: ${config.email}`, {
          align: 'center',
        })
        .moveDown(1);

      // 10. Informações da Mesa
      doc
        .fontSize(12)
        .text(`Conferência - Mesa ${mesa.numeroMesa}`, {
          align: 'center',
          underline: true,
        })
        .text(`Ambiente: ${mesa.ambiente?.nome || 'N/A'}`, { align: 'center' })
        .moveDown(1);

      // 11. Data e Hora da Geração
      const now = new Date();
      doc
        .fontSize(10)
        .text(
          `Data: ${now.toLocaleDateString('pt-BR')} - Hora: ${now.toLocaleTimeString(
            'pt-BR'
          )}`,
          { align: 'left' }
        )
        .moveDown();

      // 12. Inicializar subtotal
      let subtotal = 0;

      // 13. Pedidos por Assento
      for (const [assento, pedidos] of Object.entries(pedidosPorAssento)) {
        if (!pedidos || pedidos.length === 0) continue; // Verificar se há pedidos

        // Buscar o nome do cliente para o assento
        const nomeCliente = pedidos[0].nomeCliente || 'N/A';

        doc
          .fontSize(11)
          .text(`Assento: ${assento} - Cliente: ${nomeCliente}`, {
            underline: true,
          })
          .moveDown(0.5);

        let totalAssento = 0;

        pedidos.forEach((pedido) => {
          // Usar orderNumber ou _id conforme disponível
          const numeroPedido = pedido.orderNumber || pedido._id || 'N/A';
          doc
            .fontSize(10)
            .text(`Pedido #${numeroPedido} - Total: R$ ${pedido.total?.toFixed(2)}`);

          // Adicionar o nome do cliente específico do pedido, se necessário
          if (pedido.nomeCliente && pedido.nomeCliente !== nomeCliente) {
            doc
              .fontSize(10)
              .text(`Cliente: ${pedido.nomeCliente}`, { indent: 20 });
          }

          // Iterar sobre os itens do pedido
          pedido.itens.forEach((item) => {
            const nomeProduto = item.product?.nome ?? 'Produto?';
            const qtde = item.quantidade ?? 0;
            const preco = item.product?.preco ?? 0;
            const subtotalItem = (qtde * preco).toFixed(2);
            doc.text(`${qtde}x ${nomeProduto} - R$ ${subtotalItem}`, {
              indent: 20,
            });
            totalAssento += parseFloat(subtotalItem);
          });

          doc.moveDown(0.5);
        });

        // Exibir Total por Assento
        doc
          .fontSize(10)
          .text(`Total Assento ${assento}: R$ ${totalAssento.toFixed(2)}`, {
            align: 'right',
          });
        doc.moveDown();
        subtotal += totalAssento;
      }

      // 14. Exibir Subtotal (sem taxa de serviço)
      doc
        .fontSize(12)
        .text(`Subtotal: R$ ${subtotal.toFixed(2)}`, { align: 'right' });

      // 15. Taxa de Serviço
      const taxaServico = config.taxaServico || 0; // Percentual
      let valorTaxaServico = subtotal * (taxaServico / 100);
      doc
        .fontSize(12)
        .text(`Taxa de Serviço (${taxaServico}%): R$ ${valorTaxaServico.toFixed(2)}`, {
          align: 'right',
        });

      // 16. Calcular Total Geral
      const totalGeral = subtotal + valorTaxaServico;

      // 17. Exibir Total Geral
      doc
        .fontSize(12)
        .text(`Total Geral: R$ ${totalGeral.toFixed(2)}`, { align: 'right' });

      // 18. Rodapé com mensagem de agradecimento
      doc
        .moveDown(1.5)
        .fontSize(10)
        .text('Obrigado pela preferência!', { align: 'center' });

      // 19. Finalizar o documento PDF
      doc.end();

      // 20. Gerenciar eventos de finalização e erros
      writeStream.on('finish', () => {
        // Retorna o caminho relativo para servir via express static
        resolve(`/conferences/${filename}`);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Gera um PDF finalizado para a mesa, salvando-o em disco numa pasta pública.
 * @param {Object} comanda - Objeto da comanda com informações populadas.
 * @returns {Promise<String>} Retorna o caminho relativo do arquivo PDF (ex.: /comandas/comanda_xxx.pdf)
 */
const createInvoice = async (comanda) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Obter configuração do estabelecimento
      const config = await Config.findOne();
      if (!config) {
        return reject(new Error('Configuração do estabelecimento não encontrada. Não é possível gerar comanda.'));
      }

      // Definir dimensões para impressoras térmicas (80mm de largura)
      const mmToPoints = (mm) => mm * 2.83465; // 1mm = 2.83465 pontos
      const width = mmToPoints(80); // Aproximadamente 227 pontos
      const height = mmToPoints(800); // Altura ajustável para acomodar conteúdo

      const doc = new PDFDocument({
        size: [width, height],
        margin: 10,
        layout: 'portrait',
      });

      // Registrar a fonte personalizada
      const fontPath = path.join(__dirname, '..', 'public', 'fonts', 'RobotoCondensed.ttf'); // Atualize conforme o caminho correto
      if (fs.existsSync(fontPath)) {
        doc.registerFont('RobotoCondensed', fontPath);
        doc.font('RobotoCondensed');
      } else {
        doc.font('Courier'); // Fonte padrão caso a personalizada não esteja disponível
      }

      const invoiceDir = path.join(__dirname, '..', 'public', 'comandas');
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
      }

      const fileName = `invoice_${comanda._id}.pdf`;
      const filePath = path.join(invoiceDir, fileName);

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Adicionar logo se existir
      if (config.logotipo) {
        const logoPath = path.join(__dirname, '..', 'public', 'images', config.logotipo);
        if (fs.existsSync(logoPath)) {
          const imageWidth = 60; // Largura da imagem (ajuste conforme necessário)
          const pageWidth = doc.page.width; // Largura da página
          const centerX = (pageWidth - imageWidth) / 2; // Calcula o ponto inicial para centralizar

          doc.image(logoPath, centerX, doc.y, {
            fit: [imageWidth, 60], // Ajusta para 60x60 (largura x altura)
          });
          doc.moveDown(2); // Adiciona espaçamento após a imagem
        }
      }

      // Cabeçalho do Emitente
      doc
        .fontSize(14)
        .text(config.razaoSocial.toUpperCase(), { align: 'center', underline: true })
        .fontSize(10)
        .text(`CNPJ: ${config.cnpj}`, { align: 'center' })
        .text(`Endereço: ${config.logradouro}, ${config.numero} - ${config.bairro}`, { align: 'center' })
        .text(`${config.cidade} - ${config.uf}`, { align: 'center' })
        .text(`Telefone: ${config.telefone} | Email: ${config.email}`, { align: 'center' })
        .moveDown(1);

      // Informações da Comanda
      doc
        .fontSize(12)
        .text(`Comanda da Mesa: ${comanda.mesa?.numeroMesa || 'N/A'}`, { align: 'left' })
        .text(`Ambiente: ${comanda.mesa?.ambiente?.nome || 'N/A'}`, { align: 'left' })
        .text(`Garçom: ${comanda.mesa?.garcomId?.nome || 'Desconhecido'}`, { align: 'left' })
        .text(`Data da Finalização: ${new Date(comanda.dataFinalizacao).toLocaleString('pt-BR')}`, { align: 'left' })
        .moveDown(1);

      // Separador
      doc
        .strokeColor('#000')
        .lineWidth(0.5)
        .moveTo(10, doc.y)
        .lineTo(width - 10, doc.y)
        .stroke()
        .moveDown(1);

      // Tabela de Itens
      doc
        .fontSize(12)
        .text('Itens:', { underline: true })
        .moveDown(0.5);

      // Cabeçalhos da Tabela
      doc
        .fontSize(10)
        .text('Quantidade', 10, doc.y, { continued: true })
        .text('Descrição', 60, doc.y, { continued: true })
        .text('Preço Unit.', 160, doc.y, { continued: true })
        .text('Subtotal', 220, doc.y)
        .moveDown(0.5);

      // Adicionar linhas da tabela
      let subtotal = 0;
      (comanda.orders || []).forEach((pedido) => {
        (pedido.itens || []).forEach((item) => {
          const qtde = item.quantidade || 0;
          const descricao = item.product?.nome || 'N/A';
          const precoUnit = item.product?.preco || 0;
          const subtotalItem = qtde * precoUnit;
          subtotal += subtotalItem;

          doc
            .fontSize(10)
            .text(qtde, 10, doc.y, { width: 40 })
            .text(descricao, 60, doc.y, { width: 100 })
            .text(`R$ ${precoUnit.toFixed(2)}`, 160, doc.y, { width: 60, align: 'right' })
            .text(`R$ ${subtotalItem.toFixed(2)}`, 220, doc.y, { align: 'right' });
        });
      });

      doc.moveDown(1);

      // Resumo de Valores
      doc
        .fontSize(10)
        .text(`Subtotal: R$ ${subtotal.toFixed(2)}`, { align: 'right' });

      // Taxa de Serviço
      const taxaServico = comanda.valorTaxaServico || 0;
      doc
        .text(`Taxa de Serviço: R$ ${taxaServico.toFixed(2)}`, { align: 'right' });

      // Total Geral
      const totalGeral = subtotal + taxaServico;
      doc
        .fontSize(12)
        .text(`Total Geral: R$ ${totalGeral.toFixed(2)}`, { align: 'right' })
        .moveDown(1);

      // Descontos, se houver
      if (comanda.tipoDesconto && comanda.valorDesconto) {
        let descontoTexto = '';
        if (comanda.tipoDesconto === 'porcentagem') {
          descontoTexto = `Desconto: ${comanda.valorDesconto}%`;
          subtotal -= subtotal * (comanda.valorDesconto / 100);
        } else if (comanda.tipoDesconto === 'valor') {
          descontoTexto = `Desconto: R$ ${comanda.valorDesconto.toFixed(2)}`;
          subtotal -= comanda.valorDesconto;
        }

        doc
          .fontSize(10)
          .text(descontoTexto, { align: 'right' });

        // Atualizar Total Final após desconto
        doc
          .fontSize(12)
          .text(`Total Final: R$ ${subtotal.toFixed(2)}`, { align: 'right' })
          .moveDown(1);
      }

      // Forma de Pagamento
      const formaPagamentoTexto = Array.isArray(comanda.formaPagamento)
        ? comanda.formaPagamento.join(', ')
        : comanda.formaPagamento;
      doc.text(`Forma de Pagamento: ${formaPagamentoTexto}`, { align: 'left' });

      // Rodapé com mensagem de agradecimento
      doc
        .moveDown(2)
        .fontSize(10)
        .text('Obrigado pela preferência!', { align: 'center' });

      // Observações, se houver
      if (config.observacoes) {
        doc
          .moveDown(1)
          .fontSize(8)
          .text(config.observacoes, { align: 'center' });
      }

      doc.end();

      writeStream.on('finish', () => {
        // Retorna o caminho relativo para servir via express static
        const relativePath = `/comandas/${fileName}`;
        resolve(relativePath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};


// Exporta todas as funções como um objeto
module.exports = {
  createSalesGoalsPDF,
  createFinalizedPDF,
  createConferencePDF,
  createInvoice,
};
