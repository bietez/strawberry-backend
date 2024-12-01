// controllers/tableController.js
const Table = require('../models/Table');
const Ambiente = require('../models/Ambiente');
const FinalizedTable = require('../models/FinalizedTable');

exports.createTable = async (req, res) => {
  try {
    const { numeroMesa, ambienteId, position, numeroAssentos } = req.body;

    // Verificar se o ambiente existe
    const ambiente = await Ambiente.findById(ambienteId);
    if (!ambiente) {
      return res.status(404).json({ message: 'Ambiente não encontrado' });
    }

    // Criar os assentos dinamicamente
    const assentos = [];
    for (let i = 1; i <= numeroAssentos; i++) {
      assentos.push({ numeroAssento: i });
    }

    const table = new Table({
      numeroMesa,
      ambiente: ambienteId,
      position,
      assentos,
    });

    await table.save();
    res.status(201).json({ message: 'Mesa criada com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar mesa', error: error.message });
  }
};

exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find().populate('ambiente');
    res.json(tables);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter mesas', error: error.message });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const updates = req.body;

    // Verificar se o novo ambiente existe, se for atualizado
    if (updates.ambiente) {
      const ambiente = await Ambiente.findById(updates.ambiente);
      if (!ambiente) {
        return res.status(404).json({ message: 'Ambiente não encontrado' });
      }
    }

    // Atualizar assentos se o número for alterado
    if (updates.numeroAssentos) {
      const assentos = [];
      for (let i = 1; i <= updates.numeroAssentos; i++) {
        assentos.push({ numeroAssento: i });
      }
      updates.assentos = assentos;
    }

    const table = await Table.findByIdAndUpdate(tableId, updates, { new: true });
    res.json({ message: 'Mesa atualizada com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar mesa', error: error.message });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await Table.findByIdAndDelete(tableId);
    if (!table) return res.status(404).json({ message: 'Mesa não encontrada' });
    res.json({ message: 'Mesa excluída com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir mesa', error: error.message });
  }
};

// Atualizar o status da mesa (pode ser usada por Garçom ou Gerente)
exports.updateTableStatus = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { status } = req.body;

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada' });
    }

    if (status === 'DISPONIVEL' && table.status !== 'FINALIZADA') {
      return res.status(400).json({ message: 'Mesa só pode ser marcada como DISPONIVEL após ser finalizada' });
    }

    table.status = status;
    await table.save();
    res.status(200).json({ message: 'Status da mesa atualizado com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar status da mesa', error: error.message });
  }
};

// Finalizar mesa após o pagamento (apenas Gerente)
exports.finalizeTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    const table = await Table.findById(tableId);

    if (!table || table.status !== 'OCUPADA') {
      return res.status(400).json({ message: 'Mesa não está ocupada ou não encontrada' });
    }

    // Criar registro de mesa finalizada
    const finalizedTable = new FinalizedTable({
      numeroMesa: table.numeroMesa,
      ambienteId: table.ambienteId,
      garcomId: table.garcomId,
      pedidos: table.pedidos,
      valorTotal: table.valorTotal,
    });

    await finalizedTable.save();

    // Resetar mesa para disponibilidade
    table.status = 'DISPONIVEL';
    table.garcomId = null;
    table.pedidos = [];
    table.valorTotal = 0;

    await table.save();
    res.status(200).json({ message: 'Mesa finalizada com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao finalizar mesa', error: error.message });
  }
};
