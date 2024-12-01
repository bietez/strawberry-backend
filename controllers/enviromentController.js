// controllers/environmentController.js
const Environment = require('../models/Ambiente');

exports.createEnvironment = async (req, res) => {
  try {
    const { nome, limitePessoas } = req.body;
    const environment = new Environment({ nome, limitePessoas });
    await environment.save();
    res.status(201).json({ message: 'Ambiente criado com sucesso', environment });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Nome do ambiente já está em uso.' });
    }
    res.status(400).json({ message: 'Erro ao criar ambiente', error: error.message });
  }
};

exports.getEnvironments = async (req, res) => {
  try {
    const environments = await Environment.find();
    res.json(environments);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter ambientes', error: error.message });
  }
};

exports.updateEnvironment = async (req, res) => {
  try {
    const { nome, limitePessoas } = req.body;
    const environment = await Environment.findByIdAndUpdate(
      req.params.id,
      { nome, limitePessoas },
      { new: true, runValidators: true }
    );
    if (!environment) return res.status(404).json({ message: 'Ambiente não encontrado' });
    res.json({ message: 'Ambiente atualizado com sucesso', environment });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar ambiente', error: error.message });
  }
};

exports.deleteEnvironment = async (req, res) => {
  try {
    const environment = await Environment.findByIdAndDelete(req.params.id);
    if (!environment) return res.status(404).json({ message: 'Ambiente não encontrado' });
    res.json({ message: 'Ambiente excluído com sucesso' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir ambiente', error: error.message });
  }
};
