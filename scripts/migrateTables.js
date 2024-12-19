// scripts/migrateTables.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Configura o dotenv para carregar as variáveis de ambiente do arquivo .env na pasta pai
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Importa os modelos necessários
const Table = require('../models/Table');       // Ajuste o caminho se necessário
const Ambiente = require('../models/Ambiente'); // Importação do modelo Ambiente

const mongoURI = process.env.MONGO_URI;

// Verifica se MONGO_URI está definido
if (!mongoURI) {
  console.error('A variável de ambiente MONGO_URI não está definida. Verifique o arquivo .env.');
  process.exit(1); // Encerra o script com erro
}

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Conectado ao MongoDB');

    try {
      const tables = await Table.find().populate('ambiente');
      console.log(`Encontradas ${tables.length} mesas para migração.`);

      for (const table of tables) {
        let needsUpdate = false;

        // Caso 1: Campo 'capacidade' ausente
        if (table.capacidade === undefined || table.capacidade === null) {
          table.capacidade = table.assentos.length;
          needsUpdate = true;
          console.log(`Mesa #${table.numeroMesa}: 'capacidade' adicionada com valor ${table.capacidade}.`);
        }

        // Caso 2: Campo 'capacidade' presente, mas 'assentos.length' não corresponde
        if (table.capacidade !== undefined && table.capacidade !== null) {
          if (table.assentos.length < table.capacidade) {
            // Adicionar assentos
            const currentAssentos = table.assentos.length;
            const assentosToAdd = table.capacidade - currentAssentos;
            for (let i = 1; i <= assentosToAdd; i++) {
              table.assentos.push({ numeroAssento: currentAssentos + i });
            }
            needsUpdate = true;
            console.log(`Mesa #${table.numeroMesa}: Adicionados ${assentosToAdd} assentos.`);
          } else if (table.assentos.length > table.capacidade) {
            // Remover assentos
            table.assentos = table.assentos.slice(0, table.capacidade);
            needsUpdate = true;
            console.log(`Mesa #${table.numeroMesa}: Removidos assentos além da capacidade.`);
          }
        }

        if (needsUpdate) {
          await table.save();
          console.log(`Mesa #${table.numeroMesa} atualizada com sucesso.`);
        } else {
          console.log(`Mesa #${table.numeroMesa} não precisa de atualização.`);
        }
      }

      console.log('Migração concluída.');
    } catch (error) {
      console.error('Erro durante a migração:', error);
    } finally {
      mongoose.disconnect();
    }

  })
  .catch(error => {
    console.error('Erro ao conectar ao MongoDB:', error);
  });
