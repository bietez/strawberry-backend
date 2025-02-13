// cash-register-backend/controllers/configController.js
const Config = require('../models/Config'); 
const axios = require('axios');

exports.getConfig = async (req, res) => {
  try {
    const config = await Config.findOne();
    if (!config) {
      return res.status(404).json({ message: 'Nenhuma configuração encontrada. Crie uma configuração primeiro.' });
    }
    res.json(config);
  } catch (error) {
    console.error('Erro ao obter config:', error);
    res.status(500).json({ message: 'Erro interno ao obter configuração', error: error.message });
  }
};

exports.createConfig = async (req, res) => {
  try {
    const existe = await Config.findOne();
    if (existe) {
      return res.status(400).json({ message: 'Configuração já existe. Use PUT para atualizar.' });
    }

    const {
      razaoSocial,
      cnpj,
      ie,
      cep,
      logradouro,
      numero,
      bairro,
      cidade,
      uf,
      telefone,
      email,
      taxaServico,
      site,
      observacoes,
      darkMode,
      badgeColorScheme,
      nomeFantasia,
    } = req.body;

    let logotipo = '';
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
      logotipo = imageUrl;
    } else {
      logotipo = 'https://placehold.co/150';
    }

    const config = new Config({
      logotipo,
      razaoSocial,
      cnpj,
      ie,
      cep: cep || '',
      logradouro,
      numero,
      bairro,
      cidade,
      uf,
      telefone,
      email,
      taxaServico: taxaServico !== undefined ? taxaServico : 10,
      site,
      observacoes,
      badgeColorScheme,
      nomeFantasia,
      darkMode: !!darkMode,
    });

    await config.save();
    res.status(201).json({ message: 'Configuração criada com sucesso!', config });
  } catch (error) {
    console.error('Erro ao criar config:', error);
    res.status(500).json({ message: 'Erro interno ao criar configuração', error: error.message });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const config = await Config.findOne();
    if (!config) {
      return res.status(404).json({ message: 'Nenhuma configuração encontrada. Crie uma primeiro.' });
    }
    
    // Adicione "darkMode" na lista se quiser sobrescrevê-lo
    const campos = [
      'razaoSocial', 'cnpj', 'ie', 'cep', 'logradouro', 'numero', 'bairro',
      'cidade', 'uf', 'telefone', 'email', 'taxaServico', 'site',
      'observacoes', 'darkMode', 'nomeFantasia', 'badgeColorScheme'
    ];

    campos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        config[campo] = req.body[campo];
      }
    });

    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
      config.logotipo = imageUrl;
    }

    await config.save();
    res.json({ message: 'Configuração atualizada com sucesso!', config });
  } catch (error) {
    console.error('Erro ao atualizar config:', error);
    res.status(500).json({ message: 'Erro interno ao atualizar configuração', error: error.message });
  }
};

exports.getDraggable = async (req, res) => {
  try {
    const config = await Config.findOne();
    if (!config) {
      return res.status(404).json({ message: 'Config não encontrada.' });
    }
    // Retorna somente o campo "draggable"
    res.json({ draggable: config.draggable });
  } catch (error) {
    console.error('Erro ao buscar draggable:', error);
    res.status(500).json({ message: 'Erro interno ao buscar draggable', error: error.message });
  }
};

// Atualiza somente o "draggable"
exports.updateDraggable = async (req, res) => {
  try {
    const config = await Config.findOne();
    if (!config) {
      return res.status(404).json({ message: 'Config não encontrada.' });
    }
    // Espera { draggable: true/false } no body
    if (typeof req.body.draggable !== 'boolean') {
      return res.status(400).json({ message: 'É preciso enviar um booleano em "draggable".' });
    }

    config.draggable = req.body.draggable;
    await config.save();

    res.json({
      message: 'draggable atualizado com sucesso!',
      draggable: config.draggable
    });
  } catch (error) {
    console.error('Erro ao atualizar draggable:', error);
    res.status(500).json({ message: 'Erro interno ao atualizar draggable', error: error.message });
  }
};

exports.fetchCnpj = async (req, res) => {
  try {
    const { cnpj } = req.params; // /config/cnpj/:cnpj

    // Faz a chamada na API receitaws (o BACKEND que chama)
    const { data } = await axios.get(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
    return res.json(data); // repassa a resposta para o front
  } catch (error) {
    console.error('Erro ao buscar CNPJ na ReceitaWS:', error.message);

    // Se a receitaws retornar 429, 400, etc., podemos capturar:
    if (error.response && error.response.status === 429) {
      return res.status(429).json({ message: 'Too Many Requests na ReceitaWS' });
    }

    // Caso contrário:
    res.status(500).json({ message: 'Erro ao buscar dados do CNPJ', error: error.message });
  }
};
