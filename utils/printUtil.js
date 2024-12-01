// utils/printUtil.js
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

exports.printOrder = (order) => {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: 'tcp://192.168.0.100', // IP da impressora na cozinha
  });

  printer.println('--- Novo Pedido ---');
  printer.println(`Pedido ID: ${order._id}`);
  printer.println(`Data: ${new Date(order.dataCriacao).toLocaleString()}`);

  order.itens.forEach((item) => {
    printer.println(`${item.quantidade}x ${item.produto.nome}`);
  });

  printer.println(`Total: R$ ${order.total.toFixed(2)}`);
  printer.cut();

  try {
    printer.execute();
    console.log('Pedido enviado para impressão');
  } catch (error) {
    console.error('Erro ao imprimir pedido:', error);
  }
};
