// controllers/finalizedTableController.js
const Table = require('../models/Table');
const FinalizedTable = require('../models/FinalizedTable');

exports.finalizeTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    // Encontrar a mesa pelo ID
    const table = await Table.findById(tableId);

    // Verificar se a mesa está ocupada
    if (!table || table.status !== 'OCUPADA') {
      return res.status(400).json({ message: 'Mesa não está ocupada ou não encontrada' });
    }

    // Criar um registro de mesa finalizada
    const finalizedTable = new FinalizedTable({
      numeroMesa: table.numeroMesa,
      ambienteId: table.ambienteId,
      garcomId: table.garcomId,
      pedidos: table.pedidos,
      valorTotal: table.valorTotal,
    });

    // Salvar o registro da mesa finalizada
    await finalizedTable.save();

    // Atualizar a mesa original para DISPONIVEL e limpar os dados
    table.status = 'DISPONIVEL';
    table.garcomId = null;
    table.pedidos = [];
    table.valorTotal = 0;

    // Salvar as alterações da mesa
    await table.save();

    res.status(200).json({ message: 'Mesa finalizada com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao finalizar mesa', error: error.message });
  }
};

exports.getFinalizedTables = async (req, res) => {
  try {
    const finalizedTables = await FinalizedTable.find().populate('ambienteId garcomId pedidos');
    res.json(finalizedTables);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter mesas finalizadas', error: error.message });
  }
};

exports.getFinalizedTableById = async (req, res) => {
  try {
    const { tableId } = req.params;
    const finalizedTable = await FinalizedTable.findById(tableId).populate('ambienteId garcomId pedidos');

    if (!finalizedTable) {
      return res.status(404).json({ message: 'Mesa finalizada não encontrada' });
    }

    res.json(finalizedTable);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter mesa finalizada', error: error.message });
  }
};
