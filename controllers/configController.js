  // cash-register-backend/controllers/configController.js
  const Config = require('../models/Config');

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
        logradouro,
        numero,
        bairro,
        cidade,
        uf,
        telefone,
        email,
        taxaServico,
        site,
        observacoes
      } = req.body;

      let logotipo = '';
      if (req.file) {
        // Cria URL completa
        const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
        logotipo = imageUrl;
      } else {
        // Poderia ter um placeholder
        logotipo = 'https://via.placeholder.com/150';
      }

      const config = new Config({
        logotipo,
        razaoSocial,
        cnpj,
        ie,
        logradouro,
        numero,
        bairro,
        cidade,
        uf,
        telefone,
        email,
        taxaServico: taxaServico !== undefined ? taxaServico : 10,
        site,
        observacoes
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
        return res.status(404).json({ message: 'Nenhuma configuração encontrada. Crie uma configuração primeiro.' });
      }

      // Atualiza apenas campos enviados
      const campos = [
        'razaoSocial', 'cnpj', 'ie', 'logradouro', 'numero', 'bairro',
        'cidade', 'uf', 'telefone', 'email', 'taxaServico', 'site', 'observacoes'
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
