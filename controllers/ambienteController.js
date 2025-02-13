// Conteúdo de: .\controllers\ambienteController.js
// controllers/ambienteController.js
const Ambiente = require('../models/Ambiente');

exports.createAmbiente = async (req, res) => {
  try {
    const { nome, limitePessoas, order } = req.body;

    // Se não for fornecido um valor para 'order', atribuir o próximo número
    let ambienteOrder = order;
    if (order === undefined || order === null) {
      const lastAmbiente = await Ambiente.findOne().sort({ order: -1 });
      ambienteOrder = lastAmbiente ? lastAmbiente.order + 1 : 1;
    } else {
      // Ajustar a ordem dos outros ambientes
      await Ambiente.updateMany(
        { order: { $gte: order } },
        { $inc: { order: 1 } }
      );
    }

    const ambiente = new Ambiente({
      nome,
      limitePessoas,
      order: ambienteOrder,
    });

    await ambiente.save();
    res.status(201).json(ambiente);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar ambiente', error: error.message });
  }
};

exports.getAmbientes = async (req, res) => {
  try {
    const ambientes = await Ambiente.find().sort({ order: 1 }); // Ordena por campo 'order'
    res.json(ambientes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter ambientes', error: error.message });
  }
};

exports.updateAmbiente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, limitePessoas, order } = req.body;

    const ambiente = await Ambiente.findById(id);
    if (!ambiente) return res.status(404).json({ message: 'Ambiente não encontrado' });

    // Se o 'order' está sendo atualizado
    if (order !== undefined && order !== ambiente.order) {
      if (order > ambiente.order) {
        // Decrementar a ordem dos ambientes entre o antigo e o novo
        await Ambiente.updateMany(
          { order: { $gt: ambiente.order, $lte: order } },
          { $inc: { order: -1 } }
        );
      } else {
        // Incrementar a ordem dos ambientes entre o novo e o antigo
        await Ambiente.updateMany(
          { order: { $gte: order, $lt: ambiente.order } },
          { $inc: { order: 1 } }
        );
      }
      ambiente.order = order;
    }

    if (nome) ambiente.nome = nome;
    if (limitePessoas !== undefined) ambiente.limitePessoas = limitePessoas;

    await ambiente.save();
    res.json({ message: 'Ambiente atualizado com sucesso', ambiente });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar ambiente', error: error.message });
  }
};

exports.deleteAmbiente = async (req, res) => {
  try {
    const { id } = req.params;
    const ambiente = await Ambiente.findByIdAndDelete(id);
    if (!ambiente) return res.status(404).json({ message: 'Ambiente não encontrado' });

    // Decrementar a ordem dos ambientes com ordem maior que o deletado
    await Ambiente.updateMany(
      { order: { $gt: ambiente.order } },
      { $inc: { order: -1 } }
    );

    res.json({ message: 'Ambiente excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir ambiente', error: error.message });
  }
};

exports.updateAmbienteOrder = async (req, res) => {
  try {
    const { orderedAmbientes } = req.body; // Array de IDs em ordem desejada

    if (!Array.isArray(orderedAmbientes)) {
      return res.status(400).json({ message: 'orderedAmbientes deve ser um array de IDs.' });
    }

    for (let i = 0; i < orderedAmbientes.length; i++) {
      await Ambiente.findByIdAndUpdate(orderedAmbientes[i], { order: i + 1 });
    }

    res.json({ message: 'Ordem dos ambientes atualizada com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar ordem dos ambientes', error: error.message });
  }
};