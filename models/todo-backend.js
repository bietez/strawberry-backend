// Conteúdo de: .\Ambiente.js
const mongoose = require('mongoose');

const AmbienteSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  limitePessoas: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Ambiente', AmbienteSchema);


// Conteúdo de: .\AuditLog.js
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String }, // Para facilitar consultas
  action: { type: String, required: true },
  details: { type: Object }, // Pode armazenar detalhes adicionais sobre a ação
  timestamp: { type: Date, default: Date.now, index: true },
});

// Criar índice TTL no campo 'timestamp' para expirar documentos após 60 dias
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 }); // 60 dias em segundos

module.exports = mongoose.model('AuditLog', AuditLogSchema);


// Conteúdo de: .\Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  categoria: { type: String, required: true, unique: true },
  descricao: { type: String },
  habilitado: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);


// Conteúdo de: .\Comanda.js
// src/models/Comanda.js

const mongoose = require('mongoose');

const comandaSchema = new mongoose.Schema({
  mesa: { type: Number, required: true },
  pedidos: [{
    orderNumber: { type: Number, required: true },
    itens: [{
      quantidade: { type: Number, required: true },
      nome: { type: String, required: true },
      preco: { type: Number, required: true },
      total: { type: Number, required: true },
    }],
    total: { type: Number, required: true },
  }],
  valorTotal: { type: Number, required: true },
  tipoDesconto: { type: String, enum: ['nenhum', 'porcentagem', 'valor'], default: 'nenhum' },
  valorDesconto: { type: Number, default: 0 },
  totalComDesconto: { type: Number, required: true },
  formaPagamento: { type: String, enum: ['dinheiro', 'cartao', 'pix'], required: true },
  valorPago: { type: Number, required: true },
  troco: { type: Number, default: 0 },
  dataFinalizacao: { type: Date, default: Date.now },
  pdfPath: { type: String }, // Caminho do PDF gerado
}, { timestamps: true });

module.exports = mongoose.model('Comanda', comandaSchema);


// Conteúdo de: .\Config.js
// cash-register-backend/models/Config.js
const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  logotipo: { type: String, default: '' }, // URL completa da imagem do logotipo
  razaoSocial: { type: String, required: true },
  cnpj: { type: String, required: true, unique: true, match: /^\d{14}$/ },
  ie: { type: String, required: true },
  logradouro: { type: String, required: true },
  numero: { type: String, required: true },
  bairro: { type: String, required: true },
  cidade: { type: String, required: true },
  uf: { type: String, required: true },
  telefone: { type: String, required: true },
  email: { type: String, required: true, match: /.+\@.+\..+/ },
  taxaServico: { type: Number, default: 10 },
  site: { type: String, default: '' },
  observacoes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Config', ConfigSchema);


// Conteúdo de: .\Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  cpfCnpj: { type: String, unique: true, sparse: true, required: true }, // CPF ou CNPJ
  nome: { type: String, required: true },
  contato: { type: String }, // Novo campo
  telefone: { type: String },
  whatsapp: { type: String, required: true }, // Novo campo
  email: { type: String, unique: true, sparse: true },
  cep: { type: String }, // Novo campo
  rua: { type: String },
  numero: { type: String },
  complemento: { type: String },
  bairro: { type: String },
  cidade: { type: String },
  estado: { type: String },
  pontosFidelidade: { type: Number, default: 0 },
  historicoPedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
}, { timestamps: true });

// Cria índices únicos para campos 'cpfCnpj' e 'email'
customerSchema.index({ cpfCnpj: 1 }, { unique: true, sparse: true });
customerSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Customer', customerSchema);


// Conteúdo de: .\Employee.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const EmployeeSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  funcao: { type: String, required: true, enum: ['Garçom', 'Cozinheiro', 'Gerente'] },
  email: { type: String, unique: true, required: true, match: /.+\@.+\..+/ },
  senha: { type: String, required: true },
  permissoes: { type: [String], default: [] },
}, { timestamps: true });

// Cria índice único para o campo 'email'
EmployeeSchema.index({ email: 1 }, { unique: true });

// Hash da senha antes de salvar
EmployeeSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Método para comparar senha
EmployeeSchema.methods.comparePassword = async function (senha) {
  return await bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.model('Employee', EmployeeSchema);


// Conteúdo de: .\FinalizedOrder.js
// models/FinalizedOrder.js
const mongoose = require('mongoose');

const FinalizedOrderSchema = new mongoose.Schema({
  mesaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }], // pedidos finalizados dessa mesa
  garcom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  valorTotal: { type: Number, required: true },
  consumoPorAssento: [
    {
      assento: { type: String },
      valor: { type: Number, default: 0 },
    },
  ],
  dataFinalizacao: { type: Date, default: Date.now },
  ambienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambiente', required: true },
}, { timestamps: true });

module.exports = mongoose.model('FinalizedOrder', FinalizedOrderSchema);


// Conteúdo de: .\FinalizedTable.js
// src/models/FinalizedTable.js
const mongoose = require('mongoose');

const FinalizedTableSchema = new mongoose.Schema({
  numeroMesa: {
    type: Number,
    required: true,
  },
  ambienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambiente',
    required: true,
  },
  garcomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  valorTotal: {
    type: Number,
    required: true,
  },
  formaPagamento: { type: String, enum: ['dinheiro', 'cartao', 'pix'], default: 'dinheiro' },
  valorPago: { type: Number, default: 0 },
  tipoDesconto: { type: String, enum: ['nenhum', 'porcentagem', 'valor'], default: 'nenhum' },
  valorDesconto: { type: Number, default: 0 },
  dataFinalizacao: {
    type: Date,
    default: Date.now,
  },
  pdfPath: { type: String }, // Caminho do PDF gerado
}, { timestamps: true });

module.exports = mongoose.model('FinalizedTable', FinalizedTableSchema);


// Conteúdo de: .\IfoodToken.js
// controllers/ifoodAuthController.js
const axios = require('axios');
const qs = require('querystring');
const IfoodToken = require('../models/IfoodToken');
require('dotenv').config();

const IFOOD_CLIENT_ID = process.env.IFOOD_CLIENT_ID;
const IFOOD_CLIENT_SECRET = process.env.IFOOD_CLIENT_SECRET;
const IFOOD_USER_CODE_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/userCode';
const IFOOD_TOKEN_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';

// Iniciar o processo de autenticação
exports.startAuth = async (req, res) => {
  try {
    const response = await axios.post(
      IFOOD_USER_CODE_URL,
      qs.stringify({ clientId: IFOOD_CLIENT_ID }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const {
      userCode,
      authorizationCodeVerifier,
      verificationUrlComplete
    } = response.data;

    // Salvar temporariamente no session ou retornar ao frontend
    // Uma abordagem simples é retornar para o frontend e o frontend guardar em estado local.
    req.session.authorizationCodeVerifier = authorizationCodeVerifier;

    return res.json({
      userCode,
      verificationUrlComplete
    });
  } catch (error) {
    console.error('Erro ao iniciar autenticação com iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao iniciar autenticação com iFood.' });
  }
};

// Concluir autenticação com o código de autorização
exports.completeAuth = async (req, res) => {
  try {
    const { authorizationCode } = req.body;
    const authorizationCodeVerifier = req.session.authorizationCodeVerifier;
    if (!authorizationCodeVerifier) {
      return res.status(400).json({ message: 'Faltando authorizationCodeVerifier na sessão.' });
    }

    const payload = {
      grantType: 'authorization_code',
      clientId: IFOOD_CLIENT_ID,
      clientSecret: IFOOD_CLIENT_SECRET,
      authorizationCode: authorizationCode,
      authorizationCodeVerifier: authorizationCodeVerifier
    };

    const response = await axios.post(
      IFOOD_TOKEN_URL,
      qs.stringify(payload),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { accessToken, refreshToken, expiresIn } = response.data;

    // Salvar no banco de dados
    await IfoodToken.deleteMany({});
    const token = new IfoodToken({ accessToken, refreshToken, expiresIn });
    await token.save();

    // Limpar a session
    req.session.authorizationCodeVerifier = null;

    return res.json({ message: 'Autenticação concluída com sucesso!', accessToken });
  } catch (error) {
    console.error('Erro ao concluir autenticação com iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao concluir autenticação com o iFood.' });
  }
};

// Obter status da autenticação (se há token válido)
exports.getStatus = async (req, res) => {
  const token = await IfoodToken.findOne({});
  if (!token) {
    return res.json({ authenticated: false, message: 'Nenhum token armazenado' });
  }

  const expired = token.isExpired();
  return res.json({ authenticated: !expired, expired });
};

// Função para refresh do token (se houver refreshToken)
exports.refreshToken = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || !token.refreshToken) {
      return res.status(400).json({ message: 'Não há refreshToken para renovar o token.' });
    }

    const payload = {
      grantType: 'refresh_token',
      clientId: IFOOD_CLIENT_ID,
      clientSecret: IFOOD_CLIENT_SECRET,
      refreshToken: token.refreshToken
    };

    const response = await axios.post(
      IFOOD_TOKEN_URL,
      qs.stringify(payload),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { accessToken, refreshToken, expiresIn } = response.data;

    token.accessToken = accessToken;
    if (refreshToken) token.refreshToken = refreshToken;
    token.expiresIn = expiresIn;
    token.createdAt = new Date();

    await token.save();

    return res.json({ message: 'Token renovado com sucesso!', accessToken });
  } catch (error) {
    console.error('Erro ao renovar token do iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao renovar token do iFood.' });
  }
};

// Exemplo de rota para testar integração (obter lista de pedidos)
exports.getOrders = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || token.isExpired()) {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }

    // Exemplo de chamada a algum endpoint do iFood (alterar para endpoint real de pedidos)
    // Documentação do iFood: precisará definir endpoint correto.
    const ordersUrl = 'https://merchant-api.ifood.com.br/order/v1.0/orders';
    const response = await axios.get(ordersUrl, {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`
      }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Erro ao obter pedidos do iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao obter pedidos do iFood.' });
  }
};


// Conteúdo de: .\Ingredient.js
// models/Ingredient.js
const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  unidadeMedida: { type: String, required: true }, // Ex: kg, g, l, etc.
  quantidadeEstoque: { type: Number, required: true, default: 0 },
  precoCusto: { type: Number, required: true },
  imagem: { type: String, default: 'https://via.placeholder.com/150' }, // Novo campo de imagem
}, { timestamps: true });

module.exports = mongoose.model('Ingredient', IngredientSchema);


// Conteúdo de: .\Invoice.js
const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  numeroFatura: { type: String, required: true, unique: true },
  dataEmissao: { type: Date, default: Date.now },
  valorTotal: { type: Number, required: true },
  status: { type: String, enum: ['emitida', 'cancelada'], default: 'emitida' },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);


// Conteúdo de: .\Order.js
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, unique: true }, // Campo auto-incrementado
    mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    assento: { type: String },
    itens: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantidade: { type: Number, required: true, min: 1 },
        tipo: { type: String, enum: ['prato principal', 'entrada', 'sobremesa'], required: true, default: 'prato principal' },
        comentarios: { type: String }, // Novo campo para comentários específicos do item
      },
    ],
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // Corrigido para 'ObjectId'
    garcom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Opcional
    total: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['Pendente', 'Preparando', 'Pronto', 'Entregue', 'Finalizado'], // Adicionado 'Finalizado'
      default: 'Pendente' 
    },
    tipoPedido: { 
      type: String, 
      enum: ['local', 'entrega'], 
      required: true 
    },
    enderecoEntrega: { type: String }, // Se tipoPedido for 'entrega'
    preparar: { type: Boolean, default: true }, // Novo campo 'preparar' por pedido
  },
  { timestamps: true }
);

OrderSchema.plugin(AutoIncrement, { inc_field: 'orderNumber' });

module.exports = mongoose.model('Order', OrderSchema);


// Conteúdo de: .\Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  metodoPagamento: { type: String, required: true }, // Ex: Dinheiro, Cartão, PIX
  valorPago: { type: Number, required: true },
  troco: { type: Number, default: 0 },
  notaFiscalEmitida: { type: Boolean, default: false },
  dataPagamento: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pago', 'Cancelado'], default: 'Pago' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);


// Conteúdo de: .\Product.js
// models/Product.js

const mongoose = require('mongoose');
const removeDiacritics = require('diacritics').remove;

const ProductSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  nomeNormalizado: { type: String, required: true, unique: true },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  preco: { type: Number, required: true },
  descricao: { type: String },
  disponivel: { type: Boolean, default: true },
  quantidadeEstoque: { type: Number, default: 0 },
  imagem: { type: String, default: 'https://via.placeholder.com/150' }, // Novo campo para a URL da imagem
}, { timestamps: true });

// Middleware para definir nomeNormalizado antes de salvar
ProductSchema.pre('validate', function (next) {
  if (this.nome) {
    this.nomeNormalizado = removeDiacritics(this.nome).toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);


// Conteúdo de: .\QrToken.js
// models/QrToken.js
const mongoose = require('mongoose');

const QrTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
});

QrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // token expira após a data
module.exports = mongoose.model('QrToken', QrTokenSchema);


// Conteúdo de: .\Recipe.js
// models/Recipe.js
const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Referência à Category
  ingredientes: [{
    ingrediente: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    quantidade: { type: Number, required: true },
    unidade: { type: String, required: true }, // Adicionado campo 'unidade'
  }],
  precoVenda: { type: Number, required: true },
  descricao: { type: String },
}, { timestamps: true });

// Middleware para garantir que todas as categorias e ingredientes existem
RecipeSchema.pre('save', async function (next) {
  try {
    const Category = require('./Category');
    const Ingredient = require('./Ingredient');

    const categoria = await Category.findById(this.categoria);
    if (!categoria) {
      throw new Error('Categoria não encontrada');
    }

    for (const item of this.ingredientes) {
      const ingrediente = await Ingredient.findById(item.ingrediente);
      if (!ingrediente) {
        throw new Error(`Ingrediente com ID ${item.ingrediente} não encontrado`);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Recipe', RecipeSchema);


// Conteúdo de: .\Reservation.js
// models/Reservation.js
const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  dataReserva: { type: Date, required: true },
  numeroPessoas: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['ativa', 'concluida', 'cancelada'], default: 'ativa' },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', ReservationSchema);


// Conteúdo de: .\Sale.js
// models/Sale.js

const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  salesGoal: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesGoal', required: true },
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  // Outros campos relevantes
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);


// Conteúdo de: .\SalesGoal.js
// models/SalesGoal.js

const mongoose = require('mongoose');

const SalesGoalSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Adicionado
  goalName: { type: String, required: true },
  goalAmount: { type: Number, required: true, min: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
}, { timestamps: true });

// Middleware para garantir que endDate é após startDate
SalesGoalSchema.pre('save', function (next) {
  if (this.endDate && this.endDate <= this.startDate) {
    return next(new Error('endDate deve ser posterior a startDate'));
  }
  next();
});

module.exports = mongoose.model('SalesGoal', SalesGoalSchema);


// Conteúdo de: .\Table.js
// models/Table.js

const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  numeroMesa: { type: Number, required: true, unique: true },
  ambiente: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambiente', required: true },
  status: { type: String, enum: ['livre', 'reservada', 'ocupada'], default: 'livre' },
  capacidade: { type: Number, required: true, min: 1 }, // Campo capacidade
  assentos: [
    {
      numeroAssento: { type: Number, required: true },
      nomeCliente: { type: String, default: null }, // Opcional: define um valor padrão
      pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    },
  ],
  pedidos: [
    {
      produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantidade: { type: Number, required: true, min: 1 },
      preco: { type: Number, required: true, min: 0 },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Table', TableSchema);


// Conteúdo de: .\todo-backend.js
// Conteúdo de: .\Ambiente.js
const mongoose = require('mongoose');

const AmbienteSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  limitePessoas: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Ambiente', AmbienteSchema);


// Conteúdo de: .\AuditLog.js
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String }, // Para facilitar consultas
  action: { type: String, required: true },
  details: { type: Object }, // Pode armazenar detalhes adicionais sobre a ação
  timestamp: { type: Date, default: Date.now, index: true },
});

// Criar índice TTL no campo 'timestamp' para expirar documentos após 60 dias
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 }); // 60 dias em segundos

module.exports = mongoose.model('AuditLog', AuditLogSchema);


// Conteúdo de: .\Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  categoria: { type: String, required: true, unique: true },
  descricao: { type: String },
  habilitado: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);


// Conteúdo de: .\Comanda.js
// src/models/Comanda.js

const mongoose = require('mongoose');

const comandaSchema = new mongoose.Schema({
  mesa: { type: Number, required: true },
  pedidos: [{
    orderNumber: { type: Number, required: true },
    itens: [{
      quantidade: { type: Number, required: true },
      nome: { type: String, required: true },
      preco: { type: Number, required: true },
      total: { type: Number, required: true },
    }],
    total: { type: Number, required: true },
  }],
  valorTotal: { type: Number, required: true },
  tipoDesconto: { type: String, enum: ['nenhum', 'porcentagem', 'valor'], default: 'nenhum' },
  valorDesconto: { type: Number, default: 0 },
  totalComDesconto: { type: Number, required: true },
  formaPagamento: { type: String, enum: ['dinheiro', 'cartao', 'pix'], required: true },
  valorPago: { type: Number, required: true },
  troco: { type: Number, default: 0 },
  dataFinalizacao: { type: Date, default: Date.now },
  pdfPath: { type: String }, // Caminho do PDF gerado
}, { timestamps: true });

module.exports = mongoose.model('Comanda', comandaSchema);


// Conteúdo de: .\Config.js
// cash-register-backend/models/Config.js
const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  logotipo: { type: String, default: '' }, // URL completa da imagem do logotipo
  razaoSocial: { type: String, required: true },
  cnpj: { type: String, required: true, unique: true, match: /^\d{14}$/ },
  ie: { type: String, required: true },
  logradouro: { type: String, required: true },
  numero: { type: String, required: true },
  bairro: { type: String, required: true },
  cidade: { type: String, required: true },
  uf: { type: String, required: true },
  telefone: { type: String, required: true },
  email: { type: String, required: true, match: /.+\@.+\..+/ },
  taxaServico: { type: Number, default: 10 },
  site: { type: String, default: '' },
  observacoes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Config', ConfigSchema);


// Conteúdo de: .\Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  cpfCnpj: { type: String, unique: true, sparse: true, required: true }, // CPF ou CNPJ
  nome: { type: String, required: true },
  contato: { type: String }, // Novo campo
  telefone: { type: String },
  whatsapp: { type: String, required: true }, // Novo campo
  email: { type: String, unique: true, sparse: true },
  cep: { type: String }, // Novo campo
  rua: { type: String },
  numero: { type: String },
  complemento: { type: String },
  bairro: { type: String },
  cidade: { type: String },
  estado: { type: String },
  pontosFidelidade: { type: Number, default: 0 },
  historicoPedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
}, { timestamps: true });

// Cria índices únicos para campos 'cpfCnpj' e 'email'
customerSchema.index({ cpfCnpj: 1 }, { unique: true, sparse: true });
customerSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Customer', customerSchema);


// Conteúdo de: .\Employee.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const EmployeeSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  funcao: { type: String, required: true, enum: ['Garçom', 'Cozinheiro', 'Gerente'] },
  email: { type: String, unique: true, required: true, match: /.+\@.+\..+/ },
  senha: { type: String, required: true },
  permissoes: { type: [String], default: [] },
}, { timestamps: true });

// Cria índice único para o campo 'email'
EmployeeSchema.index({ email: 1 }, { unique: true });

// Hash da senha antes de salvar
EmployeeSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Método para comparar senha
EmployeeSchema.methods.comparePassword = async function (senha) {
  return await bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.model('Employee', EmployeeSchema);


// Conteúdo de: .\FinalizedOrder.js
// models/FinalizedOrder.js
const mongoose = require('mongoose');

const FinalizedOrderSchema = new mongoose.Schema({
  mesaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }], // pedidos finalizados dessa mesa
  garcom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  valorTotal: { type: Number, required: true },
  consumoPorAssento: [
    {
      assento: { type: String },
      valor: { type: Number, default: 0 },
    },
  ],
  dataFinalizacao: { type: Date, default: Date.now },
  ambienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambiente', required: true },
}, { timestamps: true });

module.exports = mongoose.model('FinalizedOrder', FinalizedOrderSchema);


// Conteúdo de: .\FinalizedTable.js
// src/models/FinalizedTable.js
const mongoose = require('mongoose');

const FinalizedTableSchema = new mongoose.Schema({
  numeroMesa: {
    type: Number,
    required: true,
  },
  ambienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambiente',
    required: true,
  },
  garcomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  valorTotal: {
    type: Number,
    required: true,
  },
  formaPagamento: { type: String, enum: ['dinheiro', 'cartao', 'pix'], default: 'dinheiro' },
  valorPago: { type: Number, default: 0 },
  tipoDesconto: { type: String, enum: ['nenhum', 'porcentagem', 'valor'], default: 'nenhum' },
  valorDesconto: { type: Number, default: 0 },
  dataFinalizacao: {
    type: Date,
    default: Date.now,
  },
  pdfPath: { type: String }, // Caminho do PDF gerado
}, { timestamps: true });

module.exports = mongoose.model('FinalizedTable', FinalizedTableSchema);


// Conteúdo de: .\IfoodToken.js
// controllers/ifoodAuthController.js
const axios = require('axios');
const qs = require('querystring');
const IfoodToken = require('../models/IfoodToken');
require('dotenv').config();

const IFOOD_CLIENT_ID = process.env.IFOOD_CLIENT_ID;
const IFOOD_CLIENT_SECRET = process.env.IFOOD_CLIENT_SECRET;
const IFOOD_USER_CODE_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/userCode';
const IFOOD_TOKEN_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';

// Iniciar o processo de autenticação
exports.startAuth = async (req, res) => {
  try {
    const response = await axios.post(
      IFOOD_USER_CODE_URL,
      qs.stringify({ clientId: IFOOD_CLIENT_ID }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const {
      userCode,
      authorizationCodeVerifier,
      verificationUrlComplete
    } = response.data;

    // Salvar temporariamente no session ou retornar ao frontend
    // Uma abordagem simples é retornar para o frontend e o frontend guardar em estado local.
    req.session.authorizationCodeVerifier = authorizationCodeVerifier;

    return res.json({
      userCode,
      verificationUrlComplete
    });
  } catch (error) {
    console.error('Erro ao iniciar autenticação com iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao iniciar autenticação com iFood.' });
  }
};

// Concluir autenticação com o código de autorização
exports.completeAuth = async (req, res) => {
  try {
    const { authorizationCode } = req.body;
    const authorizationCodeVerifier = req.session.authorizationCodeVerifier;
    if (!authorizationCodeVerifier) {
      return res.status(400).json({ message: 'Faltando authorizationCodeVerifier na sessão.' });
    }

    const payload = {
      grantType: 'authorization_code',
      clientId: IFOOD_CLIENT_ID,
      clientSecret: IFOOD_CLIENT_SECRET,
      authorizationCode: authorizationCode,
      authorizationCodeVerifier: authorizationCodeVerifier
    };

    const response = await axios.post(
      IFOOD_TOKEN_URL,
      qs.stringify(payload),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { accessToken, refreshToken, expiresIn } = response.data;

    // Salvar no banco de dados
    await IfoodToken.deleteMany({});
    const token = new IfoodToken({ accessToken, refreshToken, expiresIn });
    await token.save();

    // Limpar a session
    req.session.authorizationCodeVerifier = null;

    return res.json({ message: 'Autenticação concluída com sucesso!', accessToken });
  } catch (error) {
    console.error('Erro ao concluir autenticação com iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao concluir autenticação com o iFood.' });
  }
};

// Obter status da autenticação (se há token válido)
exports.getStatus = async (req, res) => {
  const token = await IfoodToken.findOne({});
  if (!token) {
    return res.json({ authenticated: false, message: 'Nenhum token armazenado' });
  }

  const expired = token.isExpired();
  return res.json({ authenticated: !expired, expired });
};

// Função para refresh do token (se houver refreshToken)
exports.refreshToken = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || !token.refreshToken) {
      return res.status(400).json({ message: 'Não há refreshToken para renovar o token.' });
    }

    const payload = {
      grantType: 'refresh_token',
      clientId: IFOOD_CLIENT_ID,
      clientSecret: IFOOD_CLIENT_SECRET,
      refreshToken: token.refreshToken
    };

    const response = await axios.post(
      IFOOD_TOKEN_URL,
      qs.stringify(payload),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { accessToken, refreshToken, expiresIn } = response.data;

    token.accessToken = accessToken;
    if (refreshToken) token.refreshToken = refreshToken;
    token.expiresIn = expiresIn;
    token.createdAt = new Date();

    await token.save();

    return res.json({ message: 'Token renovado com sucesso!', accessToken });
  } catch (error) {
    console.error('Erro ao renovar token do iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao renovar token do iFood.' });
  }
};

// Exemplo de rota para testar integração (obter lista de pedidos)
exports.getOrders = async (req, res) => {
  try {
    const token = await IfoodToken.findOne({});
    if (!token || token.isExpired()) {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }

    // Exemplo de chamada a algum endpoint do iFood (alterar para endpoint real de pedidos)
    // Documentação do iFood: precisará definir endpoint correto.
    const ordersUrl = 'https://merchant-api.ifood.com.br/order/v1.0/orders';
    const response = await axios.get(ordersUrl, {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`
      }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Erro ao obter pedidos do iFood:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Erro ao obter pedidos do iFood.' });
  }
};


// Conteúdo de: .\Ingredient.js
// models/Ingredient.js
const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  unidadeMedida: { type: String, required: true }, // Ex: kg, g, l, etc.
  quantidadeEstoque: { type: Number, required: true, default: 0 },
  precoCusto: { type: Number, required: true },
  imagem: { type: String, default: 'https://via.placeholder.com/150' }, // Novo campo de imagem
}, { timestamps: true });

module.exports = mongoose.model('Ingredient', IngredientSchema);


// Conteúdo de: .\Invoice.js
const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  numeroFatura: { type: String, required: true, unique: true },
  dataEmissao: { type: Date, default: Date.now },
  valorTotal: { type: Number, required: true },
  status: { type: String, enum: ['emitida', 'cancelada'], default: 'emitida' },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);


// Conteúdo de: .\Order.js
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, unique: true }, // Campo auto-incrementado
    mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    assento: { type: String },
    itens: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantidade: { type: Number, required: true, min: 1 },
        tipo: { type: String, enum: ['prato principal', 'entrada', 'sobremesa'], required: true, default: 'prato principal' },
        comentarios: { type: String }, // Novo campo para comentários específicos do item
      },
    ],
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // Corrigido para 'ObjectId'
    garcom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Opcional
    total: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['Pendente', 'Preparando', 'Pronto', 'Entregue', 'Finalizado'], // Adicionado 'Finalizado'
      default: 'Pendente' 
    },
    tipoPedido: { 
      type: String, 
      enum: ['local', 'entrega'], 
      required: true 
    },
    enderecoEntrega: { type: String }, // Se tipoPedido for 'entrega'
    preparar: { type: Boolean, default: true }, // Novo campo 'preparar' por pedido
  },
  { timestamps: true }
);

OrderSchema.plugin(AutoIncrement, { inc_field: 'orderNumber' });

module.exports = mongoose.model('Order', OrderSchema);


// Conteúdo de: .\Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  metodoPagamento: { type: String, required: true }, // Ex: Dinheiro, Cartão, PIX
  valorPago: { type: Number, required: true },
  troco: { type: Number, default: 0 },
  notaFiscalEmitida: { type: Boolean, default: false },
  dataPagamento: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pago', 'Cancelado'], default: 'Pago' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);


// Conteúdo de: .\Product.js
// models/Product.js

const mongoose = require('mongoose');
const removeDiacritics = require('diacritics').remove;

const ProductSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  nomeNormalizado: { type: String, required: true, unique: true },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  preco: { type: Number, required: true },
  descricao: { type: String },
  disponivel: { type: Boolean, default: true },
  quantidadeEstoque: { type: Number, default: 0 },
  imagem: { type: String, default: 'https://via.placeholder.com/150' }, // Novo campo para a URL da imagem
}, { timestamps: true });

// Middleware para definir nomeNormalizado antes de salvar
ProductSchema.pre('validate', function (next) {
  if (this.nome) {
    this.nomeNormalizado = removeDiacritics(this.nome).toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);


// Conteúdo de: .\QrToken.js
// models/QrToken.js
const mongoose = require('mongoose');

const QrTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
});

QrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // token expira após a data
module.exports = mongoose.model('QrToken', QrTokenSchema);


// Conteúdo de: .\Recipe.js
// models/Recipe.js
const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Referência à Category
  ingredientes: [{
    ingrediente: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    quantidade: { type: Number, required: true },
    unidade: { type: String, required: true }, // Adicionado campo 'unidade'
  }],
  precoVenda: { type: Number, required: true },
  descricao: { type: String },
}, { timestamps: true });

// Middleware para garantir que todas as categorias e ingredientes existem
RecipeSchema.pre('save', async function (next) {
  try {
    const Category = require('./Category');
    const Ingredient = require('./Ingredient');

    const categoria = await Category.findById(this.categoria);
    if (!categoria) {
      throw new Error('Categoria não encontrada');
    }

    for (const item of this.ingredientes) {
      const ingrediente = await Ingredient.findById(item.ingrediente);
      if (!ingrediente) {
        throw new Error(`Ingrediente com ID ${item.ingrediente} não encontrado`);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Recipe', RecipeSchema);


// Conteúdo de: .\Reservation.js
// models/Reservation.js
const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  dataReserva: { type: Date, required: true },
  numeroPessoas: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['ativa', 'concluida', 'cancelada'], default: 'ativa' },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', ReservationSchema);


// Conteúdo de: .\Sale.js
// models/Sale.js

const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  salesGoal: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesGoal', required: true },
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  // Outros campos relevantes
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);


// Conteúdo de: .\SalesGoal.js
// models/SalesGoal.js

const mongoose = require('mongoose');

const SalesGoalSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Adicionado
  goalName: { type: String, required: true },
  goalAmount: { type: Number, required: true, min: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
}, { timestamps: true });

// Middleware para garantir que endDate é após startDate
SalesGoalSchema.pre('save', function (next) {
  if (this.endDate && this.endDate <= this.startDate) {
    return next(new Error('endDate deve ser posterior a startDate'));
  }
  next();
});

module.exports = mongoose.model('SalesGoal', SalesGoalSchema);


// Conteúdo de: .\User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
  senha: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'manager', 'agent', 'feeder'],
    default: 'agent',
  },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Novo campo
  permissions: { type: [String], default: [] }, // Lista de permissões
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

// Hash da senha antes de salvar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
UserSchema.methods.comparePassword = async function (senha) {
  return await bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.model('User', UserSchema);


