const mongoose = require('mongoose');
const Lancamento = require('../models/Lancamento');

exports.comparativoDRE = async (req, res) => {
  try {
    const { periodos } = req.body; // array de { label, dataInicial, dataFinal, categoriasSelecionadas }

    if (!periodos || !Array.isArray(periodos)) {
      return res
        .status(400)
        .json({ message: 'É necessário um array de periodos.' });
    }

    const resultado = [];

    for (const [index, p] of periodos.entries()) {
      const label = p.label || 'Período';
      // Converte as datas recebidas para Date e ajusta a dataFinal para incluir o dia inteiro
      const dataInicial = new Date(p.dataInicial);
      const dataFinal = new Date(p.dataFinal);
      dataFinal.setHours(23, 59, 59, 999);

      // Monta a query de datas
      const query = {
        data: {
          $gte: dataInicial,
          $lte: dataFinal,
        },
      };

      // Se houver categorias selecionadas, converte-as para ObjectId e acrescenta o filtro
      if (
        Array.isArray(p.categoriasSelecionadas) &&
        p.categoriasSelecionadas.length > 0
      ) {
        query.categoria = {
          $in: p.categoriasSelecionadas.map((id) => new mongoose.Types.ObjectId(id)),
        };
      }

      // Busca os lançamentos correspondentes – opcionalmente, populando a categoria para obter o nome
      const lancs = await Lancamento.find(query).populate('categoria');

      // Agrupa os lançamentos por categoria
      const lancsByCat = {};
      lancs.forEach((l) => {
        let catId, catNome;
        if (l.categoria && typeof l.categoria === 'object') {
          // Se a categoria estiver populada
          catId = String(l.categoria._id);
          catNome = l.categoria.nome;
        } else {
          catId = 'Sem Categoria';
          catNome = 'Sem Categoria';
        }
        if (!lancsByCat[catId]) {
          lancsByCat[catId] = { categoria: catNome, totalReceitas: 0, totalDespesas: 0, saldo: 0 };
        }
        if (l.tipo === 'Receita') {
          lancsByCat[catId].totalReceitas += l.valor || 0;
        } else if (l.tipo === 'Despesa') {
          lancsByCat[catId].totalDespesas += l.valor || 0;
        }
      });

      // Calcula o saldo por categoria
      Object.keys(lancsByCat).forEach((key) => {
        lancsByCat[key].saldo = lancsByCat[key].totalReceitas - lancsByCat[key].totalDespesas;
      });

      resultado.push({
        label,
        categorias: Object.values(lancsByCat), // array de objetos { categoria, totalReceitas, totalDespesas, saldo }
      });
    }

    return res.json({ periodos: resultado });
  } catch (error) {
    console.error('Erro ao gerar DRE comparativo:', error);
    return res
      .status(500)
      .json({ message: 'Erro interno ao gerar DRE comparativo.' });
  }
};
