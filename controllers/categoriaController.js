// controllers/categoriaController.js
const Categoria = require('../models/Categoria');

/**
 * Cria uma nova categoria
 * POST /categorias
 * Body esperado: { nome, tipo, parent? }
 */
exports.criarCategoria = async (req, res) => {
  try {
    let { nome, tipo, parent } = req.body; // <-- agora pegamos 'parent'

    if (!nome || !tipo) {
      return res.status(400).json({
        message: 'Campos nome e tipo são obrigatórios.',
      });
    }
    nome = nome.trim();

    // Verifica se 'tipo' é válido
    if (!['Receita', 'Despesa'].includes(tipo)) {
      return res
        .status(400)
        .json({ message: 'tipo inválido. Use "Receita" ou "Despesa".' });
    }

    let paiValido = null;
    if (parent) {
      // Verifica se o parent existe
      const catPai = await Categoria.findById(parent);
      if (!catPai) {
        return res.status(404).json({ message: 'Categoria pai não encontrada.' });
      }
      paiValido = catPai._id;
    }

    const novaCat = new Categoria({
      nome,
      tipo,
      parent: paiValido, // no schema está como "parent"
    });

    await novaCat.save();

    return res.status(201).json({
      message: 'Categoria criada com sucesso!',
      categoria: novaCat,
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);

    // Tratamento de índice único (nome,tipo,parent)
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Já existe categoria com este nome/tipo/(sub) para este pai.',
      });
    }
    return res
      .status(500)
      .json({ message: 'Erro interno ao criar categoria.' });
  }
};

exports.listarCategoriasArvore = async (req, res) => {
  try {
    // Busca todas as categorias
    const todas = await Categoria.find().lean();

    // 1) Cria um map { _id -> cat }
    const mapIdToCat = {};
    todas.forEach((cat) => {
      cat.children = []; // array para subcategorias
      mapIdToCat[cat._id] = cat;
    });

    // 2) Array raiz (categorias sem pai)
    const raiz = [];

    // 3) Para cada cat, se tiver parent, coloca no children do pai
    todas.forEach((cat) => {
      if (cat.parent) {
        // se cat.parent for um ObjectId, compare como string
        const pid = String(cat.parent);
        mapIdToCat[pid]?.children.push(cat);
      } else {
        raiz.push(cat);
      }
    });

    return res.json(raiz);
  } catch (error) {
    console.error('Erro ao listar categorias em árvore:', error);
    return res.status(500).json({ message: 'Erro interno ao listar categorias.' });
  }
};

exports.listarCategorias = async (req, res) => {
  try {
    let { sortBy, nome, tipo } = req.query;

    let sortObj = { tipo: 1, nome: 1 };

    if (sortBy) {
      if (sortBy.startsWith('-')) {
        sortObj = { [sortBy.substring(1)]: -1 };
      } else {
        sortObj = { [sortBy]: 1 };
      }
    }

    const filter = {};
    if (nome) {
      filter.nome = { $regex: new RegExp(`^${nome.trim()}$`, 'i') };
    }
    if (tipo) {
      filter.tipo = tipo.trim();
    }

    const categorias = await Categoria.find(filter)
      .sort(sortObj)
      .populate('parent', 'nome tipo');

    return res.json(categorias);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return res.status(500).json({ message: 'Erro interno ao listar categorias.' });
  }
};

/**
 * Lista categorias em formato de árvore (opcional).
 * GET /categorias/arvore
 */
exports.listarEmArvore = async (req, res) => {
  try {
    const todas = await Categoria.find().lean();
    // organiza em árvore
    const mapIdToCat = {};
    todas.forEach((cat) => {
      cat.subcategorias = [];
      mapIdToCat[cat._id] = cat;
    });

    // relaciona subcategorias
    const root = [];
    todas.forEach((cat) => {
      if (cat.parent) {
        // insere em subcategorias do pai
        const pai = mapIdToCat[cat.parent];
        if (pai) pai.subcategorias.push(cat);
      } else {
        root.push(cat);
      }
    });

    return res.json(root);
  } catch (error) {
    console.error('Erro ao listar em árvore:', error);
    return res.status(500).json({ message: 'Erro interno ao listar categorias.' });
  }
};

exports.atualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo, parent } = req.body;

    if (!nome || !tipo) {
      return res
        .status(400)
        .json({ message: 'Campos nome e tipo são obrigatórios.' });
    }
    const nomeTrimmed = nome.trim();

    if (!['Receita', 'Despesa'].includes(tipo)) {
      return res
        .status(400)
        .json({ message: 'tipo inválido. Use "Receita" ou "Despesa".' });
    }

    let paiValido = null;
    if (parent) {
      const catPai = await Categoria.findById(parent);
      if (!catPai) {
        return res
          .status(404)
          .json({ message: 'Categoria pai não encontrada.' });
      }
      paiValido = catPai._id;

      if (paiValido.toString() === id) {
        return res
          .status(400)
          .json({ message: 'Uma categoria não pode ser pai de si mesma.' });
      }
    }

    const editada = await Categoria.findByIdAndUpdate(
      id,
      { nome: nomeTrimmed, tipo, parent: paiValido },
      { new: true }
    );

    if (!editada) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    res.json({
      message: 'Categoria atualizada com sucesso!',
      categoria: editada,
    });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Já existe categoria com este nome/tipo/(sub) duplicado.',
      });
    }
    res
      .status(500)
      .json({ message: 'Erro interno ao atualizar categoria.', error: error.message });
  }
};

/**
 * Exclui uma categoria
 * DELETE /categorias/:id
 */
exports.excluirCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    // Se quiser excluir subcategorias em cascata,
    // ou realocar subcategorias, aqui é o local.
    // Exemplo simples: remove o parent delas (não exclui):
    await Categoria.updateMany({ parent: id }, { $set: { parent: null } });

    const removida = await Categoria.findByIdAndDelete(id);
    if (!removida) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    return res.json({ message: 'Categoria excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return res.status(500).json({ message: 'Erro interno ao excluir categoria.' });
  }
};
