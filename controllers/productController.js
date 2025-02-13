// controllers/productController.js

const Product = require('../models/Product');
const Category = require('../models/Category');

// Função para normalizar o nome (sem acentos e em minúsculas)
const normalizeName = (name) => {
  return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// Criar Produto
exports.createProduct = async (req, res) => {
  try {
    const { nome, categoria, preco, descricao, disponivel, quantidadeEstoque, imagem } = req.body;

    const nomeNormalizado = normalizeName(nome);

    // Verificar se já existe um produto com o mesmo nomeNormalizado
    const existingProduct = await Product.findOne({ nomeNormalizado });
    if (existingProduct) {
      return res.status(400).json({ message: `Já existe um produto com o nome "${nome}".` });
    }

    const newProduct = new Product({
      nome,
      nomeNormalizado,
      categoria,
      preco,
      descricao,
      disponivel,
      quantidadeEstoque,
      imagem, // Incluído no processo de criação
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Verificar Duplicidade de Nome
exports.checkNomeDuplicado = async (req, res) => {
  try {
    const { nome } = req.params;
    const nomeNormalizado = normalizeName(nome);

    const existingProduct = await Product.findOne({ nomeNormalizado });
    if (existingProduct) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao verificar duplicidade de nome', error: error.message });
  }
};

// Obter todos os produtos - requer a permissão 'viewProduct'
exports.getProducts = async (req, res) => {
  try {
    // Ordenar por quantidadeEstoque em ordem crescente (1)
    const products = await Product.find()
      .populate('categoria')
      .sort({ quantidadeEstoque: 1 }); 

    res.json(products);
  } catch (error) {
    res.status(400).json({
      message: 'Erro ao obter produtos',
      error: error.message,
    });
  }
};

// Obter produto por ID - requer a permissão 'viewProduct'
exports.getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate('categoria');
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter produto', error: error.message });
  }
};

// Atualizar produto - requer a permissão 'editProduct'
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { nome, categoria, preco, descricao, disponivel, quantidadeEstoque, imagem } = req.body;

    let updateData = {
      categoria,
      preco,
      descricao,
      disponivel,
      quantidadeEstoque,
      imagem,
    };

    if (nome) {
      const nomeNormalizado = normalizeName(nome);
      // Verificar se já existe outro produto com o mesmo nomeNormalizado
      const existingProduct = await Product.findOne({ nomeNormalizado, _id: { $ne: productId } });
      if (existingProduct) {
        return res.status(400).json({ message: `Já existe um produto com o nome "${nome}".` });
      }
      updateData.nome = nome;
      updateData.nomeNormalizado = nomeNormalizado;
    }

    // Se a imagem não foi fornecida, não atualize o campo
    if (!imagem) {
      delete updateData.imagem;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    ).populate('categoria');

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Deletar produto - requer a permissão 'deleteProduct'
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByIdAndDelete(productId);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json({ message: 'Produto excluído com sucesso', product });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir produto', error: error.message });
  }
};

// **NOVO MÉTODO PARA PAGINAÇÃO, PESQUISA E ORDENAÇÃO**
exports.getProductsAdvanced = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10, // Número de itens por página
      search = '',
      sort = 'nome',
      order = 'asc',
    } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    // Validação dos campos de ordenação
    const allowedSortFields = ['nome', 'preco', 'quantidadeEstoque', 'disponivel']; // Adicione outros campos conforme necessário
    if (!allowedSortFields.includes(sort)) {
      return res.status(400).json({
        message: `Campo de ordenação inválido. Campos permitidos: ${allowedSortFields.join(', ')}`,
      });
    }

    if (!['asc', 'desc'].includes(order.toLowerCase())) {
      return res.status(400).json({
        message: 'Ordem de ordenação inválida. Valores permitidos: asc, desc',
      });
    }

    // Construção do filtro de pesquisa
    const query = search
      ? {
          $or: [
            { nome: { $regex: search, $options: 'i' } },
            { descricao: { $regex: search, $options: 'i' } },
            // Adicione outros campos para pesquisa, se necessário
          ],
        }
      : {};

    // Contagem total de produtos que correspondem ao filtro
    const totalProducts = await Product.countDocuments(query);

    // Cálculo do número total de páginas
    const totalPages = Math.ceil(totalProducts / limitNumber);

    // Configuração de ordenação
    const sortOption = {};
    sortOption[sort] = order.toLowerCase() === 'asc' ? 1 : -1;

    // Busca dos produtos com paginação e ordenação
    const products = await Product.find(query)
      .populate('categoria')
      .sort(sortOption)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.json({ products, totalPages });
  } catch (error) {
    console.error('Erro ao obter produtos avançados:', error);
    res.status(400).json({ message: 'Erro ao obter produtos', error: error.message });
  }
};
