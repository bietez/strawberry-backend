// controllers/queueController.js
const QueueEntry = require('../models/QueueEntry');
const Table = require('../models/Table');

/**
 * Função auxiliar para encontrar a primeira mesa livre
 * que tenha capacidade >= numberOfPeople.
 */
async function findAvailableTable(numberOfPeople) {
  return Table.findOne({
    status: 'livre',
    capacidade: { $gte: numberOfPeople }
  })
    .sort({ capacidade: 1 }) // Pega a mesa com menor capacidade suficiente
    .exec();
}

exports.createQueueEntry = async (req, res) => {
  try {
    const { name, numberOfPeople, contact, telefone } = req.body;


    const newEntry = new QueueEntry({
      name,
      numberOfPeople,
      contact: contact || '',
      telefone,
      // status: default "Aguardando"
    });
    await newEntry.save();

    // Tentar atribuir mesa de imediato
    const table = await findAvailableTable(numberOfPeople);
    if (table) {
      newEntry.assignedTable = table._id;
      newEntry.assignedAt = new Date();

      // Cálculo do tempo até conseguir mesa (em minutos)
      const diffMs = newEntry.assignedAt - newEntry.createdAt;
      newEntry.timeToAssign = Math.floor(diffMs / 60000);
      await newEntry.save();

      // Marca a mesa como ocupada
      table.status = 'ocupada';
      table.occupiedSince = new Date();
      await table.save();
    }

    res.status(201).json({
      message: 'Entrada criada na fila com sucesso',
      entry: newEntry
    });
  } catch (error) {
    console.error('Erro ao criar entrada na fila:', error);
    res.status(500).json({ message: 'Erro ao criar entrada na fila', error: error.message });
  }
};

/**
 * Achar a primeira mesa "livre" c/ capacidade >= numberOfPeople
 */
async function findAvailableTable(numberOfPeople) {
  return Table.findOne({
    status: 'livre',
    capacidade: { $gte: numberOfPeople }
  })
    .sort({ capacidade: 1 }) // Pega a mesa com a menor capacidade possível
    .exec();
}

exports.getAllQueueEntries = async (req, res) => {
  try {
    // Populate assignedTable para ver dados da mesa
    const entries = await QueueEntry.find({})
      .populate('assignedTable', 'numeroMesa status capacidade')
      .sort({ createdAt: 1 }); // Ordena pela criação

    res.json(entries);
  } catch (error) {
    console.error('Erro ao obter entradas da fila:', error);
    res.status(500).json({ message: 'Erro ao obter entradas da fila', error: error.message });
  }
};

exports.getQueueEntries = async (req, res) => {
  try {
    const { limit, page } = req.query;
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const parsedPage = page ? parseInt(page, 10) : 1;

    const skip = (parsedPage - 1) * parsedLimit;

    // Filtro para excluir reservas com status "Finalizado"
    const filter = { status: { $ne: 'Finalizado' } };

    const total = await QueueEntry.countDocuments(filter);
    const entries = await QueueEntry.find(filter)
      .populate('assignedTable', 'numeroMesa localizacao') // Inclua 'localizacao' no populate
      .sort({ createdAt: 1 }) // Ordena do mais antigo para o mais recente
      .skip(skip)
      .limit(parsedLimit);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(200).json({
      data: entries,
      total,
      totalPages,
      currentPage: parsedPage
    });
  } catch (error) {
    console.error('Erro ao obter fila:', error);
    res.status(500).json({ message: 'Erro ao obter fila', error: error.message });
  }
};

exports.updateQueueEntry = async (req, res) => {
  try {
    const { id } = req.params; // /api/queue/:id
    const { name, numberOfPeople, contact, telefone } = req.body;

    const entry = await QueueEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ message: 'Entrada não encontrada na fila.' });
    }

    // Atualiza dados básicos
    if (name !== undefined) entry.name = name;
    if (numberOfPeople !== undefined) entry.numberOfPeople = numberOfPeople;
    if (contact !== undefined) entry.contact = contact;
    if (telefone !== undefined) entry.telefone = telefone;
  

    // Se a entrada ainda não foi finalizada E não tem mesa atribuída,
    // podemos tentar atribuir agora (ou se alterou numberOfPeople)
    if (entry.status === 'Aguardando' && !entry.assignedTable) {
      // Tentar encontrar mesa livre
      const suitableTable = await findAvailableTable(entry.numberOfPeople);
      if (suitableTable) {
        entry.assignedTable = suitableTable._id;
        entry.assignedAt = new Date();

        // Calcula o tempo decorrido desde createdAt
        const diffMs = entry.assignedAt - entry.createdAt;
        entry.timeToAssign = Math.floor(diffMs / 60000);

        await entry.save();

        suitableTable.status = 'ocupada';
        suitableTable.occupiedSince = new Date();
        await suitableTable.save();
      }
    }

    await entry.save();
    res.json({ message: 'Entrada da fila atualizada', entry });
  } catch (error) {
    console.error('Erro ao atualizar entrada da fila:', error);
    res.status(500).json({ message: 'Erro ao atualizar entrada da fila', error: error.message });
  }
};

exports.finishQueueEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await QueueEntry.findById(id).populate('assignedTable');
    if (!entry) {
      return res.status(404).json({ message: 'Entrada não encontrada na fila.' });
    }

    // Já está finalizado? Sem problema, mas podemos checar
    if (entry.status === 'Finalizado') {
      return res.status(400).json({ message: 'Essa entrada já está finalizada.' });
    }

    // Define status como Finalizado
    entry.status = 'Finalizado';
    await entry.save();

    // Se tinha mesa atribuída, agora vamos liberar
    if (entry.assignedTable) {
      const table = entry.assignedTable;
      table.status = 'livre';
      await table.save();
    }

    res.json({ message: 'Entrada finalizada com sucesso', entry });
  } catch (error) {
    console.error('Erro ao finalizar entrada da fila:', error);
    res.status(500).json({ message: 'Erro ao finalizar entrada da fila', error: error.message });
  }
};

/**
 * Exclui a entrada da fila do banco.
 * Se estava usando uma mesa, libera essa mesa antes.
 */
exports.deleteQueueEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await QueueEntry.findById(id).populate('assignedTable');

    if (!entry) {
      return res.status(404).json({ message: 'Entrada não encontrada.' });
    }

    // Se estiver em uma mesa (assignedTable != null) e não estiver finalizada, libera a mesa
    if (entry.assignedTable && entry.status !== 'Finalizado') {
      const table = await Table.findById(entry.assignedTable._id);
      if (table) {
        table.status = 'livre';
        table.occupiedSince = null;
        await table.save();

        // (Opcional) atribuir próximo da fila
        const next = await findNextWaitingEntry(table.capacidade);
        if (next) {
          next.assignedTable = table._id;
          next.assignedAt = new Date();
          const diffMs = next.assignedAt - next.createdAt;
          next.timeToAssign = Math.floor(diffMs / 60000);
          await next.save();

          table.status = 'ocupada';
          table.occupiedSince = new Date();
          await table.save();
        }
      }
    }

    // Utilize findByIdAndDelete em vez de entry.remove()
    await QueueEntry.findByIdAndDelete(id);

    res.json({ message: 'Entrada removida da fila com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir entrada da fila:', error);
    res.status(500).json({ message: 'Erro ao excluir entrada da fila', error: error.message });
  }
};

/**
 * Função para encontrar a próxima entrada da fila que pode ser atribuída a uma mesa
 */
async function findNextWaitingEntry(tableCapacity) {
  return QueueEntry.findOne({
    status: 'Aguardando',
    assignedTable: null,
    numberOfPeople: { $lte: tableCapacity }
  })
    .sort({ createdAt: 1 }) // Prioriza a reserva mais antiga
    .exec();
}
