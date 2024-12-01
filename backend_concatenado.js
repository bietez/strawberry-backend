// Conteúdo de: .\app.js
// app.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { json, urlencoded } = express;
const config = require('./config');
const rateLimit = require('express-rate-limit');


// Importar Rotas
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const tableRoutes = require('./routes/tableRoutes');
const productRoutes = require('./routes/productRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const stockRoutes = require('./routes/stockRoutes');
const reportRoutes = require('./routes/reportRoutes');
const customerRoutes = require('./routes/customerRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const ambienteRoutes = require('./routes/ambienteRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const ifoodRoutes = require('./routes/ifoodRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const salesGoalRoutes = require('./routes/salesGoalRoutes');
const userRoutes = require('./routes/userRoutes');


// Middlewares
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// Configuração de Middlewares
// app.use(cors());
app.use(cors({
  origin: 'http://localhost:3000', // Substitua pela URL do seu frontend
  credentials: true, // Permite o envio de cookies
}));
app.use(json());
app.use(urlencoded({ extended: true }));

// Limite de requisições
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 15, // Limite de 15 requisições consecutivas
  message: {
    message: 'Muitas requisições deste IP. Tente novamente em 10 minutos.',
  },
  skip: (req, res) => {
    // Pular limitação se o usuário estiver logado
    const token = req.headers['authorization'];
    return !!token;
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

// Aplicar limitador globalmente
app.use(limiter);

// Conexão com o Banco de Dados
mongoose.connect(config.mongoURI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));
  
// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ambientes', ambienteRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api', ifoodRoutes);
app.use('/api/categories', categoryRoutes)
app.use('/api/sales-goals', salesGoalRoutes);
app.use('/api/users', userRoutes);



// Middleware de Tratamento de Erros
app.use(errorMiddleware);

module.exports = app;


// Conteúdo de: .\config.js
// config.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  paymentApiKey: process.env.PAYMENT_API_KEY,
  deliveryPlatformApiKey: process.env.DELIVERY_PLATFORM_API_KEY,
};


// Conteúdo de: .\ifood.js
// Importando as dependências
const axios = require('axios');
const readline = require('readline');
const qs = require('querystring');

// Configuração do MongoDB e variáveis de ambiente
require('dotenv').config();

const IFOOD_CLIENT_ID = process.env.IFOOD_CLIENT_ID;
const IFOOD_CLIENT_SECRET = process.env.IFOOD_CLIENT_SECRET;
const IFOOD_TOKEN_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';

// Inicializando a leitura de entrada do console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para solicitar o código de usuário do iFood
envocarTokenUsuario();

function envocarTokenUsuario() {
  axios.post('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/userCode', qs.stringify({
    clientId: IFOOD_CLIENT_ID
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
    .then((response) => {
      const { userCode, authorizationCodeVerifier, verificationUrlComplete } = response.data;
      console.log(`\nPor favor, acesse o seguinte link para autorizar o aplicativo: ${verificationUrlComplete}`);
      console.log(`\nuserCode: ${userCode}`);
      console.log(`\nauthorizationCodeVerifier: ${authorizationCodeVerifier}`);
      aguardarCodigoDeAutorizacao(authorizationCodeVerifier);
    })
    .catch((error) => {
      console.error("Erro ao obter o userCode: ", error.response ? error.response.data : error.message);
    });
}

function aguardarCodigoDeAutorizacao(authorizationCodeVerifier) {
  rl.question('\nDigite o código de autorização fornecido pelo portal do iFood: ', (authorizationCode) => {
    obterTokenDeAcesso(authorizationCode, authorizationCodeVerifier);
  });
}

// Função para obter o token de acesso usando o código de autorização fornecido pelo iFood
function obterTokenDeAcesso(authorizationCode, authorizationCodeVerifier) {
  axios.post(IFOOD_TOKEN_URL, qs.stringify({
    grantType: 'authorization_code',
    clientId: IFOOD_CLIENT_ID,
    clientSecret: IFOOD_CLIENT_SECRET,
    authorizationCode: authorizationCode,
    authorizationCodeVerifier: authorizationCodeVerifier
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
    .then((response) => {
      console.log('Token de acesso obtido com sucesso:', response.data);
      rl.close();
    })
    .catch((error) => {
      console.error("Erro ao obter o token de acesso do iFood: ", error.response ? error.response.data : error.message);
      rl.close();
    });
}

// Conteúdo de: .\permissions.js
// src/permissions.js
const allPermissions = [
  'viewDashboard',
    'viewProduct',
    'createProduct',
    'editProduct',
    'deleteProduct',
    'viewCustomer',
    'createCustomer',
    'editCustomer',
    'deleteCustomer',
    'viewEmployee',
    'createEmployee',
    'editEmployee',
    'deleteEmployee',
    'viewIngredient',
    'createIngredient',
    'editIngredient',
    'deleteIngredient',
    'viewRecipe',
    'createRecipe',
    'editRecipe',
    'deleteRecipe',
    'createOrder',
    'manageStock',
    'viewReports',
    'processPayment',
    'viewAmbiente',
    'createAmbiente',
    'editAmbiente',
    'deleteAmbiente',
    'viewTable',
    'createTable',
    'editTable',
    'deleteTable',
    'viewReservation',
    'createReservation',
    'editReservation',
    'deleteReservation',
    'manageIfoodAuth',
    'createCategory',
    'viewCategory',
    'editCategory',
    'deleteCategory',
    'addUser',
    'manageSalesGoals',
    'viewTeamMembers',
    'manageOrder',
    
  // Adicione todas as outras permissões aqui
];

module.exports = allPermissions;


// Conteúdo de: .\rolePermissions.js
// rolePermissions.js
module.exports = {
    admin: ['*'], // Acesso total
    manager: [
      'viewProduct',
      'createProduct',
      'editProduct',
      'manageStock',
      // Adicione outras permissões conforme necessário
    ],
    agent: ['viewProduct', 'createSale'],
    feeder: ['viewProduct'],
  };
  

// Conteúdo de: .\seed.js
// seed.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

// Importar os modelos
const Ambiente = require('./models/Ambiente');
const Table = require('./models/Table');
const Reservation = require('./models/Reservation');
const Customer = require('./models/Customer');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');
const SalesGoal = require('./models/SalesGoal');
const Ingredient = require('./models/Ingredient');
const Recipe = require('./models/Recipe');
const AuditLog = require('./models/AuditLog');

// Carregar variáveis de ambiente
dotenv.config();

// Função principal para semear o banco de dados
async function seedDatabase() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado ao MongoDB para seed');

    // Limpar as coleções existentes
    await Ambiente.deleteMany({});
    await Table.deleteMany({});
    await Reservation.deleteMany({});
    await Customer.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    await SalesGoal.deleteMany({});
    await Ingredient.deleteMany({});
    await Recipe.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Coleções limpas com sucesso.');

    // Inserir categorias
    const categoriesData = [
      { categoria: 'Bebidas', descricao: 'Todas as bebidas disponíveis', habilitado: true },
      { categoria: 'Entradas', descricao: 'Pratos de entrada', habilitado: true },
      { categoria: 'Pratos Principais', descricao: 'Pratos principais', habilitado: true },
      { categoria: 'Sobremesas', descricao: 'Sobremesas deliciosas', habilitado: true },
      { categoria: 'Especialidades da Casa', descricao: 'Pratos exclusivos do chef', habilitado: true },
      { categoria: 'Vegano', descricao: 'Opções veganas', habilitado: true },
      { categoria: 'Sem Glúten', descricao: 'Opções sem glúten', habilitado: true },
      { categoria: 'Combos', descricao: 'Combos especiais', habilitado: true },
    ];

    const categories = await Category.insertMany(categoriesData);
    console.log('Categorias inseridas:', categories.length);

    // Inserir ingredientes
    const ingredientsData = [
      { nome: 'Tomate', unidadeMedida: 'kg', quantidadeEstoque: 100, precoCusto: 5.0 },
      { nome: 'Cebola', unidadeMedida: 'kg', quantidadeEstoque: 80, precoCusto: 3.0 },
      { nome: 'Alho', unidadeMedida: 'kg', quantidadeEstoque: 50, precoCusto: 7.0 },
      { nome: 'Frango', unidadeMedida: 'kg', quantidadeEstoque: 60, precoCusto: 20.0 },
      { nome: 'Carne Bovina', unidadeMedida: 'kg', quantidadeEstoque: 40, precoCusto: 30.0 },
      { nome: 'Batata', unidadeMedida: 'kg', quantidadeEstoque: 90, precoCusto: 4.0 },
      { nome: 'Arroz', unidadeMedida: 'kg', quantidadeEstoque: 150, precoCusto: 2.5 },
      { nome: 'Feijão', unidadeMedida: 'kg', quantidadeEstoque: 120, precoCusto: 3.5 },
      { nome: 'Leite', unidadeMedida: 'litro', quantidadeEstoque: 200, precoCusto: 4.5 },
      { nome: 'Ovo', unidadeMedida: 'unidade', quantidadeEstoque: 500, precoCusto: 0.5 },
      { nome: 'Farinha de Trigo', unidadeMedida: 'kg', quantidadeEstoque: 100, precoCusto: 3.0 },
      { nome: 'Açúcar', unidadeMedida: 'kg', quantidadeEstoque: 80, precoCusto: 2.0 },
      { nome: 'Manteiga', unidadeMedida: 'kg', quantidadeEstoque: 60, precoCusto: 10.0 },
      { nome: 'Queijo', unidadeMedida: 'kg', quantidadeEstoque: 70, precoCusto: 15.0 },
      { nome: 'Sal', unidadeMedida: 'kg', quantidadeEstoque: 200, precoCusto: 1.0 },
      { nome: 'Pimenta', unidadeMedida: 'kg', quantidadeEstoque: 50, precoCusto: 8.0 },
      { nome: 'Manjericão', unidadeMedida: 'kg', quantidadeEstoque: 30, precoCusto: 12.0 },
      { nome: 'Limão', unidadeMedida: 'kg', quantidadeEstoque: 60, precoCusto: 4.0 },
      { nome: 'Espinafre', unidadeMedida: 'kg', quantidadeEstoque: 40, precoCusto: 6.0 },
      { nome: 'Cogumelos', unidadeMedida: 'kg', quantidadeEstoque: 35, precoCusto: 18.0 },
      { nome: 'Pimentão', unidadeMedida: 'kg', quantidadeEstoque: 55, precoCusto: 5.5 },
      { nome: 'Azeite', unidadeMedida: 'litro', quantidadeEstoque: 100, precoCusto: 20.0 },
      { nome: 'Vinho Tinto', unidadeMedida: 'litro', quantidadeEstoque: 50, precoCusto: 25.0 },
      { nome: 'Vinho Branco', unidadeMedida: 'litro', quantidadeEstoque: 50, precoCusto: 22.0 },
      { nome: 'Cerveja', unidadeMedida: 'unidade', quantidadeEstoque: 300, precoCusto: 3.0 },
      { nome: 'Refrigerante', unidadeMedida: 'litro', quantidadeEstoque: 150, precoCusto: 4.0 },
      { nome: 'Suco de Laranja', unidadeMedida: 'litro', quantidadeEstoque: 100, precoCusto: 5.0 },
      { nome: 'Suco de Maçã', unidadeMedida: 'litro', quantidadeEstoque: 100, precoCusto: 5.0 },
      { nome: 'Melancia', unidadeMedida: 'kg', quantidadeEstoque: 40, precoCusto: 7.0 },
      { nome: 'Abacaxi', unidadeMedida: 'kg', quantidadeEstoque: 30, precoCusto: 6.5 },
      { nome: 'Morango', unidadeMedida: 'kg', quantidadeEstoque: 25, precoCusto: 12.0 },
      { nome: 'Banana', unidadeMedida: 'kg', quantidadeEstoque: 80, precoCusto: 3.0 },
      { nome: 'Maçã', unidadeMedida: 'kg', quantidadeEstoque: 70, precoCusto: 4.0 },
      // Ingredientes faltantes
      { nome: 'Alface', unidadeMedida: 'kg', quantidadeEstoque: 50, precoCusto: 4.0 },
      { nome: 'Parmesão', unidadeMedida: 'kg', quantidadeEstoque: 20, precoCusto: 15.0 },
      { nome: 'Camarão', unidadeMedida: 'kg', quantidadeEstoque: 40, precoCusto: 25.0 },
      { nome: 'Café', unidadeMedida: 'kg', quantidadeEstoque: 25, precoCusto: 10.0 },
      // Adicione mais ingredientes conforme necessário
    ];

    const ingredients = await Ingredient.insertMany(ingredientsData);
    console.log('Ingredientes inseridos:', ingredients.length);

    // Inserir receitas
    const recipesData = [
      {
        nome: 'Salada Caesar',
        categoria: 'Entradas',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Alho')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Cebola')._id, quantidade: 0.1 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Alface')._id, quantidade: 0.2 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Parmesão')._id, quantidade: 0.05 },
        ],
        precoVenda: 15.0,
        descricao: 'Salada clássica com alface, parmesão e molho Caesar.',
      },
      {
        nome: 'Bife Ancho',
        categoria: 'Pratos Principais',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Carne Bovina')._id, quantidade: 0.3 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Sal')._id, quantidade: 0.01 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Pimenta')._id, quantidade: 0.005 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Azeite')._id, quantidade: 0.02 },
        ],
        precoVenda: 35.0,
        descricao: 'Bife Ancho grelhado com sal e pimenta.',
      },
      {
        nome: 'Risoto de Camarão',
        categoria: 'Pratos Principais',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Arroz')._id, quantidade: 0.2 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Camarão')._id, quantidade: 0.25 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Alho')._id, quantidade: 0.02 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Cebola')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Vinho Branco')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Azeite')._id, quantidade: 0.03 },
        ],
        precoVenda: 30.0,
        descricao: 'Risoto cremoso com camarões frescos.',
      },
      {
        nome: 'Frango à Parmegiana',
        categoria: 'Pratos Principais',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Frango')._id, quantidade: 0.25 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Tomate')._id, quantidade: 0.1 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Queijo')._id, quantidade: 0.1 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Farinha de Trigo')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Ovo')._id, quantidade: 2 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Azeite')._id, quantidade: 0.02 },
        ],
        precoVenda: 28.0,
        descricao: 'Peito de frango empanado com molho de tomate e queijo derretido.',
      },
      {
        nome: 'Tiramisu',
        categoria: 'Sobremesas',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Ovo')._id, quantidade: 3 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Açúcar')._id, quantidade: 0.1 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Farinha de Trigo')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Café')._id, quantidade: 0.2 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Azeite')._id, quantidade: 0.01 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Queijo')._id, quantidade: 0.15 },
        ],
        precoVenda: 18.0,
        descricao: 'Sobremesa italiana clássica com camadas de queijo mascarpone e café.',
      },
      // Adicione mais receitas conforme necessário
    ];

    const recipes = await Recipe.insertMany(recipesData);
    console.log('Receitas inseridas:', recipes.length);

    // Inserir produtos
    const productsData = [
      { nome: 'Coca-Cola', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 5.0, descricao: 'Refrigerante Coca-Cola 350ml', disponivel: true, quantidadeEstoque: 200 },
      { nome: 'Suco de Laranja Natural', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 6.5, descricao: 'Suco de laranja natural 500ml', disponivel: true, quantidadeEstoque: 150 },
      { nome: 'Água Mineral', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 3.0, descricao: 'Água mineral sem gás 500ml', disponivel: true, quantidadeEstoque: 300 },
      { nome: 'Salada Caesar', categoria: categories.find(cat => cat.categoria === 'Entradas')._id, preco: 15.0, descricao: 'Salada Caesar com croutons e parmesão', disponivel: true, quantidadeEstoque: 80 },
      { nome: 'Bruschetta', categoria: categories.find(cat => cat.categoria === 'Entradas')._id, preco: 12.0, descricao: 'Bruschetta tradicional com tomate e manjericão', disponivel: true, quantidadeEstoque: 60 },
      { nome: 'Sopa de Abóbora', categoria: categories.find(cat => cat.categoria === 'Entradas')._id, preco: 14.0, descricao: 'Sopa cremosa de abóbora com gengibre', disponivel: true, quantidadeEstoque: 70 },
      { nome: 'Bife Ancho', categoria: categories.find(cat => cat.categoria === 'Pratos Principais')._id, preco: 35.0, descricao: 'Bife Ancho grelhado ao ponto', disponivel: true, quantidadeEstoque: 50 },
      { nome: 'Risoto de Camarão', categoria: categories.find(cat => cat.categoria === 'Pratos Principais')._id, preco: 30.0, descricao: 'Risoto cremoso com camarões frescos', disponivel: true, quantidadeEstoque: 45 },
      { nome: 'Frango à Parmegiana', categoria: categories.find(cat => cat.categoria === 'Pratos Principais')._id, preco: 28.0, descricao: 'Peito de frango empanado com molho de tomate e queijo', disponivel: true, quantidadeEstoque: 60 },
      { nome: 'Tiramisu', categoria: categories.find(cat => cat.categoria === 'Sobremesas')._id, preco: 18.0, descricao: 'Sobremesa italiana com camadas de queijo mascarpone e café', disponivel: true, quantidadeEstoque: 40 },
      { nome: 'Pudim de Leite', categoria: categories.find(cat => cat.categoria === 'Sobremesas')._id, preco: 16.0, descricao: 'Pudim de leite cremoso', disponivel: true, quantidadeEstoque: 50 },
      { nome: 'Cheesecake', categoria: categories.find(cat => cat.categoria === 'Sobremesas')._id, preco: 20.0, descricao: 'Cheesecake com cobertura de frutas vermelhas', disponivel: true, quantidadeEstoque: 35 },
      { nome: 'Prato Especial do Chef', categoria: categories.find(cat => cat.categoria === 'Especialidades da Casa')._id, preco: 40.0, descricao: 'Prato exclusivo preparado pelo chef', disponivel: true, quantidadeEstoque: 25 },
      { nome: 'Lasanha Trufada', categoria: categories.find(cat => cat.categoria === 'Especialidades da Casa')._id, preco: 38.0, descricao: 'Lasanha com molho trufado e cogumelos', disponivel: true, quantidadeEstoque: 30 },
      { nome: 'Polvo à Lagareiro', categoria: categories.find(cat => cat.categoria === 'Especialidades da Casa')._id, preco: 45.0, descricao: 'Polvo assado com batatas e azeite', disponivel: true, quantidadeEstoque: 20 },
      { nome: 'Espinafre ao Alho', categoria: categories.find(cat => cat.categoria === 'Vegano')._id, preco: 12.0, descricao: 'Espinafre refogado com alho e azeite', disponivel: true, quantidadeEstoque: 50 },
      { nome: 'Risoto Vegano', categoria: categories.find(cat => cat.categoria === 'Vegano')._id, preco: 25.0, descricao: 'Risoto vegano com legumes frescos', disponivel: true, quantidadeEstoque: 30 },
      { nome: 'Salada Sem Glúten', categoria: categories.find(cat => cat.categoria === 'Sem Glúten')._id, preco: 14.0, descricao: 'Salada fresca sem ingredientes com glúten', disponivel: true, quantidadeEstoque: 40 },
      { nome: 'Pizza Vegana', categoria: categories.find(cat => cat.categoria === 'Sem Glúten')._id, preco: 22.0, descricao: 'Pizza vegana com massa sem glúten', disponivel: true, quantidadeEstoque: 35 },
      { nome: 'Combo Família', categoria: categories.find(cat => cat.categoria === 'Combos')._id, preco: 80.0, descricao: 'Combo para família com entradas, pratos principais e sobremesas', disponivel: true, quantidadeEstoque: 20 },
      { nome: 'Combo Amigos', categoria: categories.find(cat => cat.categoria === 'Combos')._id, preco: 60.0, descricao: 'Combo para amigos com diversas opções de pratos', disponivel: true, quantidadeEstoque: 25 },
      { nome: 'Cerveja Long Neck', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 3.0, descricao: 'Cerveja Long Neck 330ml', disponivel: true, quantidadeEstoque: 300 },
      { nome: 'Vinho Rosé', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 28.0, descricao: 'Vinho rosé 750ml', disponivel: true, quantidadeEstoque: 40 },
      { nome: 'Espumante Brut', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 35.0, descricao: 'Espumante brut 750ml', disponivel: true, quantidadeEstoque: 30 },
      { nome: 'Whisky', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 50.0, descricao: 'Whisky envelhecido 1 ano', disponivel: true, quantidadeEstoque: 25 },
      // Adicione mais produtos conforme necessário
    ];

    const products = await Product.insertMany(productsData);
    console.log('Produtos inseridos:', products.length);

    // Inserir ambientes
    const ambientesData = [
      { nome: 'Sala Principal', limitePessoas: 50 },
      { nome: 'Terraço', limitePessoas: 30 },
      { nome: 'Salão Privativo', limitePessoas: 20 },
      { nome: 'Bar', limitePessoas: 25 },
      { nome: 'Cozinha', limitePessoas: 10 },
      { nome: 'Banheiro Masculino', limitePessoas: 10 },
      { nome: 'Banheiro Feminino', limitePessoas: 10 },
    ];

    const ambientes = await Ambiente.insertMany(ambientesData);
    console.log('Ambientes inseridos:', ambientes.length);

    // Inserir mesas
    const tablesData = [
      { numeroMesa: 1, ambiente: ambientes.find(a => a.nome === 'Sala Principal')._id, position: { x: 10, y: 20 }, numeroAssentos: 4 },
      { numeroMesa: 2, ambiente: ambientes.find(a => a.nome === 'Sala Principal')._id, position: { x: 30, y: 20 }, numeroAssentos: 4 },
      { numeroMesa: 3, ambiente: ambientes.find(a => a.nome === 'Terraço')._id, position: { x: 10, y: 50 }, numeroAssentos: 6 },
      { numeroMesa: 4, ambiente: ambientes.find(a => a.nome === 'Salão Privativo')._id, position: { x: 50, y: 20 }, numeroAssentos: 8 },
      { numeroMesa: 5, ambiente: ambientes.find(a => a.nome === 'Bar')._id, position: { x: 70, y: 20 }, numeroAssentos: 2 },
      { numeroMesa: 6, ambiente: ambientes.find(a => a.nome === 'Bar')._id, position: { x: 90, y: 20 }, numeroAssentos: 2 },
      { numeroMesa: 7, ambiente: ambientes.find(a => a.nome === 'Sala Principal')._id, position: { x: 110, y: 20 }, numeroAssentos: 4 },
      { numeroMesa: 8, ambiente: ambientes.find(a => a.nome === 'Sala Principal')._id, position: { x: 130, y: 20 }, numeroAssentos: 4 },
      { numeroMesa: 9, ambiente: ambientes.find(a => a.nome === 'Terraço')._id, position: { x: 10, y: 80 }, numeroAssentos: 6 },
      { numeroMesa: 10, ambiente: ambientes.find(a => a.nome === 'Salão Privativo')._id, position: { x: 150, y: 20 }, numeroAssentos: 8 },
      // Adicione mais mesas conforme necessário
    ];

    const tables = await Table.insertMany(tablesData);
    console.log('Mesas inseridas:', tables.length);

    // Inserir clientes
    const customersData = [
      { nome: 'João Silva', cpf: '123.456.789-00', email: 'joao@example.com', telefone: '11999999999' },
      { nome: 'Maria Souza', cpf: '987.654.321-00', email: 'maria@example.com', telefone: '11888888888' },
      { nome: 'Pedro Oliveira', cpf: '456.789.123-00', email: 'pedro@example.com', telefone: '11777777777' },
      { nome: 'Ana Paula', cpf: '321.654.987-00', email: 'ana@example.com', telefone: '11666666666' },
      { nome: 'Carlos Alberto', cpf: '654.321.789-00', email: 'carlos@example.com', telefone: '11555555555' },
      { nome: 'Fernanda Lima', cpf: '789.123.456-00', email: 'fernanda@example.com', telefone: '11444444444' },
      { nome: 'Ricardo Dias', cpf: '147.258.369-00', email: 'ricardo@example.com', telefone: '11333333333' },
      { nome: 'Patrícia Gomes', cpf: '369.258.147-00', email: 'patricia@example.com', telefone: '11222222222' },
      { nome: 'Lucas Martins', cpf: '258.147.369-00', email: 'lucas@example.com', telefone: '11111111111' },
      { nome: 'Juliana Costa', cpf: '159.753.486-00', email: 'juliana@example.com', telefone: '11000000000' },
    ];

    const customers = await Customer.insertMany(customersData);
    console.log('Clientes inseridos:', customers.length);

    // Inserir usuários (administradores, gerentes, agentes, feeders)
    const hashedPasswordAdmin = await bcrypt.hash('mzgxdyj8', 10); // Senha para admin
    const hashedPasswordUsers = await bcrypt.hash('senha123', 10); // Senhas padrão para outros usuários

    const usersData = [
      {
        nome: 'AGB Junior',
        email: 'agb_junior@live.com',
        senha: 'mzgxdyj8',
        role: 'admin',
        permissions: ['*'], // Acesso total
      },
      {
        nome: 'Gerente Maria',
        email: 'gerente_maria@example.com',
        senha: 'senha123',
        role: 'manager',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createProduct',
          'editProduct',
          'deleteProduct',
          'viewCustomer',
          'createCustomer',
          'editCustomer',
          'deleteCustomer',
          'viewEmployee',
          'createEmployee',
          'editEmployee',
          'deleteEmployee',
          'viewIngredient',
          'createIngredient',
          'editIngredient',
          'deleteIngredient',
          'viewRecipe',
          'createRecipe',
          'editRecipe',
          'deleteRecipe',
          'createOrder',
          'manageStock',
          'viewReports',
          'processPayment',
          'viewAmbiente',
          'createAmbiente',
          'editAmbiente',
          'deleteAmbiente',
          'viewTable',
          'createTable',
          'editTable',
          'deleteTable',
          'viewReservation',
          'createReservation',
          'editReservation',
          'deleteReservation',
          'manageIfoodAuth',
          'createCategory',
          'viewCategory',
          'editCategory',
          'deleteCategory',
          'addUser',
          'manageSalesGoals',
          'viewTeamMembers',
        ],
      },
      {
        nome: 'Agente João',
        email: 'agente_joao@example.com',
        senha: 'senha123',
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null, // Será associado posteriormente
      },
      {
        nome: 'Agente Ana',
        email: 'agente_ana@example.com',
        senha: 'senha123',
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
      {
        nome: 'Feeder Pedro',
        email: 'feeder_pedro@example.com',
        senha: 'senha123',
        role: 'feeder',
        permissions: [
          'viewProduct',
        ],
        manager: null,
      },
      {
        nome: 'Gerente Carlos',
        email: 'gerente_carlos@example.com',
        senha: 'senha123',
        role: 'manager',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createProduct',
          'editProduct',
          'deleteProduct',
          'viewCustomer',
          'createCustomer',
          'editCustomer',
          'deleteCustomer',
          'viewEmployee',
          'createEmployee',
          'editEmployee',
          'deleteEmployee',
          'viewIngredient',
          'createIngredient',
          'editIngredient',
          'deleteIngredient',
          'viewRecipe',
          'createRecipe',
          'editRecipe',
          'deleteRecipe',
          'createOrder',
          'manageStock',
          'viewReports',
          'processPayment',
          'viewAmbiente',
          'createAmbiente',
          'editAmbiente',
          'deleteAmbiente',
          'viewTable',
          'createTable',
          'editTable',
          'deleteTable',
          'viewReservation',
          'createReservation',
          'editReservation',
          'deleteReservation',
          'manageIfoodAuth',
          'createCategory',
          'viewCategory',
          'editCategory',
          'deleteCategory',
          'addUser',
          'manageSalesGoals',
          'viewTeamMembers',
        ],
      },
      {
        nome: 'Agente Lucas',
        email: 'agente_lucas@example.com',
        senha: 'senha123',
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
      {
        nome: 'Agente Juliana',
        email: 'agente_juliana@example.com',
        senha: 'senha123',
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
      {
        nome: 'Feeder Fernanda',
        email: 'feeder_fernanda@example.com',
        senha: 'senha123',
        role: 'feeder',
        permissions: [
          'viewProduct',
        ],
        manager: null,
      },
      {
        nome: 'Agente Ricardo',
        email: 'agente_ricardo@example.com',
        senha: 'senha123',
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
      {
        nome: 'Agente Patrícia',
        email: 'agente_patricia@example.com',
        senha: 'senha123',
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
    ];

    const users = await User.insertMany(usersData);
    console.log('Usuários inseridos:', users.length);

    // Associar agentes e feeders aos gerentes
    const gerentes = users.filter(user => user.role === 'manager');
    const agentes = users.filter(user => user.role === 'agent');
    const feeders = users.filter(user => user.role === 'feeder');

    if (gerentes.length === 0) {
      throw new Error('Nenhum gerente encontrado para associar os agentes e feeders.');
    }

    const gerenteMaria = gerentes.find(g => g.email === 'gerente_maria@example.com');
    const gerenteCarlos = gerentes.find(g => g.email === 'gerente_carlos@example.com');

    // Distribuir agentes entre os gerentes
    agentes.forEach((agente, index) => {
      const gerente = index % 2 === 0 ? gerenteMaria : gerenteCarlos;
      agente.manager = gerente._id;
      agente.save();
    });

    // Distribuir feeders entre os gerentes
    feeders.forEach((feeder, index) => {
      const gerente = index % 2 === 0 ? gerenteMaria : gerenteCarlos;
      feeder.manager = gerente._id;
      feeder.save();
    });

    console.log('Agentes e feeders associados aos gerentes.');

    // Inserir metas de vendas
    const salesGoalsData = [
      {
        employee: users.find(user => user.email === 'agente_joao@example.com')._id,
        manager: gerenteMaria._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 5000.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_ana@example.com')._id,
        manager: gerenteMaria._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4500.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_lucas@example.com')._id,
        manager: gerenteCarlos._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4800.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_juliana@example.com')._id,
        manager: gerenteCarlos._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4700.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_ricardo@example.com')._id,
        manager: gerenteMaria._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4900.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_patricia@example.com')._id,
        manager: gerenteCarlos._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4600.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
    ];

    const salesGoals = await SalesGoal.insertMany(salesGoalsData);
    console.log('Metas de Vendas inseridas:', salesGoals.length);

    // Inserir reservas
    const reservationsData = [
      {
        cliente: customers.find(c => c.email === 'joao@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 1).id,
        dataReserva: new Date('2024-04-15T19:00:00'),
        numeroPessoas: 4,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'maria@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 3).id,
        dataReserva: new Date('2024-04-16T20:30:00'),
        numeroPessoas: 6,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'pedro@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 5).id,
        dataReserva: new Date('2024-04-17T18:00:00'),
        numeroPessoas: 2,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'ana@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 2).id,
        dataReserva: new Date('2024-04-18T19:30:00'),
        numeroPessoas: 4,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'carlos@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 4).id,
        dataReserva: new Date('2024-04-19T20:00:00'),
        numeroPessoas: 8,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'fernanda@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 6).id,
        dataReserva: new Date('2024-04-20T21:00:00'),
        numeroPessoas: 2,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'ricardo@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 7).id,
        dataReserva: new Date('2024-04-21T19:00:00'),
        numeroPessoas: 4,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'patricia@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 8).id,
        dataReserva: new Date('2024-04-22T20:30:00'),
        numeroPessoas: 4,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'lucas@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 9).id,
        dataReserva: new Date('2024-04-23T18:00:00'),
        numeroPessoas: 6,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'juliana@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 10).id,
        dataReserva: new Date('2024-04-24T19:30:00'),
        numeroPessoas: 8,
        status: 'ativa',
      },
    ];

    const reservations = await Reservation.insertMany(reservationsData);
    console.log('Reservas inseridas:', reservations.length);

    console.log('Banco de dados semeado com sucesso!');
    process.exit();
  } catch (error) {
    console.error('Erro ao semear o banco de dados:', error);
    process.exit(1);
  }
}

// Executar a função principal
seedDatabase();


// Conteúdo de: .\server.js
// server.js
const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

// Configuração do Socket.io
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

global.io = io; // Disponibiliza o io globalmente

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


// Conteúdo de: .\todos_os_scripts.js
// Conteúdo de: .\app.js
// app.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { json, urlencoded } = express;
const config = require('./config');
const rateLimit = require('express-rate-limit');


// Importar Rotas
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const tableRoutes = require('./routes/tableRoutes');
const productRoutes = require('./routes/productRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const stockRoutes = require('./routes/stockRoutes');
const reportRoutes = require('./routes/reportRoutes');
const customerRoutes = require('./routes/customerRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const ambienteRoutes = require('./routes/ambienteRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const ifoodRoutes = require('./routes/ifoodRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const salesGoalRoutes = require('./routes/salesGoalRoutes');
const userRoutes = require('./routes/userRoutes');


// Middlewares
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// Configuração de Middlewares
// app.use(cors());
app.use(cors({
  origin: 'http://localhost:3000', // Substitua pela URL do seu frontend
  credentials: true, // Permite o envio de cookies
}));
app.use(json());
app.use(urlencoded({ extended: true }));

// Limite de requisições
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 15, // Limite de 15 requisições consecutivas
  message: {
    message: 'Muitas requisições deste IP. Tente novamente em 10 minutos.',
  },
  skip: (req, res) => {
    // Pular limitação se o usuário estiver logado
    const token = req.headers['authorization'];
    return !!token;
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

// Aplicar limitador globalmente
app.use(limiter);

// Conexão com o Banco de Dados
mongoose.connect(config.mongoURI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));
  
// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ambientes', ambienteRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api', ifoodRoutes);
app.use('/api/categories', categoryRoutes)
app.use('/api/sales-goals', salesGoalRoutes);
app.use('/api/users', userRoutes);



// Middleware de Tratamento de Erros
app.use(errorMiddleware);

module.exports = app;


// Conteúdo de: .\config.js
// config.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  paymentApiKey: process.env.PAYMENT_API_KEY,
  deliveryPlatformApiKey: process.env.DELIVERY_PLATFORM_API_KEY,
};


// Conteúdo de: .\ifood.js
// Importando as dependências
const axios = require('axios');
const readline = require('readline');
const qs = require('querystring');

// Configuração do MongoDB e variáveis de ambiente
require('dotenv').config();

const IFOOD_CLIENT_ID = process.env.IFOOD_CLIENT_ID;
const IFOOD_CLIENT_SECRET = process.env.IFOOD_CLIENT_SECRET;
const IFOOD_TOKEN_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';

// Inicializando a leitura de entrada do console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para solicitar o código de usuário do iFood
envocarTokenUsuario();

function envocarTokenUsuario() {
  axios.post('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/userCode', qs.stringify({
    clientId: IFOOD_CLIENT_ID
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
    .then((response) => {
      const { userCode, authorizationCodeVerifier, verificationUrlComplete } = response.data;
      console.log(`\nPor favor, acesse o seguinte link para autorizar o aplicativo: ${verificationUrlComplete}`);
      console.log(`\nuserCode: ${userCode}`);
      console.log(`\nauthorizationCodeVerifier: ${authorizationCodeVerifier}`);
      aguardarCodigoDeAutorizacao(authorizationCodeVerifier);
    })
    .catch((error) => {
      console.error("Erro ao obter o userCode: ", error.response ? error.response.data : error.message);
    });
}

function aguardarCodigoDeAutorizacao(authorizationCodeVerifier) {
  rl.question('\nDigite o código de autorização fornecido pelo portal do iFood: ', (authorizationCode) => {
    obterTokenDeAcesso(authorizationCode, authorizationCodeVerifier);
  });
}

// Função para obter o token de acesso usando o código de autorização fornecido pelo iFood
function obterTokenDeAcesso(authorizationCode, authorizationCodeVerifier) {
  axios.post(IFOOD_TOKEN_URL, qs.stringify({
    grantType: 'authorization_code',
    clientId: IFOOD_CLIENT_ID,
    clientSecret: IFOOD_CLIENT_SECRET,
    authorizationCode: authorizationCode,
    authorizationCodeVerifier: authorizationCodeVerifier
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
    .then((response) => {
      console.log('Token de acesso obtido com sucesso:', response.data);
      rl.close();
    })
    .catch((error) => {
      console.error("Erro ao obter o token de acesso do iFood: ", error.response ? error.response.data : error.message);
      rl.close();
    });
}

// Conteúdo de: .\permissions.js
// src/permissions.js
const allPermissions = [
  'viewDashboard',
    'viewProduct',
    'createProduct',
    'editProduct',
    'deleteProduct',
    'viewCustomer',
    'createCustomer',
    'editCustomer',
    'deleteCustomer',
    'viewEmployee',
    'createEmployee',
    'editEmployee',
    'deleteEmployee',
    'viewIngredient',
    'createIngredient',
    'editIngredient',
    'deleteIngredient',
    'viewRecipe',
    'createRecipe',
    'editRecipe',
    'deleteRecipe',
    'createOrder',
    'manageStock',
    'viewReports',
    'processPayment',
    'viewAmbiente',
    'createAmbiente',
    'editAmbiente',
    'deleteAmbiente',
    'viewTable',
    'createTable',
    'editTable',
    'deleteTable',
    'viewReservation',
    'createReservation',
    'editReservation',
    'deleteReservation',
    'manageIfoodAuth',
    'createCategory',
    'viewCategory',
    'editCategory',
    'deleteCategory',
    'addUser',
    'manageSalesGoals',
    'viewTeamMembers',
    'manageOrder',
    
  // Adicione todas as outras permissões aqui
];

module.exports = allPermissions;


// Conteúdo de: .\rolePermissions.js
// rolePermissions.js
module.exports = {
    admin: ['*'], // Acesso total
    manager: [
      'viewProduct',
      'createProduct',
      'editProduct',
      'manageStock',
      // Adicione outras permissões conforme necessário
    ],
    agent: ['viewProduct', 'createSale'],
    feeder: ['viewProduct'],
  };
  

// Conteúdo de: .\seed.js
// seed.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

// Importar os modelos
const Ambiente = require('./models/Ambiente');
const Table = require('./models/Table');
const Reservation = require('./models/Reservation');
const Customer = require('./models/Customer');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');
const SalesGoal = require('./models/SalesGoal');
const Ingredient = require('./models/Ingredient');
const Recipe = require('./models/Recipe');
const AuditLog = require('./models/AuditLog');

// Carregar variáveis de ambiente
dotenv.config();

// Função principal para semear o banco de dados
async function seedDatabase() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado ao MongoDB para seed');

    // Limpar as coleções existentes
    await Ambiente.deleteMany({});
    await Table.deleteMany({});
    await Reservation.deleteMany({});
    await Customer.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    await SalesGoal.deleteMany({});
    await Ingredient.deleteMany({});
    await Recipe.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Coleções limpas com sucesso.');

    // Inserir categorias
    const categoriesData = [
      { categoria: 'Bebidas', descricao: 'Todas as bebidas disponíveis', habilitado: true },
      { categoria: 'Entradas', descricao: 'Pratos de entrada', habilitado: true },
      { categoria: 'Pratos Principais', descricao: 'Pratos principais', habilitado: true },
      { categoria: 'Sobremesas', descricao: 'Sobremesas deliciosas', habilitado: true },
      { categoria: 'Especialidades da Casa', descricao: 'Pratos exclusivos do chef', habilitado: true },
      { categoria: 'Vegano', descricao: 'Opções veganas', habilitado: true },
      { categoria: 'Sem Glúten', descricao: 'Opções sem glúten', habilitado: true },
      { categoria: 'Combos', descricao: 'Combos especiais', habilitado: true },
    ];

    const categories = await Category.insertMany(categoriesData);
    console.log('Categorias inseridas:', categories.length);

    // Inserir ingredientes
    const ingredientsData = [
      { nome: 'Tomate', unidadeMedida: 'kg', quantidadeEstoque: 100, precoCusto: 5.0 },
      { nome: 'Cebola', unidadeMedida: 'kg', quantidadeEstoque: 80, precoCusto: 3.0 },
      { nome: 'Alho', unidadeMedida: 'kg', quantidadeEstoque: 50, precoCusto: 7.0 },
      { nome: 'Frango', unidadeMedida: 'kg', quantidadeEstoque: 60, precoCusto: 20.0 },
      { nome: 'Carne Bovina', unidadeMedida: 'kg', quantidadeEstoque: 40, precoCusto: 30.0 },
      { nome: 'Batata', unidadeMedida: 'kg', quantidadeEstoque: 90, precoCusto: 4.0 },
      { nome: 'Arroz', unidadeMedida: 'kg', quantidadeEstoque: 150, precoCusto: 2.5 },
      { nome: 'Feijão', unidadeMedida: 'kg', quantidadeEstoque: 120, precoCusto: 3.5 },
      { nome: 'Leite', unidadeMedida: 'litro', quantidadeEstoque: 200, precoCusto: 4.5 },
      { nome: 'Ovo', unidadeMedida: 'unidade', quantidadeEstoque: 500, precoCusto: 0.5 },
      { nome: 'Farinha de Trigo', unidadeMedida: 'kg', quantidadeEstoque: 100, precoCusto: 3.0 },
      { nome: 'Açúcar', unidadeMedida: 'kg', quantidadeEstoque: 80, precoCusto: 2.0 },
      { nome: 'Manteiga', unidadeMedida: 'kg', quantidadeEstoque: 60, precoCusto: 10.0 },
      { nome: 'Queijo', unidadeMedida: 'kg', quantidadeEstoque: 70, precoCusto: 15.0 },
      { nome: 'Sal', unidadeMedida: 'kg', quantidadeEstoque: 200, precoCusto: 1.0 },
      { nome: 'Pimenta', unidadeMedida: 'kg', quantidadeEstoque: 50, precoCusto: 8.0 },
      { nome: 'Manjericão', unidadeMedida: 'kg', quantidadeEstoque: 30, precoCusto: 12.0 },
      { nome: 'Limão', unidadeMedida: 'kg', quantidadeEstoque: 60, precoCusto: 4.0 },
      { nome: 'Espinafre', unidadeMedida: 'kg', quantidadeEstoque: 40, precoCusto: 6.0 },
      { nome: 'Cogumelos', unidadeMedida: 'kg', quantidadeEstoque: 35, precoCusto: 18.0 },
      { nome: 'Pimentão', unidadeMedida: 'kg', quantidadeEstoque: 55, precoCusto: 5.5 },
      { nome: 'Azeite', unidadeMedida: 'litro', quantidadeEstoque: 100, precoCusto: 20.0 },
      { nome: 'Vinho Tinto', unidadeMedida: 'litro', quantidadeEstoque: 50, precoCusto: 25.0 },
      { nome: 'Vinho Branco', unidadeMedida: 'litro', quantidadeEstoque: 50, precoCusto: 22.0 },
      { nome: 'Cerveja', unidadeMedida: 'unidade', quantidadeEstoque: 300, precoCusto: 3.0 },
      { nome: 'Refrigerante', unidadeMedida: 'litro', quantidadeEstoque: 150, precoCusto: 4.0 },
      { nome: 'Suco de Laranja', unidadeMedida: 'litro', quantidadeEstoque: 100, precoCusto: 5.0 },
      { nome: 'Suco de Maçã', unidadeMedida: 'litro', quantidadeEstoque: 100, precoCusto: 5.0 },
      { nome: 'Melancia', unidadeMedida: 'kg', quantidadeEstoque: 40, precoCusto: 7.0 },
      { nome: 'Abacaxi', unidadeMedida: 'kg', quantidadeEstoque: 30, precoCusto: 6.5 },
      { nome: 'Morango', unidadeMedida: 'kg', quantidadeEstoque: 25, precoCusto: 12.0 },
      { nome: 'Banana', unidadeMedida: 'kg', quantidadeEstoque: 80, precoCusto: 3.0 },
      { nome: 'Maçã', unidadeMedida: 'kg', quantidadeEstoque: 70, precoCusto: 4.0 },
      // Ingredientes faltantes
      { nome: 'Alface', unidadeMedida: 'kg', quantidadeEstoque: 50, precoCusto: 4.0 },
      { nome: 'Parmesão', unidadeMedida: 'kg', quantidadeEstoque: 20, precoCusto: 15.0 },
      { nome: 'Camarão', unidadeMedida: 'kg', quantidadeEstoque: 40, precoCusto: 25.0 },
      { nome: 'Café', unidadeMedida: 'kg', quantidadeEstoque: 25, precoCusto: 10.0 },
      // Adicione mais ingredientes conforme necessário
    ];

    const ingredients = await Ingredient.insertMany(ingredientsData);
    console.log('Ingredientes inseridos:', ingredients.length);

    // Inserir receitas
    const recipesData = [
      {
        nome: 'Salada Caesar',
        categoria: 'Entradas',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Alho')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Cebola')._id, quantidade: 0.1 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Alface')._id, quantidade: 0.2 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Parmesão')._id, quantidade: 0.05 },
        ],
        precoVenda: 15.0,
        descricao: 'Salada clássica com alface, parmesão e molho Caesar.',
      },
      {
        nome: 'Bife Ancho',
        categoria: 'Pratos Principais',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Carne Bovina')._id, quantidade: 0.3 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Sal')._id, quantidade: 0.01 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Pimenta')._id, quantidade: 0.005 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Azeite')._id, quantidade: 0.02 },
        ],
        precoVenda: 35.0,
        descricao: 'Bife Ancho grelhado com sal e pimenta.',
      },
      {
        nome: 'Risoto de Camarão',
        categoria: 'Pratos Principais',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Arroz')._id, quantidade: 0.2 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Camarão')._id, quantidade: 0.25 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Alho')._id, quantidade: 0.02 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Cebola')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Vinho Branco')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Azeite')._id, quantidade: 0.03 },
        ],
        precoVenda: 30.0,
        descricao: 'Risoto cremoso com camarões frescos.',
      },
      {
        nome: 'Frango à Parmegiana',
        categoria: 'Pratos Principais',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Frango')._id, quantidade: 0.25 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Tomate')._id, quantidade: 0.1 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Queijo')._id, quantidade: 0.1 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Farinha de Trigo')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Ovo')._id, quantidade: 2 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Azeite')._id, quantidade: 0.02 },
        ],
        precoVenda: 28.0,
        descricao: 'Peito de frango empanado com molho de tomate e queijo derretido.',
      },
      {
        nome: 'Tiramisu',
        categoria: 'Sobremesas',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Ovo')._id, quantidade: 3 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Açúcar')._id, quantidade: 0.1 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Farinha de Trigo')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Café')._id, quantidade: 0.2 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Azeite')._id, quantidade: 0.01 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Queijo')._id, quantidade: 0.15 },
        ],
        precoVenda: 18.0,
        descricao: 'Sobremesa italiana clássica com camadas de queijo mascarpone e café.',
      },
      // Adicione mais receitas conforme necessário
    ];

    const recipes = await Recipe.insertMany(recipesData);
    console.log('Receitas inseridas:', recipes.length);

    // Inserir produtos
    const productsData = [
      { nome: 'Coca-Cola', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 5.0, descricao: 'Refrigerante Coca-Cola 350ml', disponivel: true, quantidadeEstoque: 200 },
      { nome: 'Suco de Laranja Natural', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 6.5, descricao: 'Suco de laranja natural 500ml', disponivel: true, quantidadeEstoque: 150 },
      { nome: 'Água Mineral', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 3.0, descricao: 'Água mineral sem gás 500ml', disponivel: true, quantidadeEstoque: 300 },
      { nome: 'Salada Caesar', categoria: categories.find(cat => cat.categoria === 'Entradas')._id, preco: 15.0, descricao: 'Salada Caesar com croutons e parmesão', disponivel: true, quantidadeEstoque: 80 },
      { nome: 'Bruschetta', categoria: categories.find(cat => cat.categoria === 'Entradas')._id, preco: 12.0, descricao: 'Bruschetta tradicional com tomate e manjericão', disponivel: true, quantidadeEstoque: 60 },
      { nome: 'Sopa de Abóbora', categoria: categories.find(cat => cat.categoria === 'Entradas')._id, preco: 14.0, descricao: 'Sopa cremosa de abóbora com gengibre', disponivel: true, quantidadeEstoque: 70 },
      { nome: 'Bife Ancho', categoria: categories.find(cat => cat.categoria === 'Pratos Principais')._id, preco: 35.0, descricao: 'Bife Ancho grelhado ao ponto', disponivel: true, quantidadeEstoque: 50 },
      { nome: 'Risoto de Camarão', categoria: categories.find(cat => cat.categoria === 'Pratos Principais')._id, preco: 30.0, descricao: 'Risoto cremoso com camarões frescos', disponivel: true, quantidadeEstoque: 45 },
      { nome: 'Frango à Parmegiana', categoria: categories.find(cat => cat.categoria === 'Pratos Principais')._id, preco: 28.0, descricao: 'Peito de frango empanado com molho de tomate e queijo', disponivel: true, quantidadeEstoque: 60 },
      { nome: 'Tiramisu', categoria: categories.find(cat => cat.categoria === 'Sobremesas')._id, preco: 18.0, descricao: 'Sobremesa italiana com camadas de queijo mascarpone e café', disponivel: true, quantidadeEstoque: 40 },
      { nome: 'Pudim de Leite', categoria: categories.find(cat => cat.categoria === 'Sobremesas')._id, preco: 16.0, descricao: 'Pudim de leite cremoso', disponivel: true, quantidadeEstoque: 50 },
      { nome: 'Cheesecake', categoria: categories.find(cat => cat.categoria === 'Sobremesas')._id, preco: 20.0, descricao: 'Cheesecake com cobertura de frutas vermelhas', disponivel: true, quantidadeEstoque: 35 },
      { nome: 'Prato Especial do Chef', categoria: categories.find(cat => cat.categoria === 'Especialidades da Casa')._id, preco: 40.0, descricao: 'Prato exclusivo preparado pelo chef', disponivel: true, quantidadeEstoque: 25 },
      { nome: 'Lasanha Trufada', categoria: categories.find(cat => cat.categoria === 'Especialidades da Casa')._id, preco: 38.0, descricao: 'Lasanha com molho trufado e cogumelos', disponivel: true, quantidadeEstoque: 30 },
      { nome: 'Polvo à Lagareiro', categoria: categories.find(cat => cat.categoria === 'Especialidades da Casa')._id, preco: 45.0, descricao: 'Polvo assado com batatas e azeite', disponivel: true, quantidadeEstoque: 20 },
      { nome: 'Espinafre ao Alho', categoria: categories.find(cat => cat.categoria === 'Vegano')._id, preco: 12.0, descricao: 'Espinafre refogado com alho e azeite', disponivel: true, quantidadeEstoque: 50 },
      { nome: 'Risoto Vegano', categoria: categories.find(cat => cat.categoria === 'Vegano')._id, preco: 25.0, descricao: 'Risoto vegano com legumes frescos', disponivel: true, quantidadeEstoque: 30 },
      { nome: 'Salada Sem Glúten', categoria: categories.find(cat => cat.categoria === 'Sem Glúten')._id, preco: 14.0, descricao: 'Salada fresca sem ingredientes com glúten', disponivel: true, quantidadeEstoque: 40 },
      { nome: 'Pizza Vegana', categoria: categories.find(cat => cat.categoria === 'Sem Glúten')._id, preco: 22.0, descricao: 'Pizza vegana com massa sem glúten', disponivel: true, quantidadeEstoque: 35 },
      { nome: 'Combo Família', categoria: categories.find(cat => cat.categoria === 'Combos')._id, preco: 80.0, descricao: 'Combo para família com entradas, pratos principais e sobremesas', disponivel: true, quantidadeEstoque: 20 },
      { nome: 'Combo Amigos', categoria: categories.find(cat => cat.categoria === 'Combos')._id, preco: 60.0, descricao: 'Combo para amigos com diversas opções de pratos', disponivel: true, quantidadeEstoque: 25 },
      { nome: 'Cerveja Long Neck', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 3.0, descricao: 'Cerveja Long Neck 330ml', disponivel: true, quantidadeEstoque: 300 },
      { nome: 'Vinho Rosé', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 28.0, descricao: 'Vinho rosé 750ml', disponivel: true, quantidadeEstoque: 40 },
      { nome: 'Espumante Brut', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 35.0, descricao: 'Espumante brut 750ml', disponivel: true, quantidadeEstoque: 30 },
      { nome: 'Whisky', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 50.0, descricao: 'Whisky envelhecido 1 ano', disponivel: true, quantidadeEstoque: 25 },
      // Adicione mais produtos conforme necessário
    ];

    const products = await Product.insertMany(productsData);
    console.log('Produtos inseridos:', products.length);

    // Inserir ambientes
    const ambientesData = [
      { nome: 'Sala Principal', limitePessoas: 50 },
      { nome: 'Terraço', limitePessoas: 30 },
      { nome: 'Salão Privativo', limitePessoas: 20 },
      { nome: 'Bar', limitePessoas: 25 },
      { nome: 'Cozinha', limitePessoas: 10 },
      { nome: 'Banheiro Masculino', limitePessoas: 10 },
      { nome: 'Banheiro Feminino', limitePessoas: 10 },
    ];

    const ambientes = await Ambiente.insertMany(ambientesData);
    console.log('Ambientes inseridos:', ambientes.length);

    // Inserir mesas
    const tablesData = [
      { numeroMesa: 1, ambiente: ambientes.find(a => a.nome === 'Sala Principal')._id, position: { x: 10, y: 20 }, numeroAssentos: 4 },
      { numeroMesa: 2, ambiente: ambientes.find(a => a.nome === 'Sala Principal')._id, position: { x: 30, y: 20 }, numeroAssentos: 4 },
      { numeroMesa: 3, ambiente: ambientes.find(a => a.nome === 'Terraço')._id, position: { x: 10, y: 50 }, numeroAssentos: 6 },
      { numeroMesa: 4, ambiente: ambientes.find(a => a.nome === 'Salão Privativo')._id, position: { x: 50, y: 20 }, numeroAssentos: 8 },
      { numeroMesa: 5, ambiente: ambientes.find(a => a.nome === 'Bar')._id, position: { x: 70, y: 20 }, numeroAssentos: 2 },
      { numeroMesa: 6, ambiente: ambientes.find(a => a.nome === 'Bar')._id, position: { x: 90, y: 20 }, numeroAssentos: 2 },
      { numeroMesa: 7, ambiente: ambientes.find(a => a.nome === 'Sala Principal')._id, position: { x: 110, y: 20 }, numeroAssentos: 4 },
      { numeroMesa: 8, ambiente: ambientes.find(a => a.nome === 'Sala Principal')._id, position: { x: 130, y: 20 }, numeroAssentos: 4 },
      { numeroMesa: 9, ambiente: ambientes.find(a => a.nome === 'Terraço')._id, position: { x: 10, y: 80 }, numeroAssentos: 6 },
      { numeroMesa: 10, ambiente: ambientes.find(a => a.nome === 'Salão Privativo')._id, position: { x: 150, y: 20 }, numeroAssentos: 8 },
      // Adicione mais mesas conforme necessário
    ];

    const tables = await Table.insertMany(tablesData);
    console.log('Mesas inseridas:', tables.length);

    // Inserir clientes
    const customersData = [
      { nome: 'João Silva', cpf: '123.456.789-00', email: 'joao@example.com', telefone: '11999999999' },
      { nome: 'Maria Souza', cpf: '987.654.321-00', email: 'maria@example.com', telefone: '11888888888' },
      { nome: 'Pedro Oliveira', cpf: '456.789.123-00', email: 'pedro@example.com', telefone: '11777777777' },
      { nome: 'Ana Paula', cpf: '321.654.987-00', email: 'ana@example.com', telefone: '11666666666' },
      { nome: 'Carlos Alberto', cpf: '654.321.789-00', email: 'carlos@example.com', telefone: '11555555555' },
      { nome: 'Fernanda Lima', cpf: '789.123.456-00', email: 'fernanda@example.com', telefone: '11444444444' },
      { nome: 'Ricardo Dias', cpf: '147.258.369-00', email: 'ricardo@example.com', telefone: '11333333333' },
      { nome: 'Patrícia Gomes', cpf: '369.258.147-00', email: 'patricia@example.com', telefone: '11222222222' },
      { nome: 'Lucas Martins', cpf: '258.147.369-00', email: 'lucas@example.com', telefone: '11111111111' },
      { nome: 'Juliana Costa', cpf: '159.753.486-00', email: 'juliana@example.com', telefone: '11000000000' },
    ];

    const customers = await Customer.insertMany(customersData);
    console.log('Clientes inseridos:', customers.length);

    // Inserir usuários (administradores, gerentes, agentes, feeders)
    const hashedPasswordAdmin = await bcrypt.hash('mzgxdyj8', 10); // Senha para admin
    const hashedPasswordUsers = await bcrypt.hash('senha123', 10); // Senhas padrão para outros usuários

    const usersData = [
      {
        nome: 'AGB Junior',
        email: 'agb_junior@live.com',
        senha: 'mzgxdyj8',
        role: 'admin',
        permissions: ['*'], // Acesso total
      },
      {
        nome: 'Gerente Maria',
        email: 'gerente_maria@example.com',
        senha: 'senha123',
        role: 'manager',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createProduct',
          'editProduct',
          'deleteProduct',
          'viewCustomer',
          'createCustomer',
          'editCustomer',
          'deleteCustomer',
          'viewEmployee',
          'createEmployee',
          'editEmployee',
          'deleteEmployee',
          'viewIngredient',
          'createIngredient',
          'editIngredient',
          'deleteIngredient',
          'viewRecipe',
          'createRecipe',
          'editRecipe',
          'deleteRecipe',
          'createOrder',
          'manageStock',
          'viewReports',
          'processPayment',
          'viewAmbiente',
          'createAmbiente',
          'editAmbiente',
          'deleteAmbiente',
          'viewTable',
          'createTable',
          'editTable',
          'deleteTable',
          'viewReservation',
          'createReservation',
          'editReservation',
          'deleteReservation',
          'manageIfoodAuth',
          'createCategory',
          'viewCategory',
          'editCategory',
          'deleteCategory',
          'addUser',
          'manageSalesGoals',
          'viewTeamMembers',
        ],
      },
      {
        nome: 'Agente João',
        email: 'agente_joao@example.com',
        senha: 'senha123',
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null, // Será associado posteriormente
      },
      {
        nome: 'Agente Ana',
        email: 'agente_ana@example.com',
        senha: 'senha123',
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
      {
        nome: 'Feeder Pedro',
        email: 'feeder_pedro@example.com',
        senha: 'senha123',
        role: 'feeder',
        permissions: [
          'viewProduct',
        ],
        manager: null,
      },
      {
        nome: 'Gerente Carlos',
        email: 'gerente_carlos@example.com',
        senha: 'senha123',
        role: 'manager',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createProduct',
          'editProduct',
          'deleteProduct',
          'viewCustomer',
          'createCustomer',
          'editCustomer',
          'deleteCustomer',
          'viewEmployee',
          'createEmployee',
          'editEmployee',
          'deleteEmployee',
          'viewIngredient',
          'createIngredient',
          'editIngredient',
          'deleteIngredient',
          'viewRecipe',
          'createRecipe',
          'editRecipe',
          'deleteRecipe',
          'createOrder',
          'manageStock',
          'viewReports',
          'processPayment',
          'viewAmbiente',
          'createAmbiente',
          'editAmbiente',
          'deleteAmbiente',
          'viewTable',
          'createTable',
          'editTable',
          'deleteTable',
          'viewReservation',
          'createReservation',
          'editReservation',
          'deleteReservation',
          'manageIfoodAuth',
          'createCategory',
          'viewCategory',
          'editCategory',
          'deleteCategory',
          'addUser',
          'manageSalesGoals',
          'viewTeamMembers',
        ],
      },
      {
        nome: 'Agente Lucas',
        email: 'agente_lucas@example.com',
        senha: 'senha123',
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
      {
        nome: 'Agente Juliana',
        email: 'agente_juliana@example.com',
        senha: 'senha123',
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
      {
        nome: 'Feeder Fernanda',
        email: 'feeder_fernanda@example.com',
        senha: 'senha123',
        role: 'feeder',
        permissions: [
          'viewProduct',
        ],
        manager: null,
      },
      {
        nome: 'Agente Ricardo',
        email: 'agente_ricardo@example.com',
        senha: 'senha123',
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
      {
        nome: 'Agente Patrícia',
        email: 'agente_patricia@example.com',
        senha: 'senha123',
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
    ];

    const users = await User.insertMany(usersData);
    console.log('Usuários inseridos:', users.length);

    // Associar agentes e feeders aos gerentes
    const gerentes = users.filter(user => user.role === 'manager');
    const agentes = users.filter(user => user.role === 'agent');
    const feeders = users.filter(user => user.role === 'feeder');

    if (gerentes.length === 0) {
      throw new Error('Nenhum gerente encontrado para associar os agentes e feeders.');
    }

    const gerenteMaria = gerentes.find(g => g.email === 'gerente_maria@example.com');
    const gerenteCarlos = gerentes.find(g => g.email === 'gerente_carlos@example.com');

    // Distribuir agentes entre os gerentes
    agentes.forEach((agente, index) => {
      const gerente = index % 2 === 0 ? gerenteMaria : gerenteCarlos;
      agente.manager = gerente._id;
      agente.save();
    });

    // Distribuir feeders entre os gerentes
    feeders.forEach((feeder, index) => {
      const gerente = index % 2 === 0 ? gerenteMaria : gerenteCarlos;
      feeder.manager = gerente._id;
      feeder.save();
    });

    console.log('Agentes e feeders associados aos gerentes.');

    // Inserir metas de vendas
    const salesGoalsData = [
      {
        employee: users.find(user => user.email === 'agente_joao@example.com')._id,
        manager: gerenteMaria._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 5000.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_ana@example.com')._id,
        manager: gerenteMaria._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4500.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_lucas@example.com')._id,
        manager: gerenteCarlos._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4800.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_juliana@example.com')._id,
        manager: gerenteCarlos._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4700.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_ricardo@example.com')._id,
        manager: gerenteMaria._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4900.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_patricia@example.com')._id,
        manager: gerenteCarlos._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4600.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
    ];

    const salesGoals = await SalesGoal.insertMany(salesGoalsData);
    console.log('Metas de Vendas inseridas:', salesGoals.length);

    // Inserir reservas
    const reservationsData = [
      {
        cliente: customers.find(c => c.email === 'joao@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 1).id,
        dataReserva: new Date('2024-04-15T19:00:00'),
        numeroPessoas: 4,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'maria@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 3).id,
        dataReserva: new Date('2024-04-16T20:30:00'),
        numeroPessoas: 6,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'pedro@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 5).id,
        dataReserva: new Date('2024-04-17T18:00:00'),
        numeroPessoas: 2,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'ana@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 2).id,
        dataReserva: new Date('2024-04-18T19:30:00'),
        numeroPessoas: 4,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'carlos@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 4).id,
        dataReserva: new Date('2024-04-19T20:00:00'),
        numeroPessoas: 8,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'fernanda@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 6).id,
        dataReserva: new Date('2024-04-20T21:00:00'),
        numeroPessoas: 2,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'ricardo@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 7).id,
        dataReserva: new Date('2024-04-21T19:00:00'),
        numeroPessoas: 4,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'patricia@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 8).id,
        dataReserva: new Date('2024-04-22T20:30:00'),
        numeroPessoas: 4,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'lucas@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 9).id,
        dataReserva: new Date('2024-04-23T18:00:00'),
        numeroPessoas: 6,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'juliana@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 10).id,
        dataReserva: new Date('2024-04-24T19:30:00'),
        numeroPessoas: 8,
        status: 'ativa',
      },
    ];

    const reservations = await Reservation.insertMany(reservationsData);
    console.log('Reservas inseridas:', reservations.length);

    console.log('Banco de dados semeado com sucesso!');
    process.exit();
  } catch (error) {
    console.error('Erro ao semear o banco de dados:', error);
    process.exit(1);
  }
}

// Executar a função principal
seedDatabase();


// Conteúdo de: .\controllers\ambienteController.js
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


// Conteúdo de: .\controllers\authController.js
// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');
const rolePermissions = require('../rolePermissions');
const allPermissions = require("../permissions");
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailUtil');
const AuditLog = require('../models/AuditLog'); // Importar o modelo de auditoria

exports.register = async (req, res) => {
  try {
    const { nome, email, senha, role, permissions, managerId } = req.body; // Adicionado managerId

    let userPermissions = permissions;

    if (!permissions || permissions.length === 0) {
      // Se nenhuma permissão for fornecida, atribua as permissões padrão da role
      userPermissions = rolePermissions[role] || [];
    }

    if (role !== 'admin' && userPermissions.includes('*')) {
      return res.status(400).json({
        message: 'Somente usuários com role "admin" podem ter acesso total.',
      });
    }

    // Verificar se o usuário sendo criado é um agente e associar a um gerente
    let manager = null;
    if (role === 'agent') {
      // Verifica se o managerId foi fornecido
      if (!managerId) {
        return res.status(400).json({ message: 'ID do gerente é obrigatório para agentes.' });
      }

      // Busca o gerente no banco de dados
      manager = await User.findById(managerId);
      if (!manager || (manager.role !== 'manager' && manager.role !== 'admin')) {
        return res.status(400).json({ message: 'Gerente inválido.' });
      }
    }

    const user = new User({
      nome,
      email,
      senha,
      role,
      permissions: userPermissions,
      manager: manager ? manager._id : undefined, // Associar o gerente se houver
    });

    await user.save();

    // Registrar ação de criação de usuário
    await AuditLog.create({
      userId: req.user ? req.user.id : user._id, // Caso o usuário não esteja logado (registro inicial)
      userEmail: req.user ? req.user.email : user.email,
      action: 'register_user',
      details: {
        createdUserId: user._id,
        createdUserEmail: user.email,
        role: user.role,
      },
    });

    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao registrar usuário', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Usuário não encontrado' });

    const isMatch = await user.comparePassword(senha);
    if (!isMatch) return res.status(400).json({ message: 'Senha incorreta' });
    
    if (user.role === 'admin') {
      user.permissions = allPermissions;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, permissions: user.permissions },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    // Registrar ação de login
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      action: 'login',
      details: {
        message: 'Usuário fez login',
        ip: req.ip,
      },
    });

    res.json({
      token,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao fazer login', error: error.message });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Usuário não encontrado' });

    // Gerar OTP e tempo de expiração
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Gera um número de 6 dígitos
    const expires = Date.now() + 10 * 60 * 1000; // Expira em 10 minutos

    // Atualizar o usuário com o OTP e expiração
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = expires;
    await user.save();

    // Enviar o email com o OTP
    const subject = 'Recuperação de Senha';
    const text = `Seu código de recuperação de senha é: ${otp}. Ele expira em 10 minutos.`;
    await sendEmail(user.email, subject, text);

    res.json({ message: 'OTP enviado para o email cadastrado' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao solicitar recuperação de senha', error: error.message });
  }
};

exports.resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, novaSenha } = req.body;

    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Usuário não encontrado' });

    // Verificar se o OTP é válido e não expirou
    if (user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP inválido ou expirado' });
    }

    // Atualizar a senha do usuário
    user.senha = novaSenha;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao redefinir senha', error: error.message });
  }
};


// Conteúdo de: .\controllers\categoryController.js
// controllers/categoryController.js
const Category = require('../models/Category');

exports.createCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    const category = new Category(categoryData);
    await category.save();
    res.status(201).json({ message: 'Categoria criada com sucesso', category });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar categoria', error: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter categorias', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const updates = req.body;

    const category = await Category.findByIdAndUpdate(categoryId, updates, { new: true });
    res.json({ message: 'Categoria atualizada com sucesso', category });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar categoria', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) return res.status(404).json({ message: 'Categoria não encontrada' });
    res.json({ message: 'Categoria excluída com sucesso', category });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir categoria', error: error.message });
  }
};


// Conteúdo de: .\controllers\customerController.js
// controllers/customerController.js
const Customer = require('../models/Customer');

exports.createCustomer = async (req, res) => {
  try {
    const { nome, cpf, telefone, email } = req.body;
    const customer = new Customer({ nome, cpf, telefone, email });
    await customer.save();
    res.status(201).json({ message: 'Cliente criado com sucesso', customer });
  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `${duplicatedField.toUpperCase()} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao criar cliente', error: error.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate('historicoPedidos');
    res.json(customers);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter clientes', error: error.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('historicoPedidos');
    if (!customer) return res.status(404).json({ message: 'Cliente não encontrado' });
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter cliente', error: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { nome, cpf, telefone, email } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { nome, cpf, telefone, email },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ message: 'Cliente não encontrado' });
    res.json({ message: 'Cliente atualizado com sucesso', customer });
  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `${duplicatedField.toUpperCase()} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao atualizar cliente', error: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Cliente não encontrado' });
    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir cliente', error: error.message });
  }
};


// Conteúdo de: .\controllers\employeeController.js
// controllers/EmployeeController.js
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');

exports.createEmployee = async (req, res) => {
  try {
    const { nome, funcao, email, senha } = req.body;

    // Definir permissões com base na função
    let permissoes = [];
    switch (funcao) {
      case 'Garçom':
        permissoes = ['createOrder', 'viewOrder'];
        break;
      case 'Cozinheiro':
        permissoes = ['viewOrder', 'updateOrderStatus'];
        break;
      case 'Gerente':
        permissoes = ['manageEmployees', 'manageProducts', 'manageOrders', 'viewReports'];
        break;
      default:
        permissoes = [];
    }

    const employee = new Employee({ nome, funcao, email, senha, permissoes });
    await employee.save();

    // Remover a senha antes de enviar a resposta
    const employeeResponse = employee.toObject();
    delete employeeResponse.senha;

    res.status(201).json({ message: 'Funcionário criado com sucesso', employee: employeeResponse });
  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `${duplicatedField.toUpperCase()} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao criar funcionário', error: error.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select('-senha');
    res.json(employees);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter funcionários', error: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select('-senha');
    if (!employee) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter funcionário', error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { nome, funcao, email, senha } = req.body;

    let updateData = { nome, funcao, email };
    if (senha) {
      updateData.senha = senha;
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!employee) return res.status(404).json({ message: 'Funcionário não encontrado' });

    // Remover a senha antes de enviar a resposta
    const employeeResponse = employee.toObject();
    delete employeeResponse.senha;

    res.json({ message: 'Funcionário atualizado com sucesso', employee: employeeResponse });
  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `${duplicatedField.toUpperCase()} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao atualizar funcionário', error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id).select('-senha');
    if (!employee) return res.status(404).json({ message: 'Funcionário não encontrado' });
    res.json({ message: 'Funcionário excluído com sucesso', employee });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir funcionário', error: error.message });
  }
};

exports.loginEmployee = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(404).json({ message: 'Funcionário não encontrado' });

    const isMatch = await employee.comparePassword(senha);
    if (!isMatch) return res.status(400).json({ message: 'Senha incorreta' });

    const token = jwt.sign(
      { id: employee._id, funcao: employee.funcao, permissoes: employee.permissoes },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ message: 'Login bem-sucedido', token });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao realizar login', error: error.message });
  }
};


// Conteúdo de: .\controllers\enviromentController.js
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


// Conteúdo de: .\controllers\finalizedTableController.js
// controllers/finalizedTableController.js
const Table = require('../models/Table');
const FinalizedTable = require('../models/FinalizedTable');

exports.finalizeTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    // Encontrar a mesa pelo ID
    const table = await Table.findById(tableId);

    // Verificar se a mesa está ocupada
    if (!table || table.status !== 'OCUPADA') {
      return res.status(400).json({ message: 'Mesa não está ocupada ou não encontrada' });
    }

    // Criar um registro de mesa finalizada
    const finalizedTable = new FinalizedTable({
      numeroMesa: table.numeroMesa,
      ambienteId: table.ambienteId,
      garcomId: table.garcomId,
      pedidos: table.pedidos,
      valorTotal: table.valorTotal,
    });

    // Salvar o registro da mesa finalizada
    await finalizedTable.save();

    // Atualizar a mesa original para DISPONIVEL e limpar os dados
    table.status = 'DISPONIVEL';
    table.garcomId = null;
    table.pedidos = [];
    table.valorTotal = 0;

    // Salvar as alterações da mesa
    await table.save();

    res.status(200).json({ message: 'Mesa finalizada com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao finalizar mesa', error: error.message });
  }
};

exports.getFinalizedTables = async (req, res) => {
  try {
    const finalizedTables = await FinalizedTable.find().populate('ambienteId garcomId pedidos');
    res.json(finalizedTables);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter mesas finalizadas', error: error.message });
  }
};

exports.getFinalizedTableById = async (req, res) => {
  try {
    const { tableId } = req.params;
    const finalizedTable = await FinalizedTable.findById(tableId).populate('ambienteId garcomId pedidos');

    if (!finalizedTable) {
      return res.status(404).json({ message: 'Mesa finalizada não encontrada' });
    }

    res.json(finalizedTable);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter mesa finalizada', error: error.message });
  }
};


// Conteúdo de: .\controllers\ifoodAuthController.js
// controllers/ifoodAuthController.js
const axios = require('axios');
const qs = require('querystring');
const IfoodToken = require('../models/IfoodToken');
require('dotenv').config();

const IFOOD_CLIENT_ID = process.env.IFOOD_CLIENT_ID;
const IFOOD_CLIENT_SECRET = process.env.IFOOD_CLIENT_SECRET;
const IFOOD_TOKEN_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';
const IFOOD_USER_CODE_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/userCode';

// Função para iniciar o processo de autenticação
exports.startAuth = async (req, res) => {
  try {
    const response = await axios.post(IFOOD_USER_CODE_URL, qs.stringify({
      clientId: IFOOD_CLIENT_ID,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { userCode, authorizationCodeVerifier, verificationUrlComplete } = response.data;

    // Salvar o authorizationCodeVerifier na sessão ou em um armazenamento temporário
    req.session.authorizationCodeVerifier = authorizationCodeVerifier;

    res.json({
      userCode,
      verificationUrlComplete,
    });
  } catch (error) {
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
};

// Função para concluir a autenticação e obter o token de acesso
exports.completeAuth = async (req, res) => {
  const { authorizationCode } = req.body;
  const authorizationCodeVerifier = req.session.authorizationCodeVerifier;

  if (!authorizationCode || !authorizationCodeVerifier) {
    return res.status(400).json({ error: 'Código de autorização e verificador são necessários.' });
  }

  try {
    const response = await axios.post(IFOOD_TOKEN_URL, qs.stringify({
      grantType: 'authorization_code',
      clientId: IFOOD_CLIENT_ID,
      clientSecret: IFOOD_CLIENT_SECRET,
      authorizationCode: authorizationCode,
      authorizationCodeVerifier: authorizationCodeVerifier,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { accessToken, refreshToken, expiresIn } = response.data;

    // Salvar o token no banco de dados
    const tokenData = new IfoodToken({
      accessToken,
      refreshToken,
      expiresIn,
    });

    await tokenData.save();

    // Limpar o authorizationCodeVerifier da sessão
    req.session.authorizationCodeVerifier = null;

    res.json({ message: 'Token de acesso salvo com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
};


// Conteúdo de: .\controllers\ingredientController.js
// controllers/ingredientController.js
const Ingredient = require('../models/Ingredient');

exports.createIngredient = async (req, res) => {
  try {
    const { nome, unidadeMedida, quantidadeEstoque, precoCusto } = req.body;
    const ingredient = new Ingredient({ nome, unidadeMedida, quantidadeEstoque, precoCusto });
    await ingredient.save();
    res.status(201).json({ message: 'Ingrediente criado com sucesso', ingredient });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao criar ingrediente', error: error.message });
  }
};

exports.getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.json(ingredients);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter ingredientes', error: error.message });
  }
};

exports.getIngredientById = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return res.status(404).json({ message: 'Ingrediente não encontrado' });
    res.json(ingredient);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter ingrediente', error: error.message });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const { nome, unidadeMedida, quantidadeEstoque, precoCusto } = req.body;
    const ingredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      { nome, unidadeMedida, quantidadeEstoque, precoCusto },
      { new: true, runValidators: true }
    );
    if (!ingredient) return res.status(404).json({ message: 'Ingrediente não encontrado' });
    res.json({ message: 'Ingrediente atualizado com sucesso', ingredient });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao atualizar ingrediente', error: error.message });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!ingredient) return res.status(404).json({ message: 'Ingrediente não encontrado' });
    res.json({ message: 'Ingrediente excluído com sucesso' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir ingrediente', error: error.message });
  }
};


// Conteúdo de: .\controllers\integrationController.js
// controllers/integrationController.js
const axios = require('axios');
const config = require('../config');
const Order = require('../models/Order');

exports.fetchDeliveryOrders = async (req, res) => {
  try {
    // Exemplo: Buscar pedidos da API do iFood
    const response = await axios.get('https://api.ifood.com.br/v1/orders', {
      headers: {
        Authorization: `Bearer ${config.deliveryPlatformApiKey}`,
      },
    });

    const externalOrders = response.data;

    // Processar e salvar pedidos no sistema
    for (const extOrder of externalOrders) {
      // Mapear pedido externo para o formato do seu sistema
      // Implementar lógica de mapeamento aqui

      // Salvar o pedido no banco de dados
      const order = new Order({
        // Mapear campos apropriadamente
      });
      await order.save();

      // Emite evento
      global.io.emit('novo_pedido', order);
    }

    res.json({ message: 'Pedidos de entrega importados e processados' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter pedidos de entrega', error: error.message });
  }
};


// Conteúdo de: .\controllers\orderController.js
// controllers/orderController.js
const Order = require('../models/Order');
const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const Table = require('../models/Table');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const printUtil = require('../utils/printUtil');

exports.createOrder = async (req, res) => {
  try {
    const { mesaId, assentos, itens, clienteId, garcomId, tipoPedido, numeroAssento, nomeCliente, enderecoEntrega } = req.body;

    let total = 0;

    // Calcula o total do pedido e verifica a existência das receitas
    for (const item of itens) {
      const recipe = await Recipe.findById(item.receita);
      if (!recipe) {
        return res.status(404).json({ message: `Receita com ID ${item.receita} não encontrada` });
      }
      total += recipe.precoVenda * item.quantidade;
    }

    const orderData = {
      mesa: mesaId,
      assentos,
      itens,
      cliente: clienteId,
      garcom: garcomId,
      total,
      status: 'Pendente',
    };

    // Ajustes específicos para pedidos locais ou de entrega
    if (tipoPedido === 'local') {
      orderData.tipoPedido = 'local';
      orderData.numeroAssento = numeroAssento;

      // Atualiza status da mesa para 'ocupada'
      await Table.findByIdAndUpdate(mesaId, { status: 'ocupada' });
    } else if (tipoPedido === 'entrega') {
      orderData.tipoPedido = 'entrega';
      orderData.nomeCliente = nomeCliente;
      orderData.enderecoEntrega = enderecoEntrega;
    }

    const order = new Order(orderData);
    await order.save();

    // Atualizar estoque de ingredientes
    for (const item of itens) {
      const recipe = await Recipe.findById(item.receita).populate('ingredientes.ingrediente');
      for (const ing of recipe.ingredientes) {
        const ingredient = await Ingredient.findById(ing.ingrediente._id);
        if (ingredient.quantidadeEstoque < ing.quantidade * item.quantidade) {
          return res.status(400).json({ message: `Estoque insuficiente para o ingrediente ${ingredient.nome}` });
        }
        ingredient.quantidadeEstoque -= ing.quantidade * item.quantidade;
        await ingredient.save();
      }
    }

    // Emissão de nota fiscal (NFC-e) - Implementar conforme a integração necessária
    // Exemplo simplificado:
    // const invoice = await generateNFCe(order);
    // order.notaFiscal = invoice._id;
    // await order.save();

    // Envia para impressão remota
    printUtil.printOrder(order);

    // Emite evento em tempo real para notificações de novo pedido
    if (global.io) {
      global.io.emit('novo_pedido', order);
    }

    res.status(201).json({ message: 'Pedido criado com sucesso', order });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(400).json({ message: 'Erro ao criar pedido', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Validação do status
    const validStatuses = ['Pendente', 'Preparando', 'Pronto', 'Entregue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('mesa').populate('assentos').populate('itens.receita').populate('cliente').populate('garcom');

    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    // Emite evento em tempo real para atualizações de status de pedidos
    if (global.io) {
      global.io.emit('atualizacao_pedido', order);
    }

    res.json({ message: 'Status do pedido atualizado com sucesso', order });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(400).json({ message: 'Erro ao atualizar status do pedido', error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('mesa')
      .populate('assentos')
      .populate('itens.receita')
      .populate('cliente')
      .populate('garcom')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Erro ao obter pedidos:', error);
    res.status(400).json({ message: 'Erro ao obter pedidos', error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('mesa')
      .populate('assentos')
      .populate('itens.receita')
      .populate('cliente')
      .populate('garcom');
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    res.json(order);
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(400).json({ message: 'Erro ao obter pedido', error: error.message });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('cliente').populate('garcom');
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    // Lógica para geração de NFC-e deve ser implementada conforme a integração escolhida
    // Aqui, apenas simulamos a criação de uma fatura
    const numeroFatura = `FAT-${Date.now()}`;
    const invoice = new Invoice({
      pedido: orderId,
      numeroFatura,
      valorTotal: order.total,
      cliente: order.cliente,
      garcom: order.garcom,
    });

    await invoice.save();

    // Atualizar o pedido com a referência da nota fiscal, se necessário
    // order.notaFiscal = invoice._id;
    // await order.save();

    res.json({ message: 'Fatura gerada com sucesso', invoice });
  } catch (error) {
    console.error('Erro ao gerar fatura:', error);
    res.status(400).json({ message: 'Erro ao gerar fatura', error: error.message });
  }
};


// Conteúdo de: .\controllers\paymentController.js
// controllers/paymentController.js
const Payment = require('../models/Payment');
const Order = require('../models/Order');

exports.processPayment = async (req, res) => {
  try {
    const { pedidoId, metodoPagamento, valorPago } = req.body;

    const order = await Order.findById(pedidoId);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    if (order.total > valorPago) {
      return res.status(400).json({ message: 'Valor pago insuficiente' });
    }

    const troco = valorPago - order.total;

    const payment = new Payment({
      pedido: pedidoId,
      metodoPagamento,
      valorPago,
      troco,
      notaFiscalEmitida: false, // Atualizar conforme a emissão da nota fiscal
    });

    await payment.save();

    // Atualizar status do pedido para "Pago"
    order.status = 'Pago';
    await order.save();

    // Emissão da NFC-e (Implementar conforme a integração com serviços de emissão)

    res.status(201).json({ message: 'Pagamento processado com sucesso', payment });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao processar pagamento', error: error.message });
  }
};


// Conteúdo de: .\controllers\productController.js
// controllers/productController.js
const Product = require('../models/Product');

exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;

    const product = new Product(productData);
    await product.save();
    res.status(201).json({ message: 'Produto criado com sucesso', product });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar produto', error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('categoria');
    res.json(products);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter produtos', error: error.message });
  }
};

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

exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(productId, updates, { new: true });
    res.json({ message: 'Produto atualizado com sucesso', product });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar produto', error: error.message });
  }
};

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


// Conteúdo de: .\controllers\recipeController.js
// controllers/recipeController.js
const Recipe = require('../models/Recipe');

exports.createRecipe = async (req, res) => {
  try {
    const { nome, categoria, ingredientes, precoVenda, descricao } = req.body;
    const recipe = new Recipe({ nome, categoria, ingredientes, precoVenda, descricao });
    await recipe.save();
    res.status(201).json({ message: 'Receita criada com sucesso', recipe });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao criar receita', error: error.message });
  }
};

exports.getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find().populate('ingredientes.ingrediente');
    res.json(recipes);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter receitas', error: error.message });
  }
};

exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('ingredientes.ingrediente');
    if (!recipe) return res.status(404).json({ message: 'Receita não encontrada' });
    res.json(recipe);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter receita', error: error.message });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const { nome, categoria, ingredientes, precoVenda, descricao } = req.body;
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { nome, categoria, ingredientes, precoVenda, descricao },
      { new: true, runValidators: true }
    );
    if (!recipe) return res.status(404).json({ message: 'Receita não encontrada' });
    res.json({ message: 'Receita atualizada com sucesso', recipe });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao atualizar receita', error: error.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Receita não encontrada' });
    res.json({ message: 'Receita excluída com sucesso' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir receita', error: error.message });
  }
};


// Conteúdo de: .\controllers\reportController.js
// controllers/reportController.js

const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Reservation = require('../models/Reservation');
const SalesGoal = require('../models/SalesGoal');
const User = require('../models/User');

exports.getStatistics = async (req, res) => {
  try {
    // Total de Vendas
    const totalVendasResult = await Order.aggregate([
      { $match: { status: 'pago' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalVendas = totalVendasResult[0]?.total || 0;

    // Total de Pedidos
    const totalPedidos = await Order.countDocuments();

    // Total de Clientes
    const totalClientes = await Customer.countDocuments();

    // Total de Produtos
    const totalProdutos = await Product.countDocuments();

    // Total de Reservas
    const totalReservas = await Reservation.countDocuments();

    // Vendas por Categoria
    const vendasPorCategoria = await Order.aggregate([
      { $unwind: '$itens' },
      {
        $lookup: {
          from: 'products',
          localField: 'itens.product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.categoria',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      { $unwind: '$categoryDetails' },
      {
        $group: {
          _id: '$categoryDetails.categoria',
          total: { $sum: '$itens.quantity' },
        },
      },
    ]);

    // Produtos Mais Vendidos
    const produtosMaisVendidos = await Order.aggregate([
      { $unwind: '$itens' },
      {
        $group: {
          _id: '$itens.product',
          total: { $sum: '$itens.quantity' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          nome: '$productDetails.nome',
          total: 1,
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);

    // Reservas por Ambiente
    const reservasPorAmbiente = await Reservation.aggregate([
      {
        $lookup: {
          from: 'tables',
          localField: 'mesa',
          foreignField: '_id',
          as: 'tableDetails',
        },
      },
      { $unwind: '$tableDetails' },
      {
        $lookup: {
          from: 'ambientes',
          localField: 'tableDetails.ambiente',
          foreignField: '_id',
          as: 'ambienteDetails',
        },
      },
      { $unwind: '$ambienteDetails' },
      {
        $group: {
          _id: '$ambienteDetails.nome',
          total: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalVendas,
      totalPedidos,
      totalClientes,
      totalProdutos,
      totalReservas,
      vendasPorCategoria,
      produtosMaisVendidos,
      reservasPorAmbiente,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
};


// Conteúdo de: .\controllers\reservationController.js
// Conteúdo de: .\controllers\reservationController.js
// controllers/reservationController.js
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const Customer = require('../models/Customer');

exports.createReservation = async (req, res) => {
  try {
    const { clienteId, mesaId, dataReserva, numeroPessoas } = req.body;

    // Verificar se o cliente existe
    const cliente = await Customer.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Verificar se a mesa existe
    const mesa = await Table.findById(mesaId);
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada' });
    }

    // Verificar se a mesa está disponível na data desejada
    const conflictingReservations = await Reservation.find({
      mesa: mesaId,
      dataReserva: dataReserva,
      status: 'ativa',
    });

    if (conflictingReservations.length > 0) {
      return res.status(400).json({ message: 'Mesa já reservada para esta data e hora' });
    }

    const reservation = new Reservation({
      cliente: clienteId,
      mesa: mesaId,
      dataReserva,
      numeroPessoas,
    });

    await reservation.save();

    // Atualizar o status da mesa para 'reservada'
    mesa.status = 'reservada';
    await mesa.save();

    res.status(201).json({ message: 'Reserva criada com sucesso', reservation });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar reserva', error: error.message });
  }
};

exports.getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      })
      .sort({ dataReserva: 1 });
    res.json(reservations);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter reservas', error: error.message });
  }
};

exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id)
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      });
    if (!reservation) return res.status(404).json({ message: 'Reserva não encontrada' });
    res.json(reservation);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter reserva', error: error.message });
  }
};

exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const reservation = await Reservation.findByIdAndUpdate(id, updates, { new: true });
    if (!reservation) return res.status(404).json({ message: 'Reserva não encontrada' });
    res.json({ message: 'Reserva atualizada com sucesso', reservation });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar reserva', error: error.message });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByIdAndDelete(id);
    if (!reservation) return res.status(404).json({ message: 'Reserva não encontrada' });

    // Atualizar o status da mesa para 'livre'
    const mesa = await Table.findById(reservation.mesa);
    if (mesa) {
      mesa.status = 'livre';
      await mesa.save();
    }

    res.json({ message: 'Reserva excluída com sucesso' });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir reserva', error: error.message });
  }
};


// Conteúdo de: .\controllers\salesGoalController.js
// controllers/salesGoalController.js
const SalesGoal = require('../models/SalesGoal');
const User = require('../models/User');

exports.createSalesGoal = async (req, res) => {
  try {
    const { employeeId, goalName, goalAmount, startDate, endDate } = req.body;

    // Verifica se o funcionário existe
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'agent') {
      return res.status(404).json({ message: 'Funcionário não encontrado ou não é um agente' });
    }

    // Verifica se o gerente tem permissão para atribuir meta a este funcionário
    if (req.user.role === 'manager' && employee.manager.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Você não tem permissão para definir metas para este funcionário' });
    }

    // Cria a meta de vendas
    const salesGoal = new SalesGoal({
      employee: employeeId,
      manager: req.user.id,
      goalName,
      goalAmount,
      startDate,
      endDate,
    });

    await salesGoal.save();

    res.status(201).json({ message: 'Meta de vendas criada com sucesso', salesGoal });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar meta de vendas', error: error.message });
  }
};

exports.getSalesGoals = async (req, res) => {
  try {
    let salesGoals;
    if (req.user.role === 'admin') {
      salesGoals = await SalesGoal.find().populate('employee manager');
    } else if (req.user.role === 'manager') {
      salesGoals = await SalesGoal.find({ manager: req.user.id }).populate('employee manager');
    } else {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(salesGoals);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter metas de vendas', error: error.message });
  }
};

exports.updateSalesGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { goalName, goalAmount, startDate, endDate } = req.body;

    const salesGoal = await SalesGoal.findById(id);
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }

    // Verifica permissão
    if (
      req.user.role === 'manager' &&
      salesGoal.manager.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar esta meta' });
    }

    // Atualiza a meta
    salesGoal.goalName = goalName || salesGoal.goalName;
    salesGoal.goalAmount = goalAmount || salesGoal.goalAmount;
    salesGoal.startDate = startDate || salesGoal.startDate;
    salesGoal.endDate = endDate || salesGoal.endDate;

    await salesGoal.save();

    res.json({ message: 'Meta de vendas atualizada com sucesso', salesGoal });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar meta de vendas', error: error.message });
  }
};

exports.deleteSalesGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const salesGoal = await SalesGoal.findById(id);
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }

    // Verifica permissão
    if (
      req.user.role === 'manager' &&
      salesGoal.manager.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir esta meta' });
    }

    await salesGoal.remove();

    res.json({ message: 'Meta de vendas excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir meta de vendas', error: error.message });
  }
};


// Conteúdo de: .\controllers\stockController.js
// controllers/stockController.js
const Product = require('../models/Product');

exports.getStock = async (req, res) => {
  try {
    const stockItems = await Product.find().select('nome quantidadeEstoque');
    res.json(stockItems);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter dados de estoque', error: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantidadeEstoque } = req.body;

    const product = await Product.findByIdAndUpdate(productId, { quantidadeEstoque }, { new: true });
    res.json({ message: 'Estoque atualizado', product });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar estoque', error: error.message });
  }
};


// Conteúdo de: .\controllers\tableController.js
// controllers/tableController.js
const Table = require('../models/Table');
const Ambiente = require('../models/Ambiente');
const FinalizedTable = require('../models/FinalizedTable');

exports.createTable = async (req, res) => {
  try {
    const { numeroMesa, ambienteId, position, numeroAssentos } = req.body;

    // Verificar se o ambiente existe
    const ambiente = await Ambiente.findById(ambienteId);
    if (!ambiente) {
      return res.status(404).json({ message: 'Ambiente não encontrado' });
    }

    // Criar os assentos dinamicamente
    const assentos = [];
    for (let i = 1; i <= numeroAssentos; i++) {
      assentos.push({ numeroAssento: i });
    }

    const table = new Table({
      numeroMesa,
      ambiente: ambienteId,
      position,
      assentos,
    });

    await table.save();
    res.status(201).json({ message: 'Mesa criada com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar mesa', error: error.message });
  }
};

exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find().populate('ambiente');
    res.json(tables);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter mesas', error: error.message });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const updates = req.body;

    // Verificar se o novo ambiente existe, se for atualizado
    if (updates.ambiente) {
      const ambiente = await Ambiente.findById(updates.ambiente);
      if (!ambiente) {
        return res.status(404).json({ message: 'Ambiente não encontrado' });
      }
    }

    // Atualizar assentos se o número for alterado
    if (updates.numeroAssentos) {
      const assentos = [];
      for (let i = 1; i <= updates.numeroAssentos; i++) {
        assentos.push({ numeroAssento: i });
      }
      updates.assentos = assentos;
    }

    const table = await Table.findByIdAndUpdate(tableId, updates, { new: true });
    res.json({ message: 'Mesa atualizada com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar mesa', error: error.message });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await Table.findByIdAndDelete(tableId);
    if (!table) return res.status(404).json({ message: 'Mesa não encontrada' });
    res.json({ message: 'Mesa excluída com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir mesa', error: error.message });
  }
};

// Atualizar o status da mesa (pode ser usada por Garçom ou Gerente)
exports.updateTableStatus = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { status } = req.body;

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada' });
    }

    if (status === 'DISPONIVEL' && table.status !== 'FINALIZADA') {
      return res.status(400).json({ message: 'Mesa só pode ser marcada como DISPONIVEL após ser finalizada' });
    }

    table.status = status;
    await table.save();
    res.status(200).json({ message: 'Status da mesa atualizado com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar status da mesa', error: error.message });
  }
};

// Finalizar mesa após o pagamento (apenas Gerente)
exports.finalizeTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    const table = await Table.findById(tableId);

    if (!table || table.status !== 'OCUPADA') {
      return res.status(400).json({ message: 'Mesa não está ocupada ou não encontrada' });
    }

    // Criar registro de mesa finalizada
    const finalizedTable = new FinalizedTable({
      numeroMesa: table.numeroMesa,
      ambienteId: table.ambienteId,
      garcomId: table.garcomId,
      pedidos: table.pedidos,
      valorTotal: table.valorTotal,
    });

    await finalizedTable.save();

    // Resetar mesa para disponibilidade
    table.status = 'DISPONIVEL';
    table.garcomId = null;
    table.pedidos = [];
    table.valorTotal = 0;

    await table.save();
    res.status(200).json({ message: 'Mesa finalizada com sucesso', table });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao finalizar mesa', error: error.message });
  }
};


// Conteúdo de: .\controllers\userController.js
// controllers/userController.js
const User = require('../models/User');

exports.getTeamMembers = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    let teamMembers;
    if (req.user.role === 'admin') {
      // Admin pode ver todos os agentes e gerentes
      teamMembers = await User.find({ role: { $in: ['agent', 'manager'] } }).populate('manager');
    } else {
      // Manager vê apenas seus agentes
      teamMembers = await User.find({ manager: req.user.id }).populate('manager');
    }

    res.json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter membros da equipe', error: error.message });
  }
};


// Conteúdo de: .\middlewares\auditMiddleware.js
// middlewares/auditMiddleware.js
const AuditLog = require('../models/AuditLog');

function auditMiddleware(action) {
  return async (req, res, next) => {
    const user = req.user || {};
    const userId = user.id || 'Anônimo';
    const userEmail = user.email || 'Desconhecido';

    // Capturar detalhes relevantes
    const details = {
      method: req.method,
      path: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
    };

    // Criar registro de auditoria
    try {
      await AuditLog.create({
        userId: userId,
        userEmail: userEmail,
        action: action,
        details: details,
      });
    } catch (error) {
      console.error('Erro ao salvar registro de auditoria:', error);
    }

    next();
  };
}

module.exports = auditMiddleware;


// Conteúdo de: .\middlewares\authMiddleware.js
// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const allPermissions = require("../permissions");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader)
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });

  const token = authHeader.split(' ')[1]; // Extrai o token após 'Bearer '

  if (!token)
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user)
      return res.status(401).json({ message: 'Usuário não encontrado.' });

    // Preparar as permissões do usuário
    let userPermissions = user.permissions;

    // Se a função for admin, atribuir todas as permissões ao usuário
    if (user.role === 'admin') {
      userPermissions = allPermissions;
    }

    req.user = {
      id: user._id,
      role: user.role,
      permissions: userPermissions,
    };

    next();
  } catch (err) {
    console.error('Erro na verificação do token:', err);
    res.status(400).json({ message: 'Token inválido.' });
  }
}

module.exports = authMiddleware;


// Conteúdo de: .\middlewares\errorMiddleware.js
// middlewares/errorMiddleware.js
function errorMiddleware(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ message: 'Algo deu errado!', error: err.message });
  }
  
  module.exports = errorMiddleware;
  

// Conteúdo de: .\middlewares\permissionMiddleware.js
// middlewares/permissionMiddleware.js

function permissionMiddleware(requiredPermissions) {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const userRole = req.user.role;

    // Admin tem todas as permissões
    if (userRole === 'admin' || userPermissions.includes('*')) {
      return next();
    }

    // Verificar se o usuário possui todas as permissões necessárias
    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (hasPermission) {
      return next();
    } else {
      return res.status(403).json({
        message: 'Acesso proibido. Você não tem permissão para este recurso.',
      });
    }
  };
}

module.exports = permissionMiddleware;


// Conteúdo de: .\middlewares\roleMiddleware.js
// middlewares/roleMiddleware.js

function roleMiddleware(requiredRoles) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const userRole = user.role || user.funcao; // Suporta 'role' ou 'funcao'

    // Admin tem acesso total
    if (userRole === 'admin') {
      return next();
    }

    if (requiredRoles.includes(userRole)) {
      return next(); // O usuário tem uma das roles requeridas
    }

    // Verificar se o usuário possui as permissões necessárias
    if (user.permissions && requiredRoles.some(permission => user.permissions.includes(permission))) {
      return next(); // O usuário tem a permissão necessária
    }

    return res.status(403).json({ message: 'Acesso proibido. Você não tem permissão para este recurso.' });
  };
}

module.exports = roleMiddleware;


// Conteúdo de: .\models\Ambiente.js
// Conteúdo de: .\models\Ambiente.js
// models/Ambiente.js
const mongoose = require('mongoose');

const AmbienteSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  limitePessoas: { type: Number, required: true },
});

module.exports = mongoose.model('Ambiente', AmbienteSchema);


// Conteúdo de: .\models\AuditLog.js
// models/AuditLog.js
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


// Conteúdo de: .\models\Category.js
// models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  categoria: { type: String, required: true, unique: true },
  descricao: { type: String },
  habilitado: { type: Boolean, default: true },
});

module.exports = mongoose.model('Category', CategorySchema);


// Conteúdo de: .\models\Customer.js
// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cpf: { type: String, unique: true, sparse: true },
  telefone: String,
  email: { type: String, unique: true, sparse: true },
  pontosFidelidade: { type: Number, default: 0 },
  historicoPedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
}, { timestamps: true });

// Cria índices únicos para campos 'cpf' e 'email'
customerSchema.index({ cpf: 1 }, { unique: true, sparse: true });
customerSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Customer', customerSchema);


// Conteúdo de: .\models\Employee.js
// models/Employee.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const employeeSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  funcao: { type: String, required: true, enum: ['Garçom', 'Cozinheiro', 'Gerente'] },
  email: { type: String, unique: true, required: true },
  senha: { type: String, required: true },
  permissoes: [String],
}, { timestamps: true });

// Cria índice único para o campo 'email'
employeeSchema.index({ email: 1 }, { unique: true });

// Hash da senha antes de salvar
employeeSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Método para comparar senha
employeeSchema.methods.comparePassword = async function (senha) {
  return await bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.model('Employee', employeeSchema);


// Conteúdo de: .\models\FinalizedTable.js
// models/FinalizedTable.js
const mongoose = require('mongoose');

const finalizedTableSchema = new mongoose.Schema({
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
    ref: 'Employee',
  },
  pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  valorTotal: {
    type: Number,
    required: true,
  },
  dataFinalizacao: {
    type: Date,
    default: Date.now,
  },
});

const FinalizedTable = mongoose.model('FinalizedTable', finalizedTableSchema);

module.exports = FinalizedTable;


// Conteúdo de: .\models\IfoodToken.js
// models/IfoodToken.js
const mongoose = require('mongoose');

const IfoodTokenSchema = new mongoose.Schema({
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresIn: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('IfoodToken', IfoodTokenSchema);


// Conteúdo de: .\models\Ingredient.js
// models/Ingredient.js
const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  unidadeMedida: { type: String, required: true }, // Ex: kg, g, l
  quantidadeEstoque: { type: Number, required: true, default: 0 },
  precoCusto: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Ingredient', ingredientSchema);


// Conteúdo de: .\models\Invoice.js
// models/Invoice.js
const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  numeroFatura: { type: String, required: true, unique: true },
  dataEmissao: { type: Date, default: Date.now },
  valorTotal: { type: Number, required: true },
});

module.exports = mongoose.model('Invoice', InvoiceSchema);


// Conteúdo de: .\models\Order.js
// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  assentos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat' }],
  itens: [{
    receita: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    quantidade: { type: Number, required: true },
    modificacoes: String, // Ex: Sem cebola, carne ao ponto
  }],
  status: { type: String, enum: ['Pendente', 'Preparando', 'Pronto', 'Entregue'], default: 'Pendente' },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  garcom: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  total: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);


// Conteúdo de: .\models\Payment.js
// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  metodoPagamento: { type: String, required: true }, // Ex: Dinheiro, Cartão, PIX
  valorPago: { type: Number, required: true },
  troco: { type: Number, default: 0 },
  notaFiscalEmitida: { type: Boolean, default: false },
  dataPagamento: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);


// Conteúdo de: .\models\Product.js
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
});

// Middleware para definir nomeNormalizado antes de salvar
ProductSchema.pre('validate', function (next) {
  this.nomeNormalizado = removeDiacritics(this.nome).toLowerCase();
  next();
});

module.exports = mongoose.model('Product', ProductSchema);


// Conteúdo de: .\models\Recipe.js
// models/Recipe.js
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  categoria: { type: String, required: true }, // Ex: Entrada, Prato Principal
  ingredientes: [{
    ingrediente: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    quantidade: { type: Number, required: true },
  }],
  precoVenda: { type: Number, required: true },
  descricao: String,
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);


// Conteúdo de: .\models\Reservation.js
// Conteúdo de: .\models\Reservation.js
// models/Reservation.js
const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  dataReserva: { type: Date, required: true },
  numeroPessoas: { type: Number, required: true },
  status: { type: String, enum: ['ativa', 'concluida', 'cancelada'], default: 'ativa' },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', ReservationSchema);


// Conteúdo de: .\models\SalesGoal.js
// models/SalesGoal.js
const mongoose = require('mongoose');

const salesGoalSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  goalName: { type: String, required: true },
  goalAmount: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
});

module.exports = mongoose.model('SalesGoal', salesGoalSchema);


// Conteúdo de: .\models\Table.js
// models/Table.js
const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  numeroMesa: { type: Number, required: true, unique: true },
  status: { type: String, enum: ['livre', 'ocupada', 'reservada'], default: 'livre' },
  capacidade: { type: Number, required: true },
  ambiente: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambiente', required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  assentos: [
    {
      numeroAssento: { type: Number, required: true },
      nomeCliente: { type: String },
      pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    },
  ],
  available: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('Table', TableSchema);


// Conteúdo de: .\models\User.js
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
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
});

// Hash da senha antes de salvar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

// Método para comparar senhas
UserSchema.methods.comparePassword = function (senha) {
  return bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.model('User', UserSchema);


// Conteúdo de: .\routes\ambienteRoutes.js
// Conteúdo de: .\routes\ambienteRoutes.js
// routes/ambienteRoutes.js
const express = require('express');
const router = express.Router();
const ambienteController = require('../controllers/ambienteController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para ambientes
router.post('/', authMiddleware, roleMiddleware(['Gerente']), ambienteController.createAmbiente);
router.get('/', authMiddleware, roleMiddleware(['Gerente', 'Garçom']), ambienteController.getAmbientes);
router.put('/:id', authMiddleware, roleMiddleware(['Gerente']), ambienteController.updateAmbiente);
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente']), ambienteController.deleteAmbiente);

module.exports = router;


// Conteúdo de: .\routes\authRoutes.js
// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas de autenticação
router.post('/register', authMiddleware, roleMiddleware(['admin', 'manager']), authController.register);
router.post('/login', authController.login);

// Rotas para recuperação de senha
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPasswordWithOTP);

module.exports = router;


// Conteúdo de: .\routes\categoryRoutes.js
// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// Rotas para categorias
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createCategory']),
  categoryController.createCategory
);

router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewCategory']),
  categoryController.getCategories
);

router.get(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['viewCategory']),
  categoryController.getCategories
);

router.put(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['editCategory']),
  categoryController.updateCategory
);

router.delete(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['deleteCategory']),
  categoryController.deleteCategory
);

module.exports = router;


// Conteúdo de: .\routes\customerRoutes.js
// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para clientes
router.post('/', authMiddleware, roleMiddleware(['Gerente']), customerController.createCustomer);
router.get('/', authMiddleware, roleMiddleware(['Gerente']), customerController.getCustomers);
router.get('/:id', authMiddleware, roleMiddleware(['Gerente']), customerController.getCustomerById);
router.put('/:id', authMiddleware, roleMiddleware(['Gerente']), customerController.updateCustomer);
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente']), customerController.deleteCustomer);

module.exports = router;


// Conteúdo de: .\routes\employeeRoutes.js
// routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para funcionários
router.post('/', authMiddleware, roleMiddleware(['Gerente']), employeeController.createEmployee);
router.get('/', authMiddleware, roleMiddleware(['Gerente']), employeeController.getEmployees);
router.get('/:id', authMiddleware, roleMiddleware(['Gerente']), employeeController.getEmployeeById);
router.put('/:id', authMiddleware, roleMiddleware(['Gerente']), employeeController.updateEmployee);
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente']), employeeController.deleteEmployee);

// Rota pública para login
router.post('/login', employeeController.loginEmployee);

module.exports = router;


// Conteúdo de: .\routes\ifoodRoutes.js
// routes/ifoodRoutes.js
const express = require('express');
const router = express.Router();
const ifoodAuthController = require('../controllers/ifoodAuthController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Iniciar o processo de autenticação
router.post('/ifood/auth/start', authMiddleware, roleMiddleware(['admin', 'manager']), ifoodAuthController.startAuth);

// Concluir a autenticação com o código de autorização
router.post('/ifood/auth/complete', authMiddleware, roleMiddleware(['admin', 'manager']), ifoodAuthController.completeAuth);

module.exports = router;


// Conteúdo de: .\routes\ingredientRoutes.js
// routes/ingredientRoutes.js
const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para ingredientes
router.post('/', authMiddleware, roleMiddleware(['Gerente']), ingredientController.createIngredient);
router.get('/', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro']), ingredientController.getIngredients);
router.get('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro']), ingredientController.getIngredientById);
router.put('/:id', authMiddleware, roleMiddleware(['Gerente']), ingredientController.updateIngredient);
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente']), ingredientController.deleteIngredient);

module.exports = router;


// Conteúdo de: .\routes\integrationRoutes.js
// routes/integrationRoutes.js
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/delivery-orders', authMiddleware, integrationController.fetchDeliveryOrders);

module.exports = router;


// Conteúdo de: .\routes\orderRoutes.js
// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para pedidos
router.post('/', authMiddleware, roleMiddleware(['Garçom']), orderController.createOrder);
router.get('/', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom']), orderController.getOrders);
router.get('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom']), orderController.getOrderById);
router.put('/:id/status', authMiddleware, roleMiddleware(['Cozinheiro', 'Gerente']), orderController.updateOrderStatus);

module.exports = router;


// Conteúdo de: .\routes\paymentRoutes.js
// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para pagamentos
router.post('/', authMiddleware, roleMiddleware(['Garçom', 'Gerente']), paymentController.processPayment);

module.exports = router;


// Conteúdo de: .\routes\productRoutes.js
// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// Criar produto - requer a permissão 'createProduct'
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createProduct']),
  productController.createProduct
);

// Obter produtos - requer a permissão 'viewProduct'
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProducts
);

router.get(
  '/:productId',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProductById
);

// Atualizar produto - requer a permissão 'editProduct'
router.put(
  '/:productId',
  authMiddleware,
  permissionMiddleware(['editProduct']),
  productController.updateProduct
);

// Deletar produto - requer a permissão 'deleteProduct'
router.delete(
  '/:productId',
  authMiddleware,
  permissionMiddleware(['deleteProduct']),
  productController.deleteProduct // Certifique-se de que esta função está definida
);

module.exports = router;


// Conteúdo de: .\routes\recipeRoutes.js
// routes/recipeRoutes.js
const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para receitas
router.post('/', authMiddleware, roleMiddleware(['Gerente']), recipeController.createRecipe);
router.get('/', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom']), recipeController.getRecipes);
router.get('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom']), recipeController.getRecipeById);
router.put('/:id', authMiddleware, roleMiddleware(['Gerente']), recipeController.updateRecipe);
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente']), recipeController.deleteRecipe);

module.exports = router;


// Conteúdo de: .\routes\reportRoutes.js
// Conteúdo de: routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const User = require('../models/User');

router.get('/statistics', async (req, res) => {
  try {
    // Total de Vendas
    const totalVendasResult = await Order.aggregate([
      { $match: { status: 'Pago' } },
      { $group: { _id: null, totalVendas: { $sum: '$total' } } },
    ]);
    const totalVendas = totalVendasResult[0]?.totalVendas || 0;

    // Pedidos Hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const pedidosHoje = await Order.countDocuments({
      createdAt: { $gte: hoje },
    });

    // Clientes Ativos
    const clientesAtivos = await Customer.countDocuments();

    // Produtos em Falta (quantidade em estoque menor ou igual a 5)
    const produtosEmFalta = await Product.countDocuments({ quantidadeEstoque: { $lte: 5 } });

    // Novos Clientes (últimos 7 dias)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const novosClientes = await Customer.countDocuments({
      createdAt: { $gte: seteDiasAtras },
    });

    // Pedidos Pendentes
    const pedidosPendentes = await Order.countDocuments({ status: { $ne: 'Pago' } });

    // Vendas nos Últimos 7 Dias
    const vendasUltimos7Dias = await Order.aggregate([
      { $match: { status: 'Pago', createdAt: { $gte: seteDiasAtras } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalVendas: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          dia: '$_id',
          totalVendas: 1,
        },
      },
    ]);

    // Pedidos por Categoria
    const pedidosPorCategoria = await Order.aggregate([
      { $match: { status: 'Pago' } },
      { $unwind: '$itens' },
      {
        $lookup: {
          from: 'products',
          localField: 'itens',
          foreignField: '_id',
          as: 'produto',
        },
      },
      { $unwind: '$produto' },
      {
        $lookup: {
          from: 'categories',
          localField: 'produto.categoria',
          foreignField: '_id',
          as: 'categoria',
        },
      },
      { $unwind: '$categoria' },
      {
        $group: {
          _id: '$categoria.categoria',
          quantidade: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          categoria: '$_id',
          quantidade: 1,
        },
      },
    ]);

    // Métodos de Pagamento
    const metodosPagamento = await Order.aggregate([
      { $match: { status: 'Pago' } },
      {
        $group: {
          _id: '$metodoPagamento',
          quantidade: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          metodo: '$_id',
          quantidade: 1,
        },
      },
    ]);

    // Vendas por Funcionário
    const vendasPorFuncionario = await Order.aggregate([
      { $match: { status: 'Pago' } },
      {
        $group: {
          _id: '$employeeId',
          totalVendas: { $sum: '$total' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'funcionario',
        },
      },
      { $unwind: '$funcionario' },
      {
        $project: {
          _id: 0,
          funcionario: '$funcionario.nome',
          totalVendas: 1,
        },
      },
    ]);

    // Vendas por Mês (últimos 12 meses)
    const dozeMesesAtras = new Date();
    dozeMesesAtras.setMonth(dozeMesesAtras.getMonth() - 11);
    dozeMesesAtras.setDate(1);
    const vendasPorMes = await Order.aggregate([
      { $match: { status: 'Pago', createdAt: { $gte: dozeMesesAtras } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalVendas: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          mes: '$_id',
          totalVendas: 1,
        },
      },
    ]);

    res.json({
      totalVendas,
      pedidosHoje,
      clientesAtivos,
      produtosEmFalta,
      novosClientes,
      pedidosPendentes,
      vendasUltimos7Dias,
      pedidosPorCategoria,
      metodosPagamento,
      vendasPorFuncionario,
      vendasPorMes,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
});

module.exports = router;


// Conteúdo de: .\routes\reservationRoutes.js
// routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Criar nova reserva
router.post('/', authMiddleware, roleMiddleware(['Gerente', 'Garçom']), reservationController.createReservation);

// Obter todas as reservas
router.get('/', authMiddleware, roleMiddleware(['Gerente', 'Garçom']), reservationController.getReservations);

// Obter uma reserva por ID
router.get('/:id', authMiddleware, roleMiddleware(['Gerente', 'Garçom']), reservationController.getReservationById);

// Atualizar uma reserva
router.put('/:id', authMiddleware, roleMiddleware(['Gerente', 'Garçom']), reservationController.updateReservation);

// Excluir uma reserva
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente']), reservationController.deleteReservation);

module.exports = router;


// Conteúdo de: .\routes\salesGoalRoutes.js
// routes/salesGoalRoutes.js
const express = require('express');
const router = express.Router();
const salesGoalController = require('../controllers/salesGoalController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para metas de vendas
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.createSalesGoal
);

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.getSalesGoals
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.updateSalesGoal
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.deleteSalesGoal
);

module.exports = router;


// Conteúdo de: .\routes\stockRoutes.js
// routes/stockRoutes.js
const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, stockController.getStock);
router.put('/:productId', authMiddleware, stockController.updateStock);

module.exports = router;


// Conteúdo de: .\routes\tableRoutes.js
// routes/tableRoutes.js
const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const finalizedTableController = require('../controllers/finalizedTableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para Mesas
router.post('/', authMiddleware, roleMiddleware(['Gerente']), tableController.createTable);
router.get('/', authMiddleware, tableController.getTables);
router.put('/:tableId', authMiddleware, roleMiddleware(['Gerente']), tableController.updateTable);
router.delete('/:tableId', authMiddleware, roleMiddleware(['Gerente']), tableController.deleteTable);

// Rota para Finalizar Mesa (somente Gerente)
router.post('/:tableId/finalizar', authMiddleware, roleMiddleware(['Garçom']), finalizedTableController.finalizeTable);

// Rota para Atualizar Status da Mesa (pode ser usada por Garçom)
router.put('/:tableId/status', authMiddleware, roleMiddleware(['Gerente', 'Garçom']), tableController.updateTableStatus);

module.exports = router;


// Conteúdo de: .\routes\userRoutes.js
// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rota para obter membros da equipe
router.get(
  '/team-members',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  userController.getTeamMembers
);

module.exports = router;


// Conteúdo de: .\utils\emailUtil.js
// utils/emailUtil.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Ou o host do seu provedor de email
  port: 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.EMAIL_USER, // Seu email
    pass: process.env.EMAIL_PASS, // Sua senha ou app password
  },
});

exports.sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: `"Seu Nome ou Empresa" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};


// Conteúdo de: .\utils\printUtil.js
// utils/printUtil.js
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

exports.printOrder = (order) => {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: 'tcp://192.168.0.100', // IP da impressora na cozinha
  });

  printer.println('--- Novo Pedido ---');
  printer.println(`Pedido ID: ${order._id}`);
  printer.println(`Data: ${new Date(order.dataCriacao).toLocaleString()}`);

  order.itens.forEach((item) => {
    printer.println(`${item.quantidade}x ${item.produto.nome}`);
  });

  printer.println(`Total: R$ ${order.total.toFixed(2)}`);
  printer.cut();

  try {
    printer.execute();
    console.log('Pedido enviado para impressão');
  } catch (error) {
    console.error('Erro ao imprimir pedido:', error);
  }
};


