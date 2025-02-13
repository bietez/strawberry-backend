// controllers/lancamentoController.js
const Lancamento = require('../models/Lancamento');

/**
 * Lista lançamentos com filtros e paginação
 * 
 * 
 * 
 */

exports.listarCategorias = async (req, res) => {
  try {
    // Se quiser, pode filtrar por tipo=? ou parent=? via query
    const { tipo, parent } = req.query;
    const query = {};

    if (tipo) {
      query.tipo = tipo; // 'Receita' ou 'Despesa'
    }
    if (parent === 'null') {
      // caso queira buscar apenas as categorias raiz
      query.parent = null;
    } else if (parent) {
      // se mandar ?parent=xxx
      query.parent = parent;
    }

    // Populate no 'parent' se quiser exibir nome do pai
    const categorias = await Categoria.find(query).populate('parent', 'nome tipo').sort({ nome: 1 });

    res.json(categorias);
  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    res.status(500).json({ message: 'Erro interno ao listar categorias.' });
  }
};

exports.criarCategoria = async (req, res) => {
  try {
    const { nome, tipo, parent } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({ message: 'Nome e tipo são obrigatórios.' });
    }

    const nova = new Categoria({
      nome,
      tipo,
      parent: parent || null
    });
    await nova.save();

    res.json({ message: 'Categoria criada com sucesso!', categoria: nova });
  } catch (err) {
    console.error('Erro ao criar categoria:', err);
    res
      .status(500)
      .json({ message: 'Erro interno ao criar categoria.', error: err.message });
  }
};

exports.editarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo, parent } = req.body;

    const atualizada = await Categoria.findByIdAndUpdate(
      id,
      { nome, tipo, parent: parent || null },
      { new: true }
    );

    if (!atualizada) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    res.json({
      message: 'Categoria atualizada!',
      categoria: atualizada
    });
  } catch (err) {
    console.error('Erro ao editar categoria:', err);
    res
      .status(500)
      .json({ message: 'Erro interno ao editar categoria.', error: err.message });
  }
};

exports.excluirCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    // Se tiver subcategorias, você pode decidir se deleta em cascata ou bloqueia.
    // Exemplo simples: remove a principal e as filhas definem `parent = null`?
    // Aqui, apenas vai checar se existem filhas
    const subcategorias = await Categoria.find({ parent: id });
    if (subcategorias.length > 0) {
      return res.status(400).json({
        message: 'Não é possível excluir pois há subcategorias associadas.'
      });
    }

    const removida = await Categoria.findByIdAndDelete(id);
    if (!removida) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    res.json({ message: 'Categoria excluída com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir categoria:', err);
    res
      .status(500)
      .json({ message: 'Erro interno ao excluir categoria.', error: err.message });
  }
};

exports.listarLancamentos = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      search = '',
      tipo,
      status,
      dataInicial,
      dataFinal,
      clienteFornecedor,
      categoria,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    if (tipo && ['Receita', 'Despesa'].includes(tipo)) {
      query.tipo = tipo;
    }

    if (status && ['aberto', 'pago', 'cancelado'].includes(status)) {
      query.status = status;
    }

    if (dataInicial || dataFinal) {
      query.data = {};
      if (dataInicial) {
        query.data.$gte = new Date(dataInicial);
      }
      if (dataFinal) {
        query.data.$lte = new Date(dataFinal);
      }
    }

    if (clienteFornecedor && clienteFornecedor.trim() !== '') {
      query.clienteFornecedor = new RegExp(clienteFornecedor.trim(), 'i');
    }

    if (search && search.trim() !== '') {
      query.descricao = new RegExp(search.trim(), 'i');
    }

    if (categoria && categoria.trim() !== '') {
      query.categoria = categoria; // Assume que 'categoria' é o ObjectId
    }

    const total = await Lancamento.countDocuments(query);

    const lancamentos = await Lancamento.find(query)
      .populate({
        path: 'categoria',
        populate: { path: 'parent', select: 'nome tipo' }
      })
      .sort({ data: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      lancamentos,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Erro ao listar lançamentos:', error);
    res.status(500).json({ message: 'Erro interno ao listar lançamentos.' });
  }
};

/**
 * Cria um novo lançamento
 */
exports.criarLancamento = async (req, res) => {
  try {
    const novo = new Lancamento(req.body);
    await novo.save();
    res.json({
      message: 'Lançamento criado com sucesso!',
      lancamento: novo,
    });
  } catch (error) {
    console.error('Erro ao criar lançamento:', error);
    res.status(500).json({ message: 'Erro interno ao criar lançamento.' });
  }
};

/**
 * Obtém 1 lançamento específico
 */
exports.obterLancamento = async (req, res) => {
  try {
    const { id } = req.params;
    const lancamento = await Lancamento.findById(id);
    if (!lancamento) {
      return res.status(404).json({ message: 'Lançamento não encontrado.' });
    }
    res.json(lancamento);
  } catch (error) {
    console.error('Erro ao obter lançamento:', error);
    res.status(500).json({ message: 'Erro interno ao obter lançamento.' });
  }
};

/**
 * Atualiza lançamento existente
 */
exports.atualizarLancamento = async (req, res) => {
  try {
    const { id } = req.params;
    const atualizado = await Lancamento.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!atualizado) {
      return res.status(404).json({ message: 'Lançamento não encontrado.' });
    }
    res.json({
      message: 'Lançamento atualizado!',
      lancamento: atualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error);
    res.status(500).json({ message: 'Erro interno ao atualizar lançamento.' });
  }
};

/**
 * Exclui lançamento existente
 */
exports.excluirLancamento = async (req, res) => {
  try {
    const { id } = req.params;
    const removido = await Lancamento.findByIdAndDelete(id);
    if (!removido) {
      return res.status(404).json({ message: 'Lançamento não encontrado.' });
    }
    res.json({ message: 'Lançamento excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir lançamento:', error);
    res.status(500).json({ message: 'Erro interno ao excluir lançamento.' });
  }
};

/**
 * Retorna um sumário (totalReceitas, totalDespesas, saldo)
 */
exports.resumoLancamentos = async (req, res) => {
  try {
    let { dataInicial, dataFinal } = req.query;
    const query = {};

    if (dataInicial || dataFinal) {
      query.data = {};
      if (dataInicial) {
        query.data.$gte = new Date(dataInicial);
      }
      if (dataFinal) {
        query.data.$lte = new Date(dataFinal);
      }
    }

    const lista = await Lancamento.find(query);
    const totalReceitas = lista
      .filter((l) => l.tipo === 'Receita')
      .reduce((acc, cur) => acc + (cur.valor ?? 0), 0);
    const totalDespesas = lista
      .filter((l) => l.tipo === 'Despesa')
      .reduce((acc, cur) => acc + (cur.valor ?? 0), 0);
    const saldo = totalReceitas - totalDespesas;

    res.json({
      totalReceitas,
      totalDespesas,
      saldo,
    });
  } catch (error) {
    console.error('Erro ao obter resumo de lançamentos:', error);
    res.status(500).json({ message: 'Erro interno ao obter resumo.' });
  }
};
exports.checkDuplicate = async (req, res) => {
  try {
    const { importId } = req.query;
    if (!importId) {
      return res.json({ found: false });
    }
    const existe = await Lancamento.findOne({ importId });
    if (existe) {
      return res.json({ found: true });
    }
    res.json({ found: false });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno ao checar duplicidade.' });
  }
};