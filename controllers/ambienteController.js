// Conteúdo de: .\controllers\ambienteController.js
// controllers/ambienteController.js
const Ambiente = require('../models/Ambiente');

exports.createAmbiente = async (req, res) => {
  try {
    const { nome, limitePessoas } = req.body;
    const ambiente = new Ambiente({ nome, limitePessoas });
    await ambiente.save();
    res.status(201).json({ message: 'Ambiente criado com sucesso', ambiente });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Já existe um ambiente com este nome.' });
    }
    res.status(400).json({ message: 'Erro ao criar ambiente', error: error.message });
  }
};

exports.getAmbientes = async (req, res) => {
  try {
    const ambientes = await Ambiente.find();
    res.json(ambientes);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter ambientes', error: error.message });
  }
};

exports.updateAmbiente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, limitePessoas } = req.body;
    const ambiente = await Ambiente.findByIdAndUpdate(
      id,
      { nome, limitePessoas },
      { new: true, runValidators: true }
    );
    if (!ambiente) return res.status(404).json({ message: 'Ambiente não encontrado' });
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
    res.json({ message: 'Ambiente excluído com sucesso' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir ambiente', error: error.message });
  }
};
