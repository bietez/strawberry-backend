/* const express = require('express');
const router = express.Router();
const printer = require('printer'); // Importa a biblioteca printer

router.get('/printers', (req, res) => {
  try {
    const printers = printer.getPrinters(); // Obtém impressoras disponíveis
    const printerNames = printers.map((p) => p.name); // Apenas os nomes
    res.json(printerNames); // Retorna como JSON
  } catch (error) {
    console.error('Erro ao obter impressoras:', error);
    res.status(500).json({ message: 'Erro ao obter impressoras disponíveis' });
  }
}); */