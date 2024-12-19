const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

exports.printOrder = async (order) => {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: process.env.PRINTER_INTERFACE || 'tcp://192.168.0.100', // IP da impressora na cozinha
    options: {
      timeout: 1000
    }
  });

  printer.setTextDoubleHeight();
  printer.println('--- Novo Pedido ---');
  printer.setTextNormal();
  printer.println(`Pedido ID: ${order.orderNumber}`);
  printer.println(`Data: ${new Date(order.createdAt).toLocaleString()}`);

  printer.println('Itens:');
  order.itens.forEach((item) => {
    const nomeProduto = item.product ? item.product.nome : 'Produto Desconhecido';
    printer.println(`${item.quantidade}x ${nomeProduto}`);
  });

  printer.println(`Total: R$ ${order.total.toFixed(2)}`);
  printer.cut();

  try {
    await printer.execute();
    console.log('Pedido enviado para impressão');
  } catch (error) {
    console.error('Erro ao imprimir pedido:', error);
  }
};
