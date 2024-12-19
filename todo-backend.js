// Conteúdo de: .\app.js
// cash-register-backend/app.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { json, urlencoded } = express;
const config = require('./config');
const rateLimit = require('express-rate-limit');
const path = require('path');

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
const finalizedTableRoutes = require('./routes/finalizedTableRoutes');
const timeRoutes = require('./routes/timeRoutes');
const uploadRoutes = require('./routes/uploadRoute');
const comandasRouter = require('./routes/comandaRoutes');
const qrRoutes = require('./routes/qrRoutes');
const configRoutes = require('./routes/configRoutes');


// Importar Middlewares
const debugMiddleware = require('./middlewares/debugMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cors());

app.use(debugMiddleware);

// Limite de requisições
const limiter = rateLimit({
  windowMs: 60 * 1 * 1000,
  max: 15,
  message: {
    message: 'Muitas requisições deste IP. Tente novamente em 10 minutos.',
  },
  skip: (req, res) => {
    const token = req.headers['authorization'];
    return !!token;
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

app.use(limiter);

// Conexão com o MongoDB
mongoose.connect(config.mongoURI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Servir arquivos estáticos de imagens
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads/ingredients', express.static(path.join(__dirname, 'uploads/ingredients')));

// ** Importante **: Servir PDFs de comandas
app.use('/comandas', express.static(path.join(__dirname, 'public/comandas')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/customers', customerRoutes);
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
app.use('/api/categories', categoryRoutes);
app.use('/api/sales-goals', salesGoalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/server-time', timeRoutes);
app.use('/api/finalized-tables', finalizedTableRoutes);
app.use('/api/comandas', comandasRouter);
app.use('/api/qr', qrRoutes);
app.use('/api/config', configRoutes);

// Rota adicional de teste
app.get('/server-time', (req, res) => {
  res.json({ serverTime: new Date() });
});

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
    'configSystem',
    'viewOrder',
    'viewOrders'
    
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

// Importar o modelo User
const User = require('./models/User');

// Carregar variáveis de ambiente
dotenv.config();

// Função principal para semear a coleção de usuários
async function seedUsers() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado ao MongoDB para seed de Users');

    // Limpar a coleção de Users
    await User.deleteMany({});
    console.log('Coleção de Users limpa com sucesso.');

    // Hash das senhas
    const hashedPasswordAdmin = await bcrypt.hash('mzgxdyj8', 10); // Senha para admin
    const hashedPasswordUsers = await bcrypt.hash('senha123', 10); // Senhas padrão para outros usuários

    // Inserir usuários (administradores, gerentes, agentes, feeders)
    const usersData = [
      {
        nome: 'Andre Biete',
        email: 'agb_junior@live.com',
        senha: hashedPasswordAdmin,
        role: 'admin',
        permissions: ['*'], // Acesso total
      },
      {
        nome: 'Gerente Maria',
        email: 'gerente_maria@example.com',
        senha: hashedPasswordUsers,
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
        nome: 'Gerente Carlos',
        email: 'gerente_carlos@example.com',
        senha: hashedPasswordUsers,
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
        senha: hashedPasswordUsers,
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
        senha: hashedPasswordUsers,
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
        senha: hashedPasswordUsers,
        role: 'feeder',
        permissions: [
          'viewProduct',
        ],
        manager: null,
      },
      {
        nome: 'Agente Lucas',
        email: 'agente_lucas@example.com',
        senha: hashedPasswordUsers,
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
        senha: hashedPasswordUsers,
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
        senha: hashedPasswordUsers,
        role: 'feeder',
        permissions: [
          'viewProduct',
        ],
        manager: null,
      },
      {
        nome: 'Agente Ricardo',
        email: 'agente_ricardo@example.com',
        senha: hashedPasswordUsers,
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
        senha: hashedPasswordUsers,
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

    // Inserir os usuários
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

    if (!gerenteMaria || !gerenteCarlos) {
      throw new Error('Gerentes específicos não encontrados.');
    }

    // Distribuir agentes entre os gerentes
    for (let i = 0; i < agentes.length; i++) {
      const agente = agentes[i];
      const gerente = (i % 2 === 0) ? gerenteMaria : gerenteCarlos;
      agente.manager = gerente._id;
      await agente.save();
    }

    // Distribuir feeders entre os gerentes
    for (let i = 0; i < feeders.length; i++) {
      const feeder = feeders[i];
      const gerente = (i % 2 === 0) ? gerenteMaria : gerenteCarlos;
      feeder.manager = gerente._id;
      await feeder.save();
    }

    console.log('Agentes e feeders associados aos gerentes.');

    console.log('Banco de dados de Users semeado com sucesso!');
    process.exit();
  } catch (error) {
    console.error('Erro ao semear o banco de dados de Users:', error);
    process.exit(1);
  }
}

// Executar a função principal
seedUsers();


// Conteúdo de: .\server.js
// server.js
const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000', // Ajuste conforme necessário
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
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


// Conteúdo de: .\todo-backend.js
// Conteúdo de: .\app.js
// cash-register-backend/app.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { json, urlencoded } = express;
const config = require('./config');
const rateLimit = require('express-rate-limit');
const path = require('path');

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
const finalizedTableRoutes = require('./routes/finalizedTableRoutes');
const timeRoutes = require('./routes/timeRoutes');
const uploadRoutes = require('./routes/uploadRoute');
const comandasRouter = require('./routes/comandaRoutes');
const qrRoutes = require('./routes/qrRoutes');
const configRoutes = require('./routes/configRoutes');


// Importar Middlewares
const debugMiddleware = require('./middlewares/debugMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cors());

app.use(debugMiddleware);

// Limite de requisições
const limiter = rateLimit({
  windowMs: 60 * 1 * 1000,
  max: 15,
  message: {
    message: 'Muitas requisições deste IP. Tente novamente em 10 minutos.',
  },
  skip: (req, res) => {
    const token = req.headers['authorization'];
    return !!token;
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

app.use(limiter);

// Conexão com o MongoDB
mongoose.connect(config.mongoURI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Servir arquivos estáticos de imagens
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads/ingredients', express.static(path.join(__dirname, 'uploads/ingredients')));

// ** Importante **: Servir PDFs de comandas
app.use('/comandas', express.static(path.join(__dirname, 'public/comandas')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/customers', customerRoutes);
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
app.use('/api/categories', categoryRoutes);
app.use('/api/sales-goals', salesGoalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/server-time', timeRoutes);
app.use('/api/finalized-tables', finalizedTableRoutes);
app.use('/api/comandas', comandasRouter);
app.use('/api/qr', qrRoutes);
app.use('/api/config', configRoutes);

// Rota adicional de teste
app.get('/server-time', (req, res) => {
  res.json({ serverTime: new Date() });
});

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
    'configSystem',
    'viewOrder',
    'viewOrders'
    
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

// Importar o modelo User
const User = require('./models/User');

// Carregar variáveis de ambiente
dotenv.config();

// Função principal para semear a coleção de usuários
async function seedUsers() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado ao MongoDB para seed de Users');

    // Limpar a coleção de Users
    await User.deleteMany({});
    console.log('Coleção de Users limpa com sucesso.');

    // Hash das senhas
    const hashedPasswordAdmin = await bcrypt.hash('mzgxdyj8', 10); // Senha para admin
    const hashedPasswordUsers = await bcrypt.hash('senha123', 10); // Senhas padrão para outros usuários

    // Inserir usuários (administradores, gerentes, agentes, feeders)
    const usersData = [
      {
        nome: 'Andre Biete',
        email: 'agb_junior@live.com',
        senha: hashedPasswordAdmin,
        role: 'admin',
        permissions: ['*'], // Acesso total
      },
      {
        nome: 'Gerente Maria',
        email: 'gerente_maria@example.com',
        senha: hashedPasswordUsers,
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
        nome: 'Gerente Carlos',
        email: 'gerente_carlos@example.com',
        senha: hashedPasswordUsers,
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
        senha: hashedPasswordUsers,
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
        senha: hashedPasswordUsers,
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
        senha: hashedPasswordUsers,
        role: 'feeder',
        permissions: [
          'viewProduct',
        ],
        manager: null,
      },
      {
        nome: 'Agente Lucas',
        email: 'agente_lucas@example.com',
        senha: hashedPasswordUsers,
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
        senha: hashedPasswordUsers,
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
        senha: hashedPasswordUsers,
        role: 'feeder',
        permissions: [
          'viewProduct',
        ],
        manager: null,
      },
      {
        nome: 'Agente Ricardo',
        email: 'agente_ricardo@example.com',
        senha: hashedPasswordUsers,
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
        senha: hashedPasswordUsers,
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

    // Inserir os usuários
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

    if (!gerenteMaria || !gerenteCarlos) {
      throw new Error('Gerentes específicos não encontrados.');
    }

    // Distribuir agentes entre os gerentes
    for (let i = 0; i < agentes.length; i++) {
      const agente = agentes[i];
      const gerente = (i % 2 === 0) ? gerenteMaria : gerenteCarlos;
      agente.manager = gerente._id;
      await agente.save();
    }

    // Distribuir feeders entre os gerentes
    for (let i = 0; i < feeders.length; i++) {
      const feeder = feeders[i];
      const gerente = (i % 2 === 0) ? gerenteMaria : gerenteCarlos;
      feeder.manager = gerente._id;
      await feeder.save();
    }

    console.log('Agentes e feeders associados aos gerentes.');

    console.log('Banco de dados de Users semeado com sucesso!');
    process.exit();
  } catch (error) {
    console.error('Erro ao semear o banco de dados de Users:', error);
    process.exit(1);
  }
}

// Executar a função principal
seedUsers();


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

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { nome, email, role, managerId, permissions, senha } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Atualizar campos permitidos
    if (nome) user.nome = nome;
    if (email) user.email = email;
    if (role) user.role = role;
    if (managerId) user.manager = managerId;
    if (permissions) user.permissions = permissions;

    // Atualizar senha se fornecida
    if (senha) {
      const salt = await bcrypt.genSalt(10);
      user.senha = await bcrypt.hash(senha, salt);
    }

    await user.save();
    res.status(200).json({ message: 'Usuário atualizado com sucesso.', user });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário.', error: error.message });
  }
};

// Conteúdo de: .\controllers\categoryController.js
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
    const { page = 1, limit = 10, search = '', sort = 'categoria', order = 'asc' } = req.query;

    const query = {
      categoria: { $regex: search, $options: 'i' },
    };

    const total = await Category.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const currentPage = parseInt(page, 10);

    const categories = await Category.find(query)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((currentPage - 1) * limit)
      .limit(parseInt(limit, 10));

    res.json({ categories, totalPages, currentPage });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter categorias', error: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Categoria não encontrada' });
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter categoria', error: error.message });
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
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error('Erro ao obter categorias:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};


// Conteúdo de: .\controllers\comandaController.js
// controllers/comandaController.js
const Comanda = require('../models/Comanda');
const path = require('path');
const fs = require('fs');

exports.sendComandaEmail = async (req, res) => {
  try {
    const { comandaId, email } = req.body;

    if (!comandaId || !email) {
      return res.status(400).json({ message: 'comandaId e email são obrigatórios.' });
    }

    // Buscar a comanda
    const comanda = await Comanda.findById(comandaId)
      .populate('orders')
      .populate({
        path: 'orders',
        populate: { path: 'itens.product', model: 'Product' }
      })
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' }
      });

    if (!comanda) {
      return res.status(404).json({ message: 'Comanda não encontrada.' });
    }

    // Verificar se há PDF da comanda
    // Supondo que o pdfPath foi salvo no campo 'pdfPath' da comanda (caso contrário, ajuste a lógica)
    // Caso isso não tenha sido salvo, precisaria gerar novamente o PDF ou ter sido salvo em outro lugar.
    // Para este exemplo, presumiremos que pdfPath existe. Caso contrário, retorne erro.
    const pdfPath = comanda.pdfPath; 
    if (!pdfPath) {
      return res.status(400).json({ message: 'Não há PDF associado a esta comanda.' });
    }

    const absolutePdfPath = path.join(__dirname, '..', 'public', pdfPath);
    if (!fs.existsSync(absolutePdfPath)) {
      return res.status(404).json({ message: 'Arquivo PDF da comanda não encontrado no servidor.' });
    }

    // Montar corpo do email em HTML
    let htmlBody = `<h2>Comanda da Mesa ${comanda.mesa.numeroMesa}</h2>`;
    htmlBody += `<p><strong>Data da Finalização:</strong> ${new Date(comanda.createdAt).toLocaleString()}</p>`;
    htmlBody += `<p><strong>Forma de Pagamento:</strong> ${comanda.formaPagamento}</p>`;
    htmlBody += `<p><strong>Total Final:</strong> R$ ${comanda.total.toFixed(2)}</p>`;

    if (comanda.tipoDesconto === 'porcentagem') {
      htmlBody += `<p><strong>Desconto:</strong> ${comanda.valorDesconto}%</p>`;
    } else if (comanda.tipoDesconto === 'valor') {
      htmlBody += `<p><strong>Desconto:</strong> R$ ${comanda.valorDesconto.toFixed(2)}</p>`;
    } else {
      htmlBody += `<p><strong>Desconto:</strong> Nenhum</p>`;
    }

    htmlBody += `<h3>Pedidos:</h3>`;
    if (comanda.orders && comanda.orders.length > 0) {
      comanda.orders.forEach((order) => {
        htmlBody += `<h4>Pedido #${order.orderNumber} - Total: R$ ${order.total.toFixed(2)}</h4>`;
        htmlBody += `<ul>`;
        order.itens.forEach((item) => {
          const nomeProduto = item.product ? item.product.nome : 'Produto Desconhecido';
          const valorItem = (item.product ? item.product.preco : 0) * item.quantidade;
          htmlBody += `<li>${item.quantidade} x ${nomeProduto} (R$ ${valorItem.toFixed(2)})</li>`;
        });
        htmlBody += `</ul>`;
      });
    } else {
      htmlBody += `<p>Nenhum pedido associado.</p>`;
    }

    htmlBody += `<hr><p>Em anexo, o PDF da comanda para impressão ou armazenamento.</p>`;

    // Enviar email com anexo
    await sendEmail(
      email,
      `Comanda Finalizada - Mesa ${comanda.mesa.numeroMesa}`,
      'Segue em anexo a comanda finalizada.',
      htmlBody,
      [
        {
          filename: `Comanda_Mesa_${comanda.mesa.numeroMesa}.pdf`,
          path: absolutePdfPath,
          contentType: 'application/pdf',
        },
      ]
    );

    res.json({ message: 'Email enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar email da comanda:', error);
    res.status(500).json({ message: 'Erro interno ao enviar email da comanda', error: error.message });
  }
};



exports.getComandas = async (req, res) => {
  try {
    const comandas = await Comanda.find()
      .populate('mesa')
      .populate({
        path: 'orders',
        populate: { path: 'itens.product', model: 'Product' },
      })
      .sort({ createdAt: -1 });

    res.json({ comandas });
  } catch (error) {
    console.error('Erro ao obter comandas:', error);
    res.status(500).json({ message: 'Erro ao obter comandas.' });
  }
};

/**
 * Endpoint para baixar o PDF da comanda
 */
exports.downloadComandaPDF = async (req, res) => {
  try {
    const comandaId = req.params.id;
    const comanda = await Comanda.findById(comandaId).populate('mesa');

    if (!comanda) {
      return res.status(404).json({ message: 'Comanda não encontrada.' });
    }

    // Assumindo que pdfPath já foi definido e salvo no campo comanda.pdfPath pelo controller de finalização
    // Ex: comanda.pdfPath = '/comandas/<id>.pdf'
    if (!comanda.pdfPath) {
      return res.status(400).json({ message: 'Nenhum PDF associado a esta comanda.' });
    }

    const absolutePath = path.join(__dirname, '..', 'public', comanda.pdfPath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'PDF da comanda não encontrado.' });
    }

    // Se quiser apenas baixar, use res.download
    res.download(absolutePath, `Comanda_Mesa_${comanda.mesa.numeroMesa}.pdf`, (err) => {
      if (err) {
        console.error('Erro ao enviar o PDF:', err);
        res.status(500).json({ message: 'Erro ao enviar o PDF.' });
      }
    });

  } catch (error) {
    console.error('Erro ao baixar PDF da comanda:', error);
    res.status(500).json({ message: 'Erro ao baixar PDF da comanda.', error: error.message });
  }
};


// Conteúdo de: .\controllers\configController.js
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


// Conteúdo de: .\controllers\customerController.js
// controllers/customerController.js
const Customer = require('../models/Customer');

exports.createCustomer = async (req, res) => {
  try {
    const {
      cpfCnpj,
      nome,
      contato,
      telefone,
      whatsapp,
      email,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
    } = req.body;

    const customer = new Customer({
      cpfCnpj,
      nome,
      contato,
      telefone,
      whatsapp,
      email,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
    });

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
    const {
      cpfCnpj,
      nome,
      contato,
      telefone,
      whatsapp,
      email,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
    } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        cpfCnpj,
        nome,
        contato,
        telefone,
        whatsapp,
        email,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      },
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

// ========================= NOVO MÉTODO =========================

/**
 * Método avançado para obter clientes com paginação, pesquisa e ordenação.
 * Endpoint: GET /customers/advanced
 */
exports.getCustomersAdvanced = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sort = 'nome',
      order = 'asc',
    } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;

    // Cria o filtro de pesquisa
    const query = search
      ? {
          $or: [
            { nome: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { cidade: { $regex: search, $options: 'i' } },
            { cpfCnpj: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    // Conta o total de clientes correspondentes ao filtro
    const totalCustomers = await Customer.countDocuments(query);

    // Calcula o total de páginas
    const totalPages = Math.ceil(totalCustomers / limitNumber);

    // Configurações de ordenação
    const sortOption = { [sort]: order === 'asc' ? 1 : -1 };

    // Busca os clientes com paginação e ordenação
    const customers = await Customer.find(query)
      .populate('historicoPedidos') // Remova se não estiver usando
      .sort(sortOption)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.json({ customers, totalPages });
  } catch (error) {
    console.error('Erro ao obter clientes (avançado):', error);
    res.status(400).json({ message: 'Erro ao obter clientes', error: error.message });
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


// Conteúdo de: .\controllers\finalizedOrderController.js
// controllers/finalizedOrderController.js
const FinalizedOrder = require('../models/FinalizedOrder');
const Order = require('../models/Order');
const Table = require('../models/Table');

exports.createFinalizedOrder = async (req, res) => {
  try {
    const { mesaId } = req.body;
    if (!mesaId) {
      return res.status(400).json({ message: 'ID da mesa é obrigatório.' });
    }

    // Buscar a mesa
    const table = await Table.findById(mesaId).populate('ambiente');
    if (!table) return res.status(404).json({ message: 'Mesa não encontrada' });

    // Buscar todos os pedidos dessa mesa com status != Entregue (ou conforme sua lógica)
    // Aqui assumimos que finalizamos todos os pedidos PENDENTES ou PREPARANDO dessa mesa.
    // Mas se sua lógica é outra, ajuste conforme necessário.
    const orders = await Order.find({ mesa: mesaId, status: 'Entregue' }).populate('itens.product').populate('garcom');

    if (!orders || orders.length === 0) {
      return res.status(400).json({ message: 'Nenhum pedido entregue para finalizar nesta mesa.' });
    }

    let valorTotal = 0;
    const consumoPorAssento = {};

    // Calcular valor total e consumo por assento
    orders.forEach((order) => {
      valorTotal += order.total;
      const assentoKey = order.assento || 'Sem Assento';
      if (!consumoPorAssento[assentoKey]) {
        consumoPorAssento[assentoKey] = 0;
      }
      consumoPorAssento[assentoKey] += order.total;
    });

    const consumoArray = Object.keys(consumoPorAssento).map((assento) => ({
      assento,
      valor: consumoPorAssento[assento],
    }));

    const garcom = orders[0].garcom ? orders[0].garcom._id : null; 
    const ambienteId = table.ambiente._id;

    const finalizedOrder = new FinalizedOrder({
      mesaId,
      pedidos: orders.map(o => o._id),
      garcom: garcom,
      valorTotal,
      consumoPorAssento: consumoArray,
      ambienteId,
    });

    await finalizedOrder.save();

    // Atualizar a mesa para 'livre' já que finalizamos
    table.status = 'livre';
    await table.save();

    res.status(201).json({ message: 'Mesa finalizada com sucesso', finalizedOrder });
  } catch (error) {
    console.error('Erro ao finalizar mesa:', error);
    res.status(500).json({ message: 'Erro ao finalizar mesa', error: error.message });
  }
};

exports.getFinalizedOrders = async (req, res) => {
  try {
    const finalizedOrders = await FinalizedOrder.find().populate('mesaId').populate('garcom').populate('pedidos');
    res.json(finalizedOrders);
  } catch (error) {
    console.error('Erro ao obter finalized orders:', error);
    res.status(500).json({ message: 'Erro ao obter finalized orders', error: error.message });
  }
};

exports.getFinalizedOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const finalizedOrder = await FinalizedOrder.findById(id).populate('mesaId').populate('garcom').populate({
      path: 'pedidos',
      populate: {
        path: 'itens.product',
        model: 'Product'
      }
    });

    if (!finalizedOrder) return res.status(404).json({ message: 'Registro não encontrado' });

    res.json(finalizedOrder);
  } catch (error) {
    console.error('Erro ao obter finalized order:', error);
    res.status(500).json({ message: 'Erro ao obter finalized order', error: error.message });
  }
};


// Conteúdo de: .\controllers\finalizedTableController.js
// controllers/finalizedTableController.js
const FinalizedTable = require('../models/FinalizedTable');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const Table = require('../models/Table');
const Comanda = require('../models/Comanda');
const { createInvoice } = require('../utils/pdfUtil');

exports.finalizarMesa = async (req, res) => {
  try {
    const tableId = req.params.id;
    const { formaPagamento, valorPago, tipoDesconto, valorDesconto } = req.body;

    // Validações básicas
    if (!formaPagamento || valorPago === undefined || tipoDesconto === undefined || valorDesconto === undefined) {
      return res.status(400).json({ message: 'Dados de pagamento incompletos.' });
    }

    // Encontrar a mesa
    const mesa = await Table.findById(tableId).populate('ambiente');
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    if (mesa.status !== 'ocupada') {
      return res.status(400).json({ message: 'Mesa não está ocupada.' });
    }

    // Obter todos os pedidos da mesa que não estão finalizados
    const pedidos = await Order.find({ mesa: tableId, status: { $ne: 'Finalizado' } })
      .populate('itens.product')
      .populate('garcom')
      .populate('cliente');

    if (pedidos.length === 0) {
      return res.status(400).json({ message: 'Não há pedidos para esta mesa.' });
    }

    // Calcular o total dos pedidos
    let total = 0;
    pedidos.forEach(order => {
      total += order.total;
    });

    // Calcular desconto
    let desconto = 0;
    if (tipoDesconto === 'porcentagem') {
      desconto = (valorDesconto / 100) * total;
    } else if (tipoDesconto === 'valor') {
      desconto = valorDesconto;
    }

    const totalFinal = total - desconto;

    // Verificar se o valor pago é suficiente
    if (valorPago < totalFinal) {
      return res.status(400).json({ message: 'Valor pago é insuficiente.' });
    }

    // Criar a comanda
    const comanda = new Comanda({
      mesa: tableId,
      orders: pedidos.map(order => order._id),
      formaPagamento,
      valorPago,
      tipoDesconto,
      valorDesconto: desconto,
      total: totalFinal,
      status: 'Finalizada',
    });

    await comanda.save();

    // Atualizar o status dos pedidos para 'Finalizado'
    await Order.updateMany({ mesa: tableId, status: { $ne: 'Finalizado' } }, { status: 'Finalizado' });

    // Atualizar o status da mesa para 'livre'
    mesa.status = 'livre';
    await mesa.save();

    // Emitir evento via Socket.io, se necessário
    if (global.io) {
      global.io.emit('mesa_finalizada', { mesaId, comanda });
    }

    // Gerar a nota fiscal para PDF
    const pdfPath = await createInvoice(comanda);

    res.json({ message: 'Mesa finalizada com sucesso.', comanda, pdfPath });
  } catch (error) {
    console.error('Erro ao finalizar mesa:', error);
    res.status(500).json({ message: 'Erro ao finalizar mesa', error: error.message });
  }
};

exports.getFinalizedTables = async (req, res) => {
  try {
    let { 
      page = 1, 
      limit = 20, 
      search = '', 
      sort = 'dataFinalizacao', 
      order = 'desc', 
      dataInicial, 
      dataFinal 
    } = req.query;

    const pg = parseInt(page);
    const lm = parseInt(limit);

    const query = {};

    // Se search não estiver vazio e for um número, filtra por numeroMesa
    if (search && search.trim() !== '') {
      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        // search é numérico, filtra por numeroMesa igual ao número
        query.numeroMesa = searchNum;
      } else {
        // Caso queira filtrar por outro campo textual futuramente, pode implementar aqui
        // Por agora, se não é número, não filtra. Ou seja, sem filtro por search textual.
      }
    }

    // Filtragem por data
    // Apenas aplica filtro se dataInicial ou dataFinal estiverem preenchidas
    let inicio = dataInicial && dataInicial.trim() !== '' ? new Date(dataInicial) : null;
    let fim = dataFinal && dataFinal.trim() !== '' ? new Date(dataFinal) : null;

    if (inicio && fim) {
      query.dataFinalizacao = { $gte: inicio, $lte: fim };
    } else if (inicio) {
      query.dataFinalizacao = { $gte: inicio };
    } else if (fim) {
      query.dataFinalizacao = { $lte: fim };
    }

    // Caso search esteja vazio e datas também, query permanece vazia, retornando todos
    // Isso significa que se não tiver nenhum parâmetro, retornará todos os registros

    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    const total = await FinalizedTable.countDocuments(query);
    const finalized = await FinalizedTable.find(query)
      .populate('ambienteId')
      .populate({
        path: 'pedidos',
        populate: { path: 'itens.product', model: 'Product' }
      })
      .sort(sortOption)
      .skip((pg - 1) * lm)
      .limit(lm);

    res.json({
      finalized,
      total,
      totalPages: Math.ceil(total / lm),
      currentPage: pg
    });
  } catch (error) {
    console.error('Erro ao obter mesas finalizadas:', error);
    res.status(500).json({ message: 'Erro interno ao obter mesas finalizadas' });
  }
};

exports.getFinalizedTableById = async (req, res) => {
  try {
    const { id } = req.params;
    const finalized = await FinalizedTable.findById(id)
      .populate('ambienteId')
      .populate({
        path: 'pedidos',
        populate: { path: 'itens.product', model: 'Product' }
      });

    if (!finalized) return res.status(404).json({ message: 'Registro não encontrado' });

    res.json(finalized);
  } catch (error) {
    console.error('Erro ao obter mesa finalizada:', error);
    res.status(500).json({ message: 'Erro interno ao obter mesa finalizada' });
  }
};



// Relatório de vendas por período
exports.getVendasPorPeriodo = async (req, res) => {
  try {
    const { dataInicial, dataFinal } = req.query;

    if (!dataInicial || !dataFinal) {
      return res.status(400).json({ message: 'Data inicial e final são obrigatórias' });
    }

    const inicio = new Date(dataInicial);
    const fim = new Date(dataFinal);
    fim.setHours(23,59,59,999);

    const vendas = await FinalizedTable.aggregate([
      {
        $match: {
          dataFinalizacao: {
            $gte: inicio,
            $lte: fim
          }
        }
      },
      {
        $group: {
          _id: null,
          totalVendas: { $sum: "$valorTotal" },
          totalMesas: { $sum: 1 }
        }
      }
    ]);

    const result = vendas[0] || { totalVendas: 0, totalMesas: 0 };

    res.json({
      dataInicial,
      dataFinal,
      totalVendas: result.totalVendas,
      totalMesas: result.totalMesas
    });
  } catch (error) {
    console.error('Erro ao obter vendas por período:', error);
    res.status(500).json({ message: 'Erro interno ao obter vendas por período' });
  }
};

// Relatório de vendas por garçom
exports.getVendasPorGarcom = async (req, res) => {
  try {
    const { dataInicial, dataFinal } = req.query;

    const inicio = dataInicial ? new Date(dataInicial) : new Date('1970-01-01');
    const fim = dataFinal ? new Date(dataFinal) : new Date();
    fim.setHours(23,59,59,999);

    // Agregado que desce nos pedidos, acha o garçom (se houver) e soma total
    const vendas = await FinalizedTable.aggregate([
      {
        $match: {
          dataFinalizacao: { $gte: inicio, $lte: fim }
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'pedidos',
          foreignField: '_id',
          as: 'pedidoDetails'
        }
      },
      { $unwind: '$pedidoDetails' },
      {
        $lookup: {
          from: 'users',
          localField: 'pedidoDetails.garcom',
          foreignField: '_id',
          as: 'garcomDetails'
        }
      },
      { $unwind: { path: '$garcomDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$garcomDetails.nome',
          totalVendas: { $sum: '$pedidoDetails.total' },
          pedidosCount: { $sum: 1 }
        }
      },
      { $sort: { totalVendas: -1 } }
    ]);

    res.json({ dataInicial, dataFinal, vendas });
  } catch (error) {
    console.error('Erro ao obter vendas por garçom:', error);
    res.status(500).json({ message: 'Erro interno ao obter vendas por garçom' });
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


// Conteúdo de: .\controllers\ingredientController.js
// server/controllers/ingredientController.js
const Ingredient = require('../models/Ingredient');

exports.createIngredient = async (req, res) => {
  try {
    const { nome, unidadeMedida, quantidadeEstoque, precoCusto } = req.body;
    let imagem = 'https://via.placeholder.com/150'; // URL padrão

    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
      imagem = imageUrl;
    }

    const newIngredient = new Ingredient({
      nome,
      unidadeMedida,
      quantidadeEstoque,
      precoCusto,
      imagem,
    });

    await newIngredient.save();
    res.status(201).json({ message: 'Ingrediente criado com sucesso!', ingredient: newIngredient });
  } catch (error) {
    console.error('Erro ao criar ingrediente:', error);
    res.status(500).json({ message: 'Erro ao criar ingrediente.', error: error.message });
  }
};

exports.getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.status(200).json(ingredients);
  } catch (error) {
    console.error('Erro ao obter ingredientes:', error);
    res.status(500).json({ message: 'Erro ao obter ingredientes.', error: error.message });
  }
};

exports.getIngredientById = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingrediente não encontrado.' });
    }
    res.status(200).json(ingredient);
  } catch (error) {
    console.error('Erro ao obter ingrediente:', error);
    res.status(500).json({ message: 'Erro ao obter ingrediente.', error: error.message });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const { nome, unidadeMedida, quantidadeEstoque, precoCusto } = req.body;
    let imagem = undefined;

    if (req.file) {
      imagem = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
    }

    const updateData = {
      nome,
      unidadeMedida,
      quantidadeEstoque,
      precoCusto,
    };

    if (imagem) {
      updateData.imagem = imagem;
    }

    const updatedIngredient = await Ingredient.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedIngredient) {
      return res.status(404).json({ message: 'Ingrediente não encontrado.' });
    }

    res.status(200).json({ message: 'Ingrediente atualizado com sucesso!', ingredient: updatedIngredient });
  } catch (error) {
    console.error('Erro ao atualizar ingrediente:', error);
    res.status(500).json({ message: 'Erro ao atualizar ingrediente.', error: error.message });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    const deletedIngredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!deletedIngredient) {
      return res.status(404).json({ message: 'Ingrediente não encontrado.' });
    }
    res.status(200).json({ message: 'Ingrediente deletado com sucesso!', ingredient: deletedIngredient });
  } catch (error) {
    console.error('Erro ao deletar ingrediente:', error);
    res.status(500).json({ message: 'Erro ao deletar ingrediente.', error: error.message });
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

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Table = require('../models/Table');
const Customer = require('../models/Customer');
// const Invoice = require('../models/Invoice');
// const Payment = require('../models/Payment');
// const printUtil = require('../utils/printUtil');

exports.createOrder = async (req, res) => {
  console.log('Recebendo requisição para criar pedido...');
  console.log('Corpo da requisição:', req.body);
  try {
    const {
      clienteId,
      mesaId,
      tipoPedido,
      assento,
      itens,
      numeroAssento,
      nomeCliente,
      enderecoEntrega,
      preparar,
    } = req.body;

    console.log('itens recebidos:', itens);

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ message: 'Nenhum item no pedido.' });
    }

    for (const item of itens) {
      if (!item.product) {
        return res.status(400).json({ message: 'Algum item não possui produto selecionado.' });
      }
    }

    const garcomId = req.user ? req.user.id : null;

    let total = 0;
    for (const item of itens) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Produto com ID ${item.product} não encontrado` });
      }
      if (product.quantidadeEstoque < item.quantidade) {
        return res.status(400).json({
          message: `Estoque insuficiente para o produto ${product.nome}`,
        });
      }
      total += product.preco * item.quantidade;
    }

    let enderecoEntregaFinal = enderecoEntrega;
    if (tipoPedido === 'entrega') {
      if (!clienteId) {
        return res.status(400).json({ message: 'clienteId é obrigatório para pedidos de entrega.' });
      }

      if (!enderecoEntregaFinal) {
        const cliente = await Customer.findById(clienteId);
        if (cliente) {
          enderecoEntregaFinal = `${cliente.rua}, ${cliente.numero}, ${cliente.complemento || ''}, ${cliente.bairro}, ${cliente.cidade}, ${cliente.estado}, CEP: ${cliente.cep}`;
        } else {
          return res.status(404).json({ message: `Cliente com ID ${clienteId} não encontrado` });
        }
      }
    }

    const orderData = {
      mesa: tipoPedido === 'local' ? mesaId : undefined,
      assento: tipoPedido === 'local' ? assento : undefined,
      itens,
      cliente: tipoPedido === 'entrega' ? clienteId : undefined,
      garcom: garcomId,
      total,
      status: 'Pendente',
      tipoPedido,
      numeroAssento: tipoPedido === 'local' ? numeroAssento : undefined,
      nomeCliente: tipoPedido === 'local' ? nomeCliente : undefined,
      enderecoEntrega: tipoPedido === 'entrega' ? enderecoEntregaFinal : undefined,
      preparar,
    };

    const order = new Order(orderData);
    await order.save();

    // Atualizar estoque de produtos
    for (const item of itens) {
      const product = await Product.findById(item.product);
      product.quantidadeEstoque -= item.quantidade;
      await product.save();
    }

    // Caso seja um pedido local, marcar a mesa como 'ocupada'
    if (tipoPedido === 'local' && mesaId) {
      await Table.findByIdAndUpdate(mesaId, { status: 'ocupada' });
    }

    if (global.io) {
      global.io.emit('novo_pedido', order);
    }

    res.status(201).json({ message: 'Pedido criado com sucesso', order });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(400).json({ message: 'Erro ao criar pedido', error: error.message });
  }
};

// Resto do controller permanece igual
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Tentando excluir o pedido com ID: ${id}`);

    // Encontre o pedido
    const order = await Order.findById(id).populate('itens.product');
    if (!order) {
      console.log('Pedido não encontrado.');
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    // Reverter alterações de estoque
    for (const item of order.itens) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.quantidadeEstoque += item.quantidade;
        await product.save();
        console.log(`Estoque atualizado para o produto ${product.nome}. Novo estoque: ${product.quantidadeEstoque}`);
      }
    }

    // Excluir o pedido sem transações
    await Order.findByIdAndDelete(id);
    console.log('Pedido excluído com sucesso.');

    res.status(200).json({ message: 'Pedido excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    res.status(500).json({ message: 'Erro ao excluir pedido.', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params; // Alterado de orderId para id
  const { status } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    order.status = status;
    await order.save();

    res.json({ message: 'Status do pedido atualizado com sucesso', order });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ message: 'Erro ao atualizar status do pedido' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    let { page, limit, mesaId } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;

    const query = {};
    if (mesaId) {
      query.mesa = mesaId;
    }

    const totalOrders = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('mesa')
      .populate('cliente')
      .populate('garcom')
      .populate('itens.product')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(totalOrders / limit);

    res.json({ orders, totalPages });
  } catch (error) {
    console.error('Erro ao obter pedidos:', error);
    res.status(500).json({ message: 'Erro ao obter pedidos.' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('mesa')
      .populate('cliente')
      .populate('garcom')
      .populate('itens.product'); // Popula os detalhes dos produtos nos itens
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    res.json(order);
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(400).json({ message: 'Erro ao obter pedido', error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.tipoPedido === 'entrega' && !updates.clienteId) {
      return res.status(400).json({ message: 'clienteId é obrigatório para pedidos de entrega.' });
    }

    if (updates.tipoPedido === 'entrega' && !updates.enderecoEntrega) {
      const cliente = await Customer.findById(updates.clienteId);
      if (cliente) {
        updates.enderecoEntrega = `${cliente.rua}, ${cliente.numero}, ${cliente.complemento || ''}, ${cliente.bairro}, ${cliente.cidade}, ${cliente.estado}, CEP: ${cliente.cep}`;
      } else {
        return res.status(404).json({ message: `Cliente com ID ${updates.clienteId} não encontrado` });
      }
    }

    const order = await Order.findById(id).populate('itens.product');
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    // Handle stock adjustments
    const oldItens = order.itens.map(item => ({
      product: item.product._id.toString(),
      quantidade: item.quantidade,
    }));
    const newItens = updates.itens || order.itens.map(item => ({
      product: item.product.toString(),
      quantidade: item.quantidade,
    }));

    // Create a map for old and new items
    const oldMap = {};
    oldItens.forEach(item => {
      oldMap[item.product] = item.quantidade;
    });

    const newMap = {};
    newItens.forEach(item => {
      newMap[item.product] = item.quantidade;
    });

    // Adjust stock
    for (const productId in newMap) {
      const newQty = newMap[productId];
      const oldQty = oldMap[productId] || 0;
      if (newQty > oldQty) {
        // Decrease stock by the difference
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: `Produto com ID ${productId} não encontrado` });
        }
        if (product.quantidadeEstoque < (newQty - oldQty)) {
          return res.status(400).json({
            message: `Estoque insuficiente para o produto ${product.nome}`,
          });
        }
        product.quantidadeEstoque -= (newQty - oldQty);
        await product.save();
      } else if (newQty < oldQty) {
        // Increase stock by the difference
        const product = await Product.findById(productId);
        if (product) {
          product.quantidadeEstoque += (oldQty - newQty);
          await product.save();
        }
      }
      // Remove from oldMap to identify removed items
      delete oldMap[productId];
    }

    // Items in oldMap are removed in the update, so restore their stock
    for (const productId in oldMap) {
      const oldQty = oldMap[productId];
      const product = await Product.findById(productId);
      if (product) {
        product.quantidadeEstoque += oldQty;
        await product.save();
      }
    }

    // Agora, aplicar as atualizações
    const allowedUpdates = ['mesa', 'assento', 'itens', 'cliente', 'garcom', 'tipoPedido', 'enderecoEntrega', 'preparar'];
    allowedUpdates.forEach((field) => {
      if (field in updates) {
        order[field] = updates[field];
      }
    });

    // Recalcular total
    if (updates.itens) {
      let total = 0;
      for (const item of updates.itens) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ message: `Produto com ID ${item.product} não encontrado` });
        }
        total += product.preco * item.quantidade;
      }
      order.total = total;
    }

    await order.save();

    // Emitir evento de atualização via Socket.IO
    if (global.io) {
      global.io.emit('atualizacao_pedido', order);
    }

    // Re-populate the order before sending
    const updatedOrder = await Order.findById(id)
      .populate('mesa')
      .populate('cliente')
      .populate('garcom')
      .populate('itens.product');

    res.json({ message: 'Pedido atualizado com sucesso.', order: updatedOrder });
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(400).json({ message: 'Erro ao atualizar pedido.', error: error.message });
  }
};


// Conteúdo de: .\controllers\paymentController.js
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

    // Atualizar status do pedido para "Entregue"
    order.status = 'Entregue';
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
    const products = await Product.find().populate('categoria');
    res.json(products);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter produtos', error: error.message });
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


// Conteúdo de: .\controllers\qrController.js
// controllers/qrController.js
const User = require('../models/User');
const QrToken = require('../models/QrToken');
const jwt = require('jsonwebtoken');
const config = require('../config');
const crypto = require('crypto');
const QRCode = require('qrcode');

exports.generateQrToken = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId é obrigatório' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    // Gerar um token aleatório
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expira em 5 minutos

    await QrToken.create({ user: user._id, token, expiresAt });

    // Gerar QR Code com o token
    const qrData = { token }; // Apenas o token
    const qrString = JSON.stringify(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString);

    res.json({ qrCodeDataURL, expiresAt });
  } catch (error) {
    console.error('Erro ao gerar QR Token:', error);
    res.status(500).json({ message: 'Erro interno ao gerar QR Token' });
  }
};

exports.loginWithQr = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token do QR Code é obrigatório' });

    const qrRecord = await QrToken.findOne({ token, used: false });
    if (!qrRecord) return res.status(400).json({ message: 'Token inválido ou expirado' });

    if (qrRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Token expirado' });
    }

    const user = await User.findById(qrRecord.user);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    // Marcar token como usado
    qrRecord.used = true;
    await qrRecord.save();

    // Gerar JWT
    const jwtToken = jwt.sign({ id: user._id, role: user.role, permissions: user.permissions }, config.jwtSecret, { expiresIn: '8h' });

    res.json({ token: jwtToken, user });
  } catch (error) {
    console.error('Erro ao fazer login com QR:', error);
    res.status(500).json({ message: 'Erro interno ao fazer login com QR' });
  }
};

exports.generatePermanentQr = async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: 'userId é obrigatório' });
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
  
      // Definir a senha fixa de acordo com a role
      let senhaEmTextoClaro;
      if (user.role === 'admin') {
        senhaEmTextoClaro = 'mzgxdyj8';
      } else {
        senhaEmTextoClaro = 'senha123';
      }
  
      const data = {
        usuario: user.email,
        senha: senhaEmTextoClaro
      };
  
      const qrString = JSON.stringify(data);
      const qrCodeDataURL = await QRCode.toDataURL(qrString);
  
      res.json({ qrCodeDataURL });
    } catch (error) {
      console.error('Erro ao gerar QR Code Permanente:', error);
      res.status(500).json({ message: 'Erro interno ao gerar QR Code', error: error.message });
    }
  };


// Conteúdo de: .\controllers\recipeController.js
// controllers/recipeController.js

const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');

exports.createRecipe = async (req, res) => {
  try {
    const { nome, categoria, ingredientes, precoVenda, descricao } = req.body;

    // Verificar se todos os ingredientes existem
    for (const item of ingredientes) {
      const ingrediente = await Ingredient.findById(item.ingrediente);
      if (!ingrediente) {
        return res.status(404).json({ message: `Ingrediente com ID ${item.ingrediente} não encontrado` });
      }
    }

    const recipe = new Recipe({ nome, categoria, ingredientes, precoVenda, descricao });
    await recipe.save();
    res.status(201).json({ message: 'Receita criada com sucesso', recipe });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field.toUpperCase()} já está em uso.` });
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
    const { id } = req.params;
    const { nome, categoria, ingredientes, precoVenda, descricao } = req.body;

    // Verificar se todos os ingredientes atualizados existem
    if (ingredientes) {
      for (const item of ingredientes) {
        const ingrediente = await Ingredient.findById(item.ingrediente);
        if (!ingrediente) {
          return res.status(404).json({ message: `Ingrediente com ID ${item.ingrediente} não encontrado` });
        }
      }
    }

    const recipe = await Recipe.findByIdAndUpdate(
      id,
      { nome, categoria, ingredientes, precoVenda, descricao },
      { new: true, runValidators: true }
    ).populate('ingredientes.ingrediente');

    if (!recipe) return res.status(404).json({ message: 'Receita não encontrada' });
    res.json({ message: 'Receita atualizada com sucesso', recipe });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field.toUpperCase()} já está em uso.` });
    }
    res.status(400).json({ message: 'Erro ao atualizar receita', error: error.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findByIdAndDelete(id);
    if (!recipe) return res.status(404).json({ message: 'Receita não encontrada' });
    res.json({ message: 'Receita excluída com sucesso', recipe });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao excluir receita', error: error.message });
  }
};


// Conteúdo de: .\controllers\reportController.js
// src/controllers/reportController.js

const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Reservation = require('../models/Reservation'); 
const Payment = require('../models/Payment'); 

/**
 * Obtém todas as estatísticas do sistema.
 */
exports.getStatistics = async (req, res) => {
  try {
    // Total de Vendas
    const totalVendasResult = await Order.aggregate([
      { $match: { status: 'Pago' } }, // Ajustado para 'Pago'
      { $group: { _id: null, totalVendas: { $sum: '$total' } } },
    ]);
    const totalVendas = totalVendasResult[0]?.totalVendas || 0;

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
          total: { $sum: '$itens.quantidade' },
        },
      },
      {
        $project: {
          _id: 0,
          categoria: '$_id',
          total: 1,
        },
      },
    ]);

    // Produtos Mais Vendidos
    const produtosMaisVendidos = await Order.aggregate([
      { $unwind: '$itens' },
      {
        $group: {
          _id: '$itens.product',
          total: { $sum: '$itens.quantidade' },
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

    // Produtos com Estoque Baixo
    const produtosComEstoqueBaixo = await Product.find({ quantidadeEstoque: { $lte: 5 }, disponivel: true })
      .sort({ quantidadeEstoque: 1 })
      .limit(10)
      .populate('categoria');

    // Vendas nos Últimos 7 Dias
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 6); // Inclui hoje
    seteDiasAtras.setHours(0, 0, 0, 0);

    const vendasUltimos7Dias = await Order.aggregate([
      { $match: { status: 'Pago', createdAt: { $gte: seteDiasAtras } } }, // Ajustado para 'Pago'
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

    // Métodos de Pagamento
    const metodosPagamento = await Payment.aggregate([
      { $match: { status: 'Pago' } }, // Ajustado para 'Pago'
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
      { $match: { status: 'Pago' } }, // Ajustado para 'Pago'
      {
        $group: {
          _id: '$garcom',
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
    dozeMesesAtras.setHours(0, 0, 0, 0);

    const vendasPorMes = await Order.aggregate([
      { $match: { status: 'Pago', createdAt: { $gte: dozeMesesAtras } } }, // Ajustado para 'Pago'
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
      totalPedidos,
      totalClientes,
      totalProdutos,
      totalReservas,
      vendasPorCategoria,
      produtosMaisVendidos,
      produtosComEstoqueBaixo,
      vendasUltimos7Dias,
      metodosPagamento,
      vendasPorFuncionario,
      vendasPorMes,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
};

/**
 * Obtém os 10 produtos com menor quantidade em estoque.
 */
exports.getProdutosComEstoqueBaixo = async (req, res) => {
  try {
    const produtosComEstoqueBaixo = await Product.find({ quantidadeEstoque: { $lte: 5 }, disponivel: true })
      .sort({ quantidadeEstoque: 1 })
      .limit(10)
      .populate('categoria');

    res.json(produtosComEstoqueBaixo);
  } catch (error) {
    console.error('Erro ao obter produtos com estoque baixo:', error);
    res.status(500).json({ message: 'Erro ao obter produtos com estoque baixo' });
  }
};


// Conteúdo de: .\controllers\reservationController.js
// controllers/reservationController.js
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const Customer = require('../models/Customer');

exports.deleteReservation = async (req, res) => {
  try {
    const { reservationId } = req.params; // Deve corresponder ao nome do parâmetro na rota

    const reserva = await Reservation.findById(reservationId);
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    // Atualizar o status da mesa para 'livre'
    const mesa = await Table.findById(reserva.mesa);
    if (mesa) {
      mesa.status = 'livre';
      await mesa.save();
    }

    // Deletar a reserva
    await Reservation.findByIdAndDelete(reservationId);

    res.status(200).json({ message: 'Reserva excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir reserva:', error);
    res.status(500).json({ message: 'Erro ao excluir reserva.', error: error.message });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { clienteId, mesaId, dataReserva, numeroPessoas, status } = req.body;

    // Verificar se a mesa está disponível
    const mesa = await Table.findById(mesaId);
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    if (mesa.status !== 'livre') {
      return res.status(400).json({ message: 'Mesa não está disponível.' });
    }

    // Verificar se o cliente existe
    const cliente = await Customer.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }

    // Criar reserva
    const reservation = new Reservation({
      cliente: clienteId,
      mesa: mesaId,
      dataReserva,
      numeroPessoas,
      status,
    });

    await reservation.save();

    // Atualizar status da mesa para 'ocupada'
    mesa.status = 'ocupada';
    await mesa.save();

    res.status(201).json({ message: 'Reserva criada com sucesso.', reservation });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ message: 'Erro ao criar reserva.', error: error.message });
  }
};

// Função para atualizar uma reserva
exports.updateReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { clienteId, mesaId, dataReserva, numeroPessoas, status } = req.body;

    const reserva = await Reservation.findById(reservationId).populate('mesa');
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    // Se a mesa foi alterada, verificar disponibilidade
    if (mesaId && mesaId !== reserva.mesa._id.toString()) {
      const novaMesa = await Table.findById(mesaId);
      if (!novaMesa) {
        return res.status(404).json({ message: 'Nova mesa não encontrada.' });
      }

      if (novaMesa.status !== 'livre') {
        return res.status(400).json({ message: 'Nova mesa não está disponível.' });
      }

      // Atualizar status da mesa anterior para 'livre'
      const mesaAnterior = await Table.findById(reserva.mesa._id);
      mesaAnterior.status = 'livre';
      await mesaAnterior.save();

      // Atualizar status da nova mesa para 'ocupada'
      novaMesa.status = 'ocupada';
      await novaMesa.save();

      // Atualizar mesa na reserva
      reserva.mesa = mesaId;
    }

    // Atualizar outros campos
    if (clienteId) reserva.cliente = clienteId;
    if (dataReserva) reserva.dataReserva = dataReserva;
    if (numeroPessoas) reserva.numeroPessoas = numeroPessoas;
    if (status) reserva.status = status;

    await reserva.save();

    // Populando novamente para retornar dados completos
    const reservaAtualizada = await Reservation.findById(reservationId)
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      });

    res.status(200).json({ message: 'Reserva atualizada com sucesso.', reservation: reservaAtualizada });
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    res.status(500).json({ message: 'Erro ao atualizar reserva.', error: error.message });
  }
};

// Função para buscar reservas avançadas com paginação e população
exports.getAdvancedReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'dataReserva', order = 'asc', search = '' } = req.query;

    const query = {};

    if (search) {
      // Buscar por número da mesa ou nome do ambiente
      query.$or = [
        { 'mesa.numeroMesa': { $regex: search, $options: 'i' } },
        { 'mesa.ambiente.nome': { $regex: search, $options: 'i' } },
      ];
    }

    const reservations = await Reservation.find()
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      })
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Reservation.countDocuments();

    res.json({
      reservations,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Erro ao obter reservas avançadas:', error);
    res.status(500).json({ message: 'Erro ao obter reservas avançadas.', error: error.message });
  }
};

// Função para deletar uma reserv

// Função para obter detalhes de uma reserva específica (opcional)
exports.getReservationById = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reserva = await Reservation.findById(reservationId)
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      });

    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    res.json({ reservation: reserva });
  } catch (error) {
    console.error('Erro ao obter reserva por ID:', error);
    res.status(500).json({ message: 'Erro ao obter reserva.', error: error.message });
  }
};

exports.getReservationsAdvanced = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const total = await Reservation.countDocuments();
    const totalPages = Math.ceil(total / limit);

    const reservations = await Reservation.find()
      .populate('cliente')
      .populate({ path: 'mesa', populate: { path: 'ambiente' } })
      .sort({ dataReserva: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      reservations,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Erro ao obter reservas:', error);
    res.status(400).json({ message: 'Erro ao obter reservas', error: error.message });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { clienteId, mesaId, dataReserva, numeroPessoas, status } = req.body;

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

    // Verificar se a mesa suporta o número de pessoas
    if (mesa.capacidade < numeroPessoas) {
      return res.status(400).json({ message: 'Número de pessoas excede a capacidade da mesa.' });
    }

    // Verificar se a mesa está disponível na data e horário desejados
    const startOfDay = new Date(dataReserva);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dataReserva);
    endOfDay.setHours(23, 59, 59, 999);

    const overlappingReservations = await Reservation.findOne({
      mesa: mesaId,
      dataReserva: { $gte: startOfDay, $lte: endOfDay },
      status: 'ativa',
    });

    if (overlappingReservations) {
      return res.status(400).json({ message: 'Mesa já reservada para esta data.' });
    }

    const reservation = new Reservation({
      cliente: clienteId,
      mesa: mesaId,
      dataReserva,
      numeroPessoas: parseInt(numeroPessoas, 10),
      status: status || 'ativa',
    });

    await reservation.save();

    // Atualizar o status da mesa para 'reservada'
    mesa.status = 'reservada';
    await mesa.save();

    res.status(201).json({ message: 'Reserva criada com sucesso', reservation });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
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
    const { reservationId } = req.params;
    const reservation = await Reservation.findById(reservationId)
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
    const { reservationId } = req.params;
    const updates = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }

    // Se mesaId, dataReserva ou numeroPessoas forem atualizados, verificar disponibilidade
    if (updates.mesaId || updates.dataReserva || updates.numeroPessoas) {
      const mesaId = updates.mesaId || reservation.mesa;
      const dataReserva = updates.dataReserva || reservation.dataReserva;
      const numeroPessoas = updates.numeroPessoas || reservation.numeroPessoas;

      const mesa = await Table.findById(mesaId);
      if (!mesa) {
        return res.status(404).json({ message: 'Mesa não encontrada' });
      }

      if (mesa.capacidade < numeroPessoas) {
        return res.status(400).json({ message: 'Número de pessoas excede a capacidade da mesa.' });
      }

      const startOfDay = new Date(dataReserva);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dataReserva);
      endOfDay.setHours(23, 59, 59, 999);

      const overlappingReservations = await Reservation.findOne({
        mesa: mesaId,
        dataReserva: { $gte: startOfDay, $lte: endOfDay },
        status: 'ativa',
        _id: { $ne: reservationId },
      });

      if (overlappingReservations) {
        return res.status(400).json({ message: 'Mesa já reservada para esta data.' });
      }

      // Atualizar o status da mesa anterior para 'livre' se estiver mudando de mesa
      if (updates.mesaId && updates.mesaId !== reservation.mesa.toString()) {
        const mesaAnterior = await Table.findById(reservation.mesa);
        if (mesaAnterior) {
          mesaAnterior.status = 'livre';
          await mesaAnterior.save();
        }
      }

      // Atualizar o status da nova mesa para 'reservada'
      mesa.status = 'reservada';
      await mesa.save();
    }

    // Atualizar a reserva
    Object.assign(reservation, updates);
    if (updates.numeroPessoas) {
      reservation.numeroPessoas = parseInt(updates.numeroPessoas, 10);
    }
    await reservation.save();

    const updatedReservation = await Reservation.findById(reservationId)
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      });

    res.json({ message: 'Reserva atualizada com sucesso', reservation: updatedReservation });
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    res.status(400).json({ message: 'Erro ao atualizar reserva', error: error.message });
  }
};


// Implementação adicional para obter mesas disponíveis
exports.getAvailableTables = async (req, res) => {
  try {
    const { dataReserva } = req.query;
    console.log(`Recebido dataReserva: ${dataReserva}`);

    if (!dataReserva) {
      console.log('dataReserva não fornecida');
      return res.status(400).json({ message: 'Data da reserva é obrigatória' });
    }

    const startOfDay = new Date(dataReserva);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dataReserva);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Procurando mesas indisponíveis entre ${startOfDay} e ${endOfDay}`);

    const unavailableTables = await Reservation.find({
      dataReserva: { $gte: startOfDay, $lte: endOfDay },
      status: 'ativa',
    }).select('mesa');

    const unavailableTableIds = unavailableTables.map((reserva) => reserva.mesa);
    console.log(`IDs de mesas indisponíveis: ${unavailableTableIds}`);

    const availableTables = await Table.find({
      _id: { $nin: unavailableTableIds },
      capacidade: { $gte: 1 }, // Ajuste conforme necessário
    }).populate('ambiente');

    console.log(`Mesas disponíveis encontradas: ${availableTables.length}`);

    res.json(availableTables);
  } catch (error) {
    console.error('Erro ao obter mesas disponíveis:', error);
    res.status(500).json({ message: 'Erro ao obter mesas disponíveis', error: error.message });
  }
};

// Função para criar uma reserva
exports.createReservation = async (req, res) => {
  try {
    const { clienteId, mesaId, dataReserva, numeroPessoas, status } = req.body;

    // Verificar se a mesa está disponível
    const mesa = await Table.findById(mesaId);
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    if (mesa.status !== 'livre') {
      return res.status(400).json({ message: 'Mesa não está disponível.' });
    }

    // Verificar se o cliente existe
    const cliente = await Customer.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }

    // Criar reserva
    const reservation = new Reservation({
      cliente: clienteId,
      mesa: mesaId,
      dataReserva,
      numeroPessoas,
      status,
    });

    await reservation.save();

    // Atualizar status da mesa para 'ocupada'
    mesa.status = 'ocupada';
    await mesa.save();

    res.status(201).json({ message: 'Reserva criada com sucesso.', reservation });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ message: 'Erro ao criar reserva.', error: error.message });
  }
};

// Função para atualizar uma reserva
exports.updateReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { clienteId, mesaId, dataReserva, numeroPessoas, status } = req.body;

    const reserva = await Reservation.findById(reservationId).populate('mesa');
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    // Se a mesa foi alterada, verificar disponibilidade
    if (mesaId && mesaId !== reserva.mesa._id.toString()) {
      const novaMesa = await Table.findById(mesaId);
      if (!novaMesa) {
        return res.status(404).json({ message: 'Nova mesa não encontrada.' });
      }

      if (novaMesa.status !== 'livre') {
        return res.status(400).json({ message: 'Nova mesa não está disponível.' });
      }

      // Atualizar status da mesa anterior para 'livre'
      const mesaAnterior = await Table.findById(reserva.mesa._id);
      mesaAnterior.status = 'livre';
      await mesaAnterior.save();

      // Atualizar status da nova mesa para 'ocupada'
      novaMesa.status = 'ocupada';
      await novaMesa.save();

      // Atualizar mesa na reserva
      reserva.mesa = mesaId;
    }

    // Atualizar outros campos
    if (clienteId) reserva.cliente = clienteId;
    if (dataReserva) reserva.dataReserva = dataReserva;
    if (numeroPessoas) reserva.numeroPessoas = numeroPessoas;
    if (status) reserva.status = status;

    await reserva.save();

    // Populando novamente para retornar dados completos
    const reservaAtualizada = await Reservation.findById(reservationId)
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      });

    res.status(200).json({ message: 'Reserva atualizada com sucesso.', reservation: reservaAtualizada });
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    res.status(500).json({ message: 'Erro ao atualizar reserva.', error: error.message });
  }
};

// Função para buscar reservas avançadas com paginação e população
exports.getAdvancedReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'dataReserva', order = 'asc', search = '' } = req.query;

    const query = {};

    if (search) {
      // Buscar por número da mesa ou nome do ambiente
      query.$or = [
        { 'mesa.numeroMesa': { $regex: search, $options: 'i' } },
        { 'mesa.ambiente.nome': { $regex: search, $options: 'i' } },
      ];
    }

    const reservations = await Reservation.find()
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      })
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Reservation.countDocuments();

    res.json({
      reservations,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Erro ao obter reservas avançadas:', error);
    res.status(500).json({ message: 'Erro ao obter reservas avançadas.', error: error.message });
  }
};

// Função para deletar uma reserva

// Função para obter detalhes de uma reserva específica (opcional)
exports.getReservationById = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reserva = await Reservation.findById(reservationId)
      .populate('cliente')
      .populate({
        path: 'mesa',
        populate: { path: 'ambiente' },
      });

    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    res.json({ reservation: reserva });
  } catch (error) {
    console.error('Erro ao obter reserva por ID:', error);
    res.status(500).json({ message: 'Erro ao obter reserva.', error: error.message });
  }
};


// Conteúdo de: .\controllers\salesGoalController.js
// controllers/salesGoalController.js

const SalesGoal = require('../models/SalesGoal');
const User = require('../models/User');
const Product = require('../models/Product'); // Importação do modelo Product
const FinalizedTable = require('../models/FinalizedTable'); // Importação do modelo FinalizedTable
const mongoose = require('mongoose');

// Obter uma meta de vendas por ID
exports.getSalesGoalById = async (req, res) => {
  const { id } = req.params;
  try {
    const salesGoal = await SalesGoal.findById(id).populate('employee manager product');
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }
    res.json(salesGoal);
  } catch (error) {
    console.error('Erro ao obter meta de vendas específica:', error);
    res.status(500).json({ message: 'Erro ao obter meta de vendas específica.', error: error.message });
  }
};

// Criar nova meta de vendas
exports.createSalesGoal = async (req, res) => {
  try {
    const { employeeId, productId, goalName, goalAmount, startDate, endDate } = req.body;

    // Verifica se o funcionário existe e é um agente
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'agent') {
      return res.status(404).json({ message: 'Funcionário não encontrado ou não é um agente' });
    }

    // Verifica se o produto existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Verifica se o gerente tem permissão para atribuir meta a este funcionário
    if (req.user.role === 'manager' && (!employee.manager || employee.manager.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Você não tem permissão para definir metas para este funcionário' });
    }

    // Verifica se startDate é antes de endDate
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'startDate deve ser antes de endDate' });
    }

    // Cria a meta de vendas
    const salesGoal = new SalesGoal({
      employee: employeeId,
      manager: req.user.id,
      product: productId,
      goalName,
      goalAmount,
      startDate,
      endDate,
    });

    await salesGoal.save();

    res.status(201).json({ message: 'Meta de vendas criada com sucesso', salesGoal });
  } catch (error) {
    console.error('Erro ao criar meta de vendas:', error);
    res.status(400).json({ message: 'Erro ao criar meta de vendas', error: error.message });
  }
};

// Obter todas as metas de vendas (Admin e Manager)
exports.getSalesGoals = async (req, res) => {
  try {
    let salesGoals;
    if (req.user.role === 'admin') {
      salesGoals = await SalesGoal.find().populate('employee manager product');
    } else if (req.user.role === 'manager') {
      salesGoals = await SalesGoal.find({ manager: req.user.id }).populate('employee manager product');
    } else {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(salesGoals);
  } catch (error) {
    console.error('Erro ao obter metas de vendas:', error);
    res.status(500).json({ message: 'Erro ao obter metas de vendas.' });
  }
};

// Atualizar uma meta de vendas
exports.updateSalesGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, goalName, goalAmount, startDate, endDate, productId } = req.body;

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

    // Verifica se startDate é antes de endDate
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'startDate deve ser antes de endDate' });
    }

    // Atualiza o funcionário se employeeId for fornecido
    if (employeeId !== undefined) {
      const employee = await User.findById(employeeId);
      if (!employee || employee.role !== 'agent') {
        return res.status(404).json({ message: 'Funcionário não encontrado ou não é um agente' });
      }

      // Se o usuário for gerente, verifica se ele gerencia o funcionário
      if (req.user.role === 'manager' && (!employee.manager || employee.manager.toString() !== req.user.id)) {
        return res.status(403).json({ message: 'Você não tem permissão para atribuir esta meta a este funcionário' });
      }

      salesGoal.employee = employeeId;
    }

    // Atualiza outros campos
    if (goalName !== undefined) salesGoal.goalName = goalName;
    if (goalAmount !== undefined) salesGoal.goalAmount = goalAmount;
    if (startDate !== undefined) salesGoal.startDate = startDate;
    if (endDate !== undefined) salesGoal.endDate = endDate;

    // Atualiza o produto se productId for fornecido
    if (productId !== undefined) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      salesGoal.product = productId;
    }

    await salesGoal.save();

    res.json({ message: 'Meta de vendas atualizada com sucesso', salesGoal });
  } catch (error) {
    console.error('Erro ao atualizar meta de vendas:', error);
    res.status(500).json({ message: 'Erro ao atualizar meta de vendas', error: error.message });
  }
};

// Excluir uma meta de vendas
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

    // Substitui salesGoal.remove() por salesGoal.deleteOne()
    await salesGoal.deleteOne();

    res.json({ message: 'Meta de vendas excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir meta de vendas:', error);
    res.status(500).json({ message: 'Erro ao excluir meta de vendas', error: error.message });
  }
};

// Obter metas de vendas por funcionário
exports.getSalesGoalsByEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o usuário autenticado tem permissão para acessar os dados
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    // Busca as metas de vendas do funcionário específico
    const salesGoals = await SalesGoal.find({ employee: id }).populate('employee manager product');

    res.json(salesGoals);
  } catch (error) {
    console.error('Erro ao obter metas de vendas do funcionário:', error);
    res.status(500).json({ message: 'Erro ao obter metas de vendas do funcionário.', error: error.message });
  }
};

// Obter metas de vendas avançadas com paginação e pesquisa
exports.getAdvancedSalesGoals = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'asc', search = '' } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { goalName: { $regex: search, $options: 'i' } },
        { 'employee.nome': { $regex: search, $options: 'i' } },
        { 'product.nome': { $regex: search, $options: 'i' } },
      ];
    }

    const salesGoals = await SalesGoal.find(query)
      .populate('employee manager product')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SalesGoal.countDocuments(query);

    res.json({
      salesGoals,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Erro ao obter metas de vendas avançadas:', error);
    res.status(500).json({ message: 'Erro ao obter metas de vendas avançadas.', error: error.message });
  }
};

// Obter detalhes da meta de vendas
exports.getSalesGoalDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const salesGoal = await SalesGoal.findById(id).populate('employee manager product');
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }

    // Agregando dados das mesas finalizadas (FinalizedTable)
    const finalizedTables = await FinalizedTable.find({
      garcomId: salesGoal.employee,
      dataFinalizacao: { $gte: salesGoal.startDate, $lte: salesGoal.endDate },
      // Filtra pedidos pelo produto da meta
      'pedidos.product': salesGoal.product,
    }).populate({
      path: 'pedidos.product',
      model: 'Product',
    });

    // Calculando o total vendido para o produto específico
    let totalSold = 0;
    const sales = [];

    finalizedTables.forEach(table => {
      table.pedidos.forEach(pedido => {
        if (pedido.product && pedido.product._id.toString() === salesGoal.product.toString()) {
          const saleAmount = (pedido.quantidade || 0) * (pedido.product.preco || 0); // Supondo que o produto tenha campo 'preco'
          totalSold += saleAmount;
          sales.push({
            date: table.dataFinalizacao,
            amount: saleAmount,
          });
        }
      });
    });

    // Limitando as últimas 10 vendas
    const lastTenSales = sales.slice(-10).reverse();

    res.json({ totalSold, sales: lastTenSales });
  } catch (error) {
    console.error('Erro ao obter detalhes da meta de vendas:', error);
    res.status(500).json({ message: 'Erro ao obter detalhes da meta de vendas.', error: error.message });
  }
};


// Conteúdo de: .\controllers\stockController.js
// src/controllers/stockController.js

const Product = require('../models/Product');

exports.getStock = async (req, res) => {
  try {
    const stockItems = await Product.find()
      .select('nome quantidadeEstoque categoria')
      .populate('categoria', 'categoria');
    res.json(stockItems);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter dados de estoque', error: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantidadeEstoque } = req.body;

    if (quantidadeEstoque === undefined || quantidadeEstoque < 0) {
      return res.status(400).json({ message: 'quantidadeEstoque deve ser um número positivo.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    product.quantidadeEstoque = quantidadeEstoque;
    await product.save();

    res.json({ message: 'Estoque atualizado', product });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar estoque', error: error.message });
  }
};


// Conteúdo de: .\controllers\tableController.js
// controllers/tableController.js
const mongoose = require('mongoose');
const Table = require('../models/Table');
const Ambiente = require('../models/Ambiente');
const FinalizedTable = require('../models/FinalizedTable');
const Order = require('../models/Order');
const { createInvoice } = require('../utils/pdfUtil'); // Supondo que createInvoice está em utils/pdfUtil.js
const Comanda = require('../models/Comanda'); // Importando o modelo Comanda
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


async function areAllOrdersPaid(pedidos) {
  const pendingOrder = await Order.findOne({ _id: { $in: pedidos }, status: { $ne: 'Entregue' } });
  return !pendingOrder;
}

async function sumOrdersValue(pedidos) {
  const orders = await Order.find({ _id: { $in: pedidos } });
  return orders.reduce((acc, order) => acc + order.total, 0);
};

// **Função única getAvailableTables com populate**
exports.getAvailableTables = async (req, res) => {
  try {
    const availableTables = await Table.find({ status: 'livre' }).populate('ambiente');
    res.json({ tables: availableTables });
  } catch (error) {
    console.error('Erro ao obter mesas disponíveis:', error);
    res.status(500).json({ message: 'Erro ao obter mesas disponíveis.', error: error.message });
  }
};

exports.getTableById = async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await Table.findById(tableId).populate('ambiente');

    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    res.json({ table });
  } catch (error) {
    console.error('Erro ao obter mesa por ID:', error);
    res.status(500).json({ message: 'Erro ao obter mesa.', error: error.message });
  }
};




// Finalizar uma mesa
exports.finalizarMesa = async (req, res) => {
  const mesaId = req.params.id;
  const { formaPagamento, valorPago, tipoDesconto, valorDesconto } = req.body;

  try {
    // Validar mesa
    const mesa = await Table.findById(mesaId).populate('ambiente');
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada' });
    }

    if (mesa.status !== 'ocupada') {
      return res.status(400).json({ message: 'Mesa já está finalizada ou não está ocupada' });
    }

    // Buscar pedidos da mesa com status 'Entregue'
    const pedidos = await Order.find({ mesa: mesaId, status: 'Entregue' }).populate('itens.product');
    if (pedidos.length === 0) {
      return res.status(400).json({ message: 'Nenhum pedido entregue para finalizar nesta mesa' });
    }

    // Calcular total da mesa
    let totalMesa = pedidos.reduce((acc, pedido) => acc + pedido.total, 0);

    // Aplicar desconto
    let totalComDesconto = totalMesa;
    if (tipoDesconto === 'porcentagem') {
      const pct = parseFloat(valorDesconto) || 0;
      totalComDesconto = totalMesa - (totalMesa * (pct / 100));
    } else if (tipoDesconto === 'valor') {
      const val = parseFloat(valorDesconto) || 0;
      totalComDesconto = Math.max(totalMesa - val, 0);
    }

    // Verificar se o valor pago é suficiente (caso pagamento em dinheiro)
    if (formaPagamento === 'dinheiro') {
      const pago = parseFloat(valorPago) || 0;
      if (pago < totalComDesconto) {
        return res.status(400).json({ message: 'Valor pago menor que o total com desconto' });
      }
    }

    // Criar comanda
    const comandaData = {
      mesa: mesa.numeroMesa,
      pedidos: pedidos.map(pedido => ({
        orderNumber: pedido.orderNumber,
        itens: pedido.itens.map(item => ({
          quantidade: item.quantidade,
          nome: item.product.nome,
          preco: item.product.preco,
          total: item.product.preco * item.quantidade,
        })),
        total: pedido.total,
      })),
      valorTotal: totalMesa,
      tipoDesconto,
      valorDesconto: parseFloat(valorDesconto) || 0,
      totalComDesconto,
      formaPagamento,
      valorPago: parseFloat(valorPago) || 0,
      troco: 0, // Pode ser calculado se necessário
      dataFinalizacao: new Date(),
    };

    // Se for dinheiro, calcular troco
    if (formaPagamento === 'dinheiro') {
      const pago = parseFloat(valorPago) || 0;
      const troco = pago > totalComDesconto ? (pago - totalComDesconto) : 0;
      comandaData.troco = troco;
    }

    const comanda = new Comanda(comandaData);
    await comanda.save();

    // Gerar PDF da comanda
    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const path = require('path');

    const pdfDoc = new PDFDocument();
    const pdfDir = path.join(__dirname, '../public/comandas');
    const pdfFilename = `${comanda._id}.pdf`;
    const pdfPathFull = path.join(pdfDir, pdfFilename);

    fs.mkdirSync(pdfDir, { recursive: true });

    pdfDoc.pipe(fs.createWriteStream(pdfPathFull));

    // Cabeçalho do PDF
    pdfDoc.fontSize(20).text(`Comanda - Mesa ${mesa.numeroMesa}`, { align: 'center' });
    pdfDoc.moveDown();

    pedidos.forEach(pedido => {
      pdfDoc.fontSize(16).text(`Pedido #${pedido.orderNumber}`);
      pedido.itens.forEach(item => {
        pdfDoc.fontSize(12).text(`${item.quantidade} x ${item.product.nome} - R$ ${(item.product.preco * item.quantidade).toFixed(2)}`);
      });
      pdfDoc.fontSize(14).text(`Total do Pedido: R$ ${pedido.total.toFixed(2)}`);
      pdfDoc.moveDown();
    });

    pdfDoc.fontSize(14).text(`Total da Mesa: R$ ${totalMesa.toFixed(2)}`);
    if (tipoDesconto === 'porcentagem') {
      pdfDoc.text(`Desconto: ${valorDesconto}%`);
    } else if (tipoDesconto === 'valor') {
      pdfDoc.text(`Desconto: R$ ${parseFloat(valorDesconto).toFixed(2)}`);
    } else {
      pdfDoc.text(`Desconto: Nenhum`);
    }

    pdfDoc.text(`Total com Desconto: R$ ${totalComDesconto.toFixed(2)}`);
    pdfDoc.text(`Forma de Pagamento: ${formaPagamento}`);
    pdfDoc.text(`Valor Pago: R$ ${(parseFloat(valorPago) || 0).toFixed(2)}`);
    if (formaPagamento === 'dinheiro') {
      const pago = parseFloat(valorPago) || 0;
      const troco = pago - totalComDesconto;
      if (troco > 0) {
        pdfDoc.text(`Troco: R$ ${troco.toFixed(2)}`);
      }
    }

    pdfDoc.end();

    const pdfPathRelative = `/comandas/${pdfFilename}`;

    // Criar registro de mesa finalizada
    const finalizedMesa = new FinalizedTable({
      numeroMesa: mesa.numeroMesa,
      ambienteId: mesa.ambiente._id,
      garcomId: req.user.id,
      pedidos: pedidos.map(pedido => pedido._id),
      valorTotal: totalMesa,
      formaPagamento,
      valorPago: parseFloat(valorPago) || 0,
      tipoDesconto: tipoDesconto || 'nenhum',
      valorDesconto: parseFloat(valorDesconto) || 0,
      dataFinalizacao: new Date(),
      pdfPath: pdfPathRelative,
    });

    await finalizedMesa.save();

    // Atualizar status da mesa para 'livre'
    mesa.status = 'livre';
    await mesa.save();

    // Atualizar status dos pedidos para 'Finalizado'
    await Order.updateMany({ mesa: mesaId, status: 'Entregue' }, { status: 'Finalizado' });

    // Retornar resposta com o caminho do PDF
    res.json({ comanda, pdfPath: pdfPathRelative });
  } catch (error) {
    console.error('Erro ao finalizar mesa:', error);
    res.status(500).json({ message: 'Erro ao finalizar mesa' });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { numeroMesa, ambienteId, capacidade } = req.body;

    console.log('Dados recebidos para criação de mesa:', req.body);

    const ambiente = await Ambiente.findById(ambienteId);
    if (!ambiente) {
      return res.status(404).json({ message: 'Ambiente não encontrado' });
    }

    const mesaExistente = await Table.findOne({ numeroMesa });
    if (mesaExistente) {
      return res.status(400).json({ message: 'Número da mesa já está em uso.' });
    }

    const assentos = [];
    for (let i = 1; i <= capacidade; i++) {
      assentos.push({ numeroAssento: i });
    }

    const table = new Table({
      numeroMesa,
      ambiente: ambienteId,
      capacidade,
      assentos,
      status: 'livre'
    });

    await table.save();

    console.log('Mesa criada:', table);

    res.status(201).json({ message: 'Mesa criada com sucesso', table });
  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    res.status(400).json({ message: 'Erro ao criar mesa', error: error.message });
  }
};

// **Remova a segunda definição de getAvailableTables**
/*
exports.getAvailableTables = async (req, res) => {
  try {
    const availableTables = await Table.find({ status: 'livre' });
    res.json({ tables: availableTables });
  } catch (error) {
    console.error('Erro ao obter mesas disponíveis:', error);
    res.status(500).json({ message: 'Erro ao obter mesas disponíveis.', error: error.message });
  }
};
*/

exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find().populate('ambiente');
    res.json(tables);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao obter mesas', error: error.message });
  }
};

exports.getAdvancedTables = async (req, res) => {
  try {
    let { page = 1, limit = 20, sort = 'numeroMesa', order = 'asc', search = '' } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const sortOptions = {};
    if (sort) {
      sortOptions[sort] = order === 'asc' ? 1 : -1;
    }

    const query = {};
    if (search) {
      query.$or = [
        { numeroMesa: { $regex: search, $options: 'i' } }
      ];
    }

    const tables = await Table.find(query)
      .populate('ambiente')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await Table.countDocuments(query).exec();

    res.json({
      tables,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Erro ao obter mesas avançadas:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const updates = req.body;

    console.log('Dados recebidos para atualização de mesa:', updates);

    if (updates.capacidade && updates.capacidade < 1) {
      return res.status(400).json({ message: 'Capacidade deve ser pelo menos 1.' });
    }

    if (updates.ambienteId || updates.ambiente) { // Ajustado para capturar ambienteId ou ambiente
      const ambienteId = updates.ambienteId || updates.ambiente;
      const ambiente = await Ambiente.findById(ambienteId);
      if (!ambiente) {
        return res.status(404).json({ message: 'Ambiente não encontrado' });
      }
    }

    if (updates.numeroMesa) {
      const mesaExistente = await Table.findOne({ numeroMesa: updates.numeroMesa, _id: { $ne: tableId } });
      if (mesaExistente) {
        return res.status(400).json({ message: 'Número da mesa já está em uso.' });
      }
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada' });
    }

    // Atualizar capacidade
    if (updates.capacidade && updates.capacidade !== table.capacidade) {
      if (updates.capacidade > table.capacidade) {
        for (let i = table.capacidade + 1; i <= updates.capacidade; i++) {
          table.assentos.push({ numeroAssento: i });
        }
      } else {
        table.assentos = table.assentos.slice(0, updates.capacidade);
      }
      table.capacidade = updates.capacidade;
    }

    if (updates.numeroMesa !== undefined) table.numeroMesa = updates.numeroMesa;
    if (updates.ambienteId || updates.ambiente !== undefined) table.ambiente = updates.ambienteId || updates.ambiente;
    if (updates.position !== undefined) table.position = updates.position;

    await table.save();

    console.log('Mesa atualizada:', table);

    res.json({ message: 'Mesa atualizada com sucesso', table });
  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
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

exports.updateTableStatus = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { status } = req.body;

    const validStatuses = ['livre', 'ocupada', 'reservada'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    // Populando os pedidos dentro dos assentos
    const table = await Table.findById(tableId).populate({
      path: 'assentos.pedidos',
      model: 'Order',
    });

    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    if (status.toLowerCase() === 'livre') {
      // Extrair todos os IDs de pedidos dos assentos
      const pedidoIds = table.assentos.reduce((acc, assento) => {
        if (assento.pedidos && assento.pedidos.length > 0) {
          return acc.concat(assento.pedidos.map(pedido => pedido._id));
        }
        return acc;
      }, []);

      if (pedidoIds.length > 0) {
        const allPaid = await areAllOrdersPaid(pedidoIds);
        if (!allPaid) {
          return res.status(400).json({ message: 'Não é possível marcar como livre. Há pedidos pendentes.' });
        }
      }
    }

    if (status.toLowerCase() === 'ocupada' && table.status !== 'livre') {
      return res.status(400).json({ message: 'Só é possível marcar como ocupada se a mesa estiver livre.' });
    }

    if (status.toLowerCase() === 'reservada' && table.status !== 'livre') {
      return res.status(400).json({ message: 'Só é possível marcar como reservada se a mesa estiver livre.' });
    }

    table.status = status.toLowerCase();
    await table.save();

    res.status(200).json({ message: 'Status da mesa atualizado com sucesso.', table });
  } catch (error) {
    console.error('Erro ao atualizar status da mesa:', error);
    res.status(400).json({ message: 'Erro ao atualizar status da mesa.', error: error.message });
  }
};

exports.finalizeTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { formaPagamento, valorPago, valorDesconto, tipoDesconto } = req.body;

    const table = await Table.findById(tableId).populate('orders');
    if (!table) {
      return res.status(404).json({ message: 'Mesa não encontrada' });
    }

    if (table.status !== 'ocupada') {
      return res.status(400).json({ message: 'Mesa não está ocupada.' });
    }

    const pedidoIds = table.pedidos.map(p => p._id || p);

    const allPaid = await areAllOrdersPaid(pedidoIds);
    if (!allPaid) {
      return res.status(400).json({ message: 'Existem pedidos pendentes nesta mesa.' });
    }

    let valorTotal = await sumOrdersValue(pedidoIds);

    // Aplicar desconto, se houver
    let valorFinal = valorTotal;
    if (tipoDesconto === 'porcentagem' && valorDesconto > 0) {
      valorFinal = valorFinal - (valorFinal * (valorDesconto / 100));
    } else if (tipoDesconto === 'valor' && valorDesconto > 0) {
      valorFinal = Math.max(valorFinal - valorDesconto, 0);
    }

    // Caso pagamento em dinheiro, verificar se valorPago é suficiente
    if (formaPagamento === 'dinheiro' && valorPago < valorFinal) {
      return res.status(400).json({ message: 'Valor pago menor que o total final com desconto.' });
    }

    const finalizedTable = new FinalizedTable({
      numeroMesa: table.numeroMesa,
      ambienteId: table.ambiente,
      pedidos: pedidoIds,
      valorTotal: valorFinal,
      formaPagamento: formaPagamento || 'dinheiro',
      valorPago: valorPago || 0,
      tipoDesconto: tipoDesconto || 'nenhum',
      valorDesconto: valorDesconto || 0,
    });
    await finalizedTable.save();

    table.status = 'livre';
    table.pedidos = [];
    await table.save();

    return res.status(200).json({ message: 'Mesa finalizada com sucesso', table, finalizedTable });
  } catch (error) {
    console.error('Erro ao finalizar mesa:', error);
    return res.status(500).json({ message: 'Erro ao finalizar mesa', error: error.message });
  }
};


// Conteúdo de: .\controllers\timeController.js
// controllers/timeController.js
exports.getServerTime = (req, res) => {
    try {
      const serverTime = new Date();
      res.json({ serverTime });
    } catch (error) {
      console.error('Erro ao obter hora do servidor:', error);
      res.status(500).json({ message: 'Erro ao obter hora do servidor', error: error.message });
    }
  };
  

// Conteúdo de: .\controllers\userController.js
const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Lista de todas as permissões válidas
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
  'configSystem',
];

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, role, permissions, managerId, senha } = req.body;

    // Buscar o usuário que se deseja atualizar
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar permissões de quem está logado (req.user)
    if (req.user.role !== 'admin') {
      // Se não for admin
      if (req.user.role === 'manager') {
        // Manager só pode atualizar seus agentes
        // Verificar se o userToUpdate é agent e se manager dele é o req.user
        if (userToUpdate.role !== 'agent' || String(userToUpdate.manager) !== String(req.user.id)) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
      } else {
        // Se não é admin nem manager, não pode atualizar
        return res.status(403).json({ message: 'Acesso negado' });
      }
    }

    // Filtrar permissões para incluir apenas as válidas
    let filteredPermissions = [];
    if (Array.isArray(permissions)) {
      filteredPermissions = permissions.filter((perm) => allPermissions.includes(perm));
    }

    // Montar objeto de atualização
    const updateData = {
      nome,
      email,
      role,
      permissions: filteredPermissions
    };

    // Se for agent, managerId é obrigatório
    if (role === 'agent') {
      if (!managerId) {
        return res.status(400).json({ message: 'managerId é obrigatório para agentes' });
      }
      updateData.manager = managerId;
    } else {
      // Caso contrário, remove o campo manager
      updateData.manager = undefined;
    }

    // Se senha for enviada, atualizar a senha
    if (senha && senha.trim() !== '') {
      const hashedPassword = await bcrypt.hash(senha, 10);
      updateData.senha = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado após atualização' });
    }

    res.json({ message: 'Usuário atualizado com sucesso', user: updatedUser });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar membro da equipe', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    // Supondo que o req.user foi definido pelo authMiddleware com { id: ..., role: ..., permissions: ... }
    const userId = req.user.id;
    const user = await User.findById(userId).select('nome email role permissions');

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao obter usuário logado:', error);
    res.status(500).json({ message: 'Erro ao obter usuário logado', error: error.message });
  }
};

exports.getTeamMembers = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    let teamMembers;
    if (req.user.role === 'admin') {
      // Admin pode ver todos os agentes e gerentes
      teamMembers = await User.find({ role: { $in: ['agent', 'manager'] } })
        .populate('manager', 'nome email role');
    } else {
      // Manager vê apenas seus agentes
      teamMembers = await User.find({ manager: req.user.id, role: 'agent' })
        .populate('manager', 'nome email role');
    }

    res.json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter membros da equipe', error: error.message });
  }
};


// Conteúdo de: .\middlewares\auditMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const allPermissions = require("../permissions"); // Certifique-se de que este arquivo existe e está correto

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


// Conteúdo de: .\middlewares\debugMiddleware.js
// middlewares/logMiddleware.js

module.exports = (req, res, next) => {
  const startTime = Date.now();

  // Clona a função original de envio de resposta
  const originalSend = res.send;

  // Cria um "gancho" na função send para capturar o que é enviado na resposta
  res.send = function (body) {
    // Tempo total da requisição
    const totalTime = Date.now() - startTime;

    // Logar detalhes da resposta
    console.log('========== Resposta ===========');
    console.log('Status:', res.statusCode);
    console.log('Resposta (body):', body);
    console.log('Tempo:', totalTime + 'ms');
    console.log('===============================');

    // Retorna a resposta original
    return originalSend.call(this, body);
  };

  // Logar detalhes da requisição
  console.log('========== Requisição =========');
  console.log('Método:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('Body da Requisição:', req.body);
  console.log('===============================');

  // Continua para o próximo middleware ou para o controlador
  next();
};


// Conteúdo de: .\middlewares\errorMiddleware.js
// middlewares/errorMiddleware.js
function errorMiddleware(err, req, res, next) {
  console.error('--- ERROR MIDDLEWARE START ---');
  console.error('Method:', req.method);
  console.error('URL:', req.originalUrl);
  console.error('Headers:', JSON.stringify(req.headers, null, 2));
  console.error('Params:', JSON.stringify(req.params, null, 2));
  console.error('Query:', JSON.stringify(req.query, null, 2));
  console.error('Body:', JSON.stringify(req.body, null, 2));
  console.error('Error Stack:', err.stack);
  console.error('--- ERROR MIDDLEWARE END ---');

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Algo deu errado!';

  res.status(statusCode).json({ message, error: err.message });
}

module.exports = errorMiddleware;


// Conteúdo de: .\middlewares\permissionMiddleware.js
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


// Conteúdo de: .\middlewares\requestLogger.js
// middlewares/requestLogger.js
const fs = require('fs');
const path = require('path');

const requestLogger = (req, res, next) => {
  const logDirectory = path.join(__dirname, '../logs');

  // Certifica-se de que a pasta de logs existe
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
  }

  const logFile = path.join(logDirectory, 'requests.log');
  const timestamp = new Date().toISOString();
  const logEntry = `
  [${timestamp}] ${req.method} ${req.originalUrl}
  Headers: ${JSON.stringify(req.headers, null, 2)}
  Params: ${JSON.stringify(req.params, null, 2)}
  Query: ${JSON.stringify(req.query, null, 2)}
  Body: ${JSON.stringify(req.body, null, 2)}
  ------------------------------
  `;

  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Erro ao gravar log de requisição:', err);
    }
  });

  // Também exibe no console
  console.log(logEntry);

  next();
};

module.exports = requestLogger;


// Conteúdo de: .\middlewares\roleMiddleware.js
function roleMiddleware(requiredRoles) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
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
const mongoose = require('mongoose');

const AmbienteSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  limitePessoas: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Ambiente', AmbienteSchema);


// Conteúdo de: .\models\AuditLog.js
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
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  categoria: { type: String, required: true, unique: true },
  descricao: { type: String },
  habilitado: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);


// Conteúdo de: .\models\Comanda.js
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


// Conteúdo de: .\models\Config.js
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


// Conteúdo de: .\models\Customer.js
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


// Conteúdo de: .\models\Employee.js
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


// Conteúdo de: .\models\FinalizedOrder.js
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


// Conteúdo de: .\models\FinalizedTable.js
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


// Conteúdo de: .\models\IfoodToken.js
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


// Conteúdo de: .\models\Ingredient.js
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


// Conteúdo de: .\models\Invoice.js
const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  numeroFatura: { type: String, required: true, unique: true },
  dataEmissao: { type: Date, default: Date.now },
  valorTotal: { type: Number, required: true },
  status: { type: String, enum: ['emitida', 'cancelada'], default: 'emitida' },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);


// Conteúdo de: .\models\Order.js
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


// Conteúdo de: .\models\Payment.js
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


// Conteúdo de: .\models\QrToken.js
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


// Conteúdo de: .\models\Recipe.js
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


// Conteúdo de: .\models\Reservation.js
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


// Conteúdo de: .\models\Sale.js
// models/Sale.js

const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  salesGoal: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesGoal', required: true },
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  // Outros campos relevantes
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);


// Conteúdo de: .\models\SalesGoal.js
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


// Conteúdo de: .\models\Table.js
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


// Conteúdo de: .\models\todo-backend.js
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
}, { timestamps: true });

const FinalizedTable = mongoose.model('FinalizedTable', FinalizedTableSchema);

module.exports = FinalizedTable;


// Conteúdo de: .\IfoodToken.js
const mongoose = require('mongoose');

const IfoodTokenSchema = new mongoose.Schema({
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresIn: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Opcional: Adicionar método para verificar se o token expirou
IfoodTokenSchema.methods.isExpired = function () {
  return (Date.now() - this.createdAt.getTime()) > this.expiresIn * 1000;
};

module.exports = mongoose.model('IfoodToken', IfoodTokenSchema);


// Conteúdo de: .\Ingredient.js
const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  unidadeMedida: { type: String, required: true }, // Ex: kg, g, l
  quantidadeEstoque: { type: Number, required: true, default: 0 },
  precoCusto: { type: Number, required: true },
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
// models/Order.js
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
      enum: ['Pendente', 'Preparando', 'Pronto', 'Entregue'], 
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


// Conteúdo de: .\SalesGoal.js
const mongoose = require('mongoose');

const SalesGoalSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  numeroMesa: { type: Number, required: true, unique: true },
  status: { type: String, enum: ['livre', 'ocupada', 'reservada'], default: 'livre' },
  capacidade: { type: Number, required: true, min: 1 },
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
}, { timestamps: true });

const FinalizedTable = mongoose.model('FinalizedTable', FinalizedTableSchema);

module.exports = FinalizedTable;


// Conteúdo de: .\IfoodToken.js
const mongoose = require('mongoose');

const IfoodTokenSchema = new mongoose.Schema({
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresIn: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Opcional: Adicionar método para verificar se o token expirou
IfoodTokenSchema.methods.isExpired = function () {
  return (Date.now() - this.createdAt.getTime()) > this.expiresIn * 1000;
};

module.exports = mongoose.model('IfoodToken', IfoodTokenSchema);


// Conteúdo de: .\Ingredient.js
const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  unidadeMedida: { type: String, required: true }, // Ex: kg, g, l
  quantidadeEstoque: { type: Number, required: true, default: 0 },
  precoCusto: { type: Number, required: true },
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
// models/Order.js
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
      enum: ['Pendente', 'Preparando', 'Pronto', 'Entregue'], 
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




// Conteúdo de: .\models\User.js
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


// Conteúdo de: .\routes\ambienteRoutes.js
const express = require('express');
const router = express.Router();
const ambienteController = require('../controllers/ambienteController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para ambientes
router.post('/', authMiddleware, roleMiddleware(['manager']), ambienteController.createAmbiente);
router.get('/', authMiddleware, roleMiddleware(['manager', 'agent']), ambienteController.getAmbientes);
router.put('/:id', authMiddleware, roleMiddleware(['manager']), ambienteController.updateAmbiente);
router.delete('/:id', authMiddleware, roleMiddleware(['manager']), ambienteController.deleteAmbiente);

module.exports = router;


// Conteúdo de: .\routes\authRoutes.js
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


// Rota para atualizar usuário
router.put('/users/:id', authMiddleware, roleMiddleware(['admin', 'manager']), authController.updateUser);
module.exports = router;


// Conteúdo de: .\routes\categoryRoutes.js
// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');


router.get('/', authMiddleware, categoryController.getAllCategories);


// Criar categoria
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createCategory']),
  categoryController.createCategory
);

// Buscar categorias avançadas com paginação, pesquisa e ordenação
router.get(
  '/advanced',
  authMiddleware,
  permissionMiddleware(['viewCategory']),
  categoryController.getCategories
);

// Obter categoria por ID
router.get(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['viewCategory']),
  categoryController.getCategoryById
);

// Atualizar categoria
router.put(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['editCategory']),
  categoryController.updateCategory
);

// Deletar categoria
router.delete(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['deleteCategory']),
  categoryController.deleteCategory
);

module.exports = router;


// Conteúdo de: .\routes\comandaRoutes.js
// cash-register-backend/routes/comandaRoutes.js
const express = require('express');
const router = express.Router();
const comandaController = require('../controllers/comandaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/', authMiddleware, roleMiddleware(['manager', 'admin']), comandaController.getComandas);
router.get('/:id/pdf', authMiddleware, roleMiddleware(['manager', 'admin']), comandaController.downloadComandaPDF);
router.post('/send-email', authMiddleware, roleMiddleware(['manager', 'admin']), comandaController.sendComandaEmail);

module.exports = router;


// Conteúdo de: .\routes\configRoutes.js
// cash-register-backend/routes/configRoutes.js
const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para armazenar a imagem do logotipo em 'public/images'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Apenas imagens JPEG, JPG, PNG e GIF são permitidas'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

router.get('/', authMiddleware, roleMiddleware(['admin']), configController.getConfig);
router.post('/', authMiddleware, roleMiddleware(['admin']), upload.single('logotipo'), configController.createConfig);
router.put('/', authMiddleware, roleMiddleware(['admin']), upload.single('logotipo'), configController.updateConfig);

module.exports = router;


// Conteúdo de: .\routes\customerRoutes.js
// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomersAdvanced, // Importando o novo método
} = require('../controllers/customerController');


// **Nova Rota para busca avançada - Deve vir antes das rotas com parâmetros dinâmicos**
router.get('/advanced', getCustomersAdvanced);

// Rota para criação de cliente
router.post('/', createCustomer);

// Rota para obter todos os clientes (sem paginação)
router.get('/', getCustomers);

// Rotas com parâmetros dinâmicos devem vir por último
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;


// Conteúdo de: .\routes\employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para funcionários
router.post('/', authMiddleware, roleMiddleware(['manager']), employeeController.createEmployee);
router.get('/', authMiddleware, roleMiddleware(['manager']), employeeController.getEmployees);
router.get('/:id', authMiddleware, roleMiddleware(['manager']), employeeController.getEmployeeById);
router.put('/:id', authMiddleware, roleMiddleware(['manager']), employeeController.updateEmployee);
router.delete('/:id', authMiddleware, roleMiddleware(['manager']), employeeController.deleteEmployee);

// Rota pública para login
router.post('/login', employeeController.loginEmployee);

module.exports = router;


// Conteúdo de: .\routes\finalizedTableRoutes.js
// routes/finalizedTableRoutes.js
const express = require('express');
const router = express.Router();
const finalizedTableController = require('../controllers/finalizedTableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Obter lista de mesas finalizadas (com paginação, pesquisa, ordenação)
router.get('/', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getFinalizedTables);

// Obter uma mesa finalizada específica
router.get('/:id', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getFinalizedTableById);

// Relatório de vendas por período
router.get('/relatorios/periodo', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getVendasPorPeriodo);

// Relatório de vendas por garçom
router.get('/relatorios/garcom', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getVendasPorGarcom);

router.post('/:id/finalizar', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.finalizarMesa);

module.exports = router;


// Conteúdo de: .\routes\ifoodRoutes.js
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
// server/routes/ingredientRoutes.js
const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para armazenar as imagens em 'public/images'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'images')); // Caminho para 'public/images'
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Nome único para o arquivo
  },
});

// Filtro para aceitar apenas tipos de imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Apenas imagens JPEG, JPG, PNG e GIF são permitidas'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

// Rotas para ingredientes
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['manager']),
  upload.single('imagem'), // Middleware de upload para campo 'imagem'
  ingredientController.createIngredient
);

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['manager', 'agent']),
  ingredientController.getIngredients
);

router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['manager', 'agent']),
  ingredientController.getIngredientById
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['manager']),
  upload.single('imagem'), // Middleware de upload para campo 'imagem'
  ingredientController.updateIngredient
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['manager']),
  ingredientController.deleteIngredient
);

module.exports = router;


// Conteúdo de: .\routes\integrationRoutes.js
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para integrações
router.get('/delivery-orders', authMiddleware, roleMiddleware(['manager', 'admin']), integrationController.fetchDeliveryOrders);

module.exports = router;


// Conteúdo de: .\routes\orderRoutes.js
// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para pedidos

// Rota para criar um novo pedido
router.post('/', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.createOrder);

// Rota para obter todos os pedidos
router.get('/', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.getOrders);

// Rota para obter um pedido por ID
router.get('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.getOrderById);

// Rota para atualizar o status de um pedido
router.put('/:id/status', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.updateOrderStatus);

// **Nova Rota para Atualizar Pedido Completo**
router.put('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.updateOrder);

// Rota para excluir um pedido
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.deleteOrder);

module.exports = router;


// Conteúdo de: .\routes\paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para pagamentos
router.post('/', authMiddleware, roleMiddleware(['agent', 'manager', 'admin']), paymentController.processPayment);

module.exports = router;


// Conteúdo de: .\routes\productRoutes.js
// routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// **Nova Rota para Verificar Duplicidade de Nome**
// Esta rota deve ser adicionada antes das rotas dinâmicas para evitar conflitos.
router.get(
  '/check-nome/:nome',
  authMiddleware,
  permissionMiddleware(['viewProduct']), // Ajuste as permissões conforme necessário
  productController.checkNomeDuplicado
);

// **Nova Rota para Busca Avançada - Deve Vir Antes das Rotas Dinâmicas**
router.get(
  '/advanced',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProductsAdvanced
);

// Criar produto - requer a permissão 'createProduct'
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createProduct']),
  productController.createProduct
);

// Obter todos os produtos - requer a permissão 'viewProduct'
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProducts
);

// Obter produto por ID - requer a permissão 'viewProduct'
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
  productController.deleteProduct
);

module.exports = router;


// Conteúdo de: .\routes\qrRoutes.js
// routes/qrRoutes.js
const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Somente admin ou manager geram o crachá
router.post('/generate', authMiddleware, roleMiddleware(['manager', 'admin']), qrController.generatePermanentQr);

// Endpoint para login via QR (público, pois só recebe o token gerado)
router.post('/login', authMiddleware, qrController.loginWithQr);

module.exports = router;


// Conteúdo de: .\routes\recipeRoutes.js
const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para receitas
router.post('/', authMiddleware, roleMiddleware(['manager']), recipeController.createRecipe);
router.get('/', authMiddleware, roleMiddleware(['manager', 'agent']), recipeController.getRecipes);
router.get('/:id', authMiddleware, roleMiddleware(['manager', 'agent']), recipeController.getRecipeById);
router.put('/:id', authMiddleware, roleMiddleware(['manager']), recipeController.updateRecipe);
router.delete('/:id', authMiddleware, roleMiddleware(['manager']), recipeController.deleteRecipe);

module.exports = router;


// Conteúdo de: .\routes\reportRoutes.js
// src/routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware'); // Middleware de autenticação

// Rota para obter todas as estatísticas
router.get('/statistics', authMiddleware, reportController.getStatistics);

// Rota para obter produtos com estoque baixo
router.get('/produtosComEstoqueBaixo', authMiddleware, reportController.getProdutosComEstoqueBaixo);

module.exports = router;


// Conteúdo de: .\routes\reservationRoutes.js
// routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// Rotas avançadas
router.get(
  '/advanced',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservationsAdvanced
);

// Criar reserva
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createReservation']),
  reservationController.createReservation
);

// Obter todas as reservas
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservations
);

// Obter reserva por ID
router.get(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservationById
);

// Atualizar reserva
router.put(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['editReservation']),
  reservationController.updateReservation
);

// Deletar reserva
router.delete(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['deleteReservation']),
  reservationController.deleteReservation
);

// Obter mesas disponíveis para uma data específica
router.get(
  '/tables/available',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservationsAdvanced
);

module.exports = router;


// Conteúdo de: .\routes\salesGoalRoutes.js
// routes/salesGoalRoutes.js

const express = require('express');
const router = express.Router();
const salesGoalController = require('../controllers/salesGoalController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Obter metas de vendas avançadas com paginação e pesquisa
router.get(
  '/advanced',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.getAdvancedSalesGoals
);

// Criar nova meta de vendas
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.createSalesGoal
);  

// Obter todas as metas de vendas (Admin e Manager)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.getSalesGoals
);

// Obter metas de vendas por funcionário
router.get(
  '/employee/:id',
  authMiddleware,
  roleMiddleware(['agent', 'admin', 'manager']),
  salesGoalController.getSalesGoalsByEmployee
);

// Atualizar uma meta de vendas
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.updateSalesGoal
);

// Excluir uma meta de vendas
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.deleteSalesGoal
);

// Obter detalhes da meta de vendas
router.get(
  '/:id/details',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.getSalesGoalDetails
);

module.exports = router;


// Conteúdo de: .\routes\stockRoutes.js
// src/routes/stockRoutes.js

const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para estoque
router.get('/', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), stockController.getStock);
router.put('/:productId', authMiddleware, roleMiddleware(['manager', 'admin']), stockController.updateStock);

module.exports = router;


// Conteúdo de: .\routes\tableRoutes.js
// routes/tableRoutes.js

const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para Mesas
router.post('/', authMiddleware, roleMiddleware(['manager', 'admin']), tableController.createTable);
router.get('/', authMiddleware, roleMiddleware(['manager', 'agent', 'admin']), tableController.getTables);
router.get('/advanced', authMiddleware, roleMiddleware(['manager', 'agent', 'admin']), tableController.getAdvancedTables);
router.put('/:tableId', authMiddleware, roleMiddleware(['manager', 'admin']), tableController.updateTable);
router.delete('/:tableId', authMiddleware, roleMiddleware(['manager', 'admin']), tableController.deleteTable);

// Finalizar Mesa
router.post('/:id/finalizar', authMiddleware, roleMiddleware(['manager', 'agent', 'admin']), tableController.finalizarMesa);

// Atualizar Status da Mesa
router.put('/:tableId/status', authMiddleware, roleMiddleware(['manager', 'agent', 'admin']), tableController.updateTableStatus);
router.get('/available', authMiddleware, roleMiddleware(['manager', 'admin']), tableController.getAvailableTables);

module.exports = router;


// Conteúdo de: .\routes\timeRoutes.js
// routes/timeRoutes.js
const express = require('express');
const router = express.Router();
const timeController = require('../controllers/timeController');
const authMiddleware = require('../middlewares/authMiddleware'); // Se necessário

router.get('/', authMiddleware, timeController.getServerTime);

module.exports = router;


// Conteúdo de: .\routes\uploadRoute.js
// routes/uploadRoute.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/authMiddleware'); // Ajuste conforme necessário

// Configuração do multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images'); // Diretório para salvar as imagens
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// Rota de Upload
router.post('/', authMiddleware, upload.single('imagem'), (req, res, next) => {
  if (!req.file) {
    const error = new Error('Nenhum arquivo enviado.');
    error.statusCode = 400;
    return next(error);
  }

  // Construir a URL da imagem
  const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

module.exports = router;


// Conteúdo de: .\routes\userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Obter membros da equipe
router.get(
  '/team-members',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  userController.getTeamMembers
);

// Atualizar usuário (PUT)
router.put(
  '/:id',
  authMiddleware, roleMiddleware(['admin', 'manager']), userController.updateUser
  // Aqui não limitamos a role diretamente, pois a lógica está no controller.
  // Mas se quiser, pode permitir apenas admin e manager:
  // roleMiddleware(['admin', 'manager'])
);

router.get('/me', authMiddleware, userController.getMe);


router.get(
  '/employees/list',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  async (req, res) => {
    try {
      const employees = await User.find({ role: { $in: ['manager', 'agent'] } }).select('nome email');
      res.json(employees);
    } catch (error) {
      console.error('Erro ao obter funcionários:', error);
      res.status(500).json({ message: 'Erro ao obter funcionários', error: error.message });
    }
  }
);

module.exports = router;


// Conteúdo de: .\scripts\migrateTables.js
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


// Conteúdo de: .\scripts\orderMigration.js
const mongoose = require('mongoose');
const Order = require('../models/Order');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Conectado ao MongoDB');

    // Encontra todos os pedidos que ainda utilizam 'receita' nos itens
    const orders = await Order.find({ 'itens.receita': { $exists: true } });
    console.log(`Encontrados ${orders.length} pedidos com itens.receita`);

    for (const order of orders) {
      const updatedItens = order.itens.map(item => {
        if (item.receita) {
          return { product: item.receita, quantidade: item.quantidade, tipo: item.tipo || 'prato principal' };
        }
        return item;
      });
      order.itens = updatedItens;
      await order.save();
      console.log(`Pedido ${order._id} atualizado`);
    }

    console.log('Migração concluída');
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('Erro na migração:', error);
    mongoose.disconnect();
  });


// Conteúdo de: .\utils\emailUtil.js
// utils/emailUtil.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envia um email.
 * @param {string} to - Endereço do destinatário.
 * @param {string} subject - Assunto do email.
 * @param {string} text - Texto simples do email.
 * @param {string} [html] - Conteúdo em HTML do email.
 * @param {Array} [attachments] - Array de anexos, cada objeto contendo { filename, path, contentType }.
 */
exports.sendEmail = async (to, subject, text, html = null, attachments = []) => {
  try {
    const mailOptions = {
      from: `"Seu Restaurante" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments, // Anexos opcionais
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email enviado para ${to} com assunto "${subject}"`);
  } catch (error) {
    console.error(`Erro ao enviar email para ${to}:`, error);
    throw error;
  }
};


// Conteúdo de: .\utils\pdfUtil.js
// cash-register-backend/utils/pdfUtil.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Config = require('../models/Config');

exports.createInvoice = async (comanda) => {
  return new Promise(async (resolve, reject) => {
    // Obter configuração do estabelecimento
    const config = await Config.findOne();
    if (!config) {
      return reject(new Error('Configuração do estabelecimento não encontrada. Não é possível gerar comanda.'));
    }

    const doc = new PDFDocument({
      size: [227, 800],
      margins: { top: 10, bottom: 10, left: 5, right: 5 }
    });

    const invoiceDir = path.join(__dirname, '..', 'public', 'comandas');
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }

    const filePath = path.join(invoiceDir, `${comanda._id}.pdf`);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.font('Helvetica').fontSize(10);

    // Cabeçalho baseado na config
    if (config.logotipo) {
      try {
        doc.image(path.join(__dirname, '..', 'public', 'images', config.logotipo), { fit: [60, 60], align: 'center', valign: 'top' });
        doc.moveDown(1);
      } catch(e) {
        // Se não achar logotipo, ignora
      }
    }

    doc.fontSize(12).text(config.razaoSocial.toUpperCase(), { align: 'center', underline: true });
    doc.moveDown(0.5);

    doc.fontSize(8)
      .text(`CNPJ: ${config.cnpj}`, { align: 'center' })
      .text(`IE: ${config.ie}`, { align: 'center' })
      .text(`${config.logradouro}, ${config.numero} - ${config.bairro}`, { align: 'center' })
      .text(`${config.cidade} - ${config.uf}`, { align: 'center' })
      .text(`Fone: ${config.telefone}`, { align: 'center' })
      .text(`Email: ${config.email}`, { align: 'center' });

    if (config.site) {
      doc.text(`Site: ${config.site}`, { align: 'center' });
    }

    doc.moveDown(1);

    doc.fontSize(10).text(`Comanda da Mesa: ${comanda.mesa}`, { align: 'left' });
    doc.text(`Data: ${new Date(comanda.createdAt).toLocaleString()}`, { align: 'left' });
    doc.text(`Finalização: ${new Date(comanda.dataFinalizacao).toLocaleString()}`, { align: 'left' });
    doc.moveDown(1);
    doc.text('--------------------------------', { align: 'center' });

    let totalGeral = 0;

    (comanda.pedidos || []).forEach(pedido => {
      doc.moveDown(0.5).text(`Pedido #${pedido.orderNumber}`, { underline: true });
      pedido.itens.forEach(item => {
        const nomeProduto = item.product ? item.product.nome : 'Produto';
        const valorItem = (item.quantidade * (item.product ? item.product.preco : 0));
        doc.text(`${item.quantidade} x ${nomeProduto}`, { align: 'left' });
        doc.text(`R$ ${valorItem.toFixed(2)}`, { align: 'right' });
        totalGeral += valorItem;
      });
      doc.moveDown(0.5);
      doc.text('--------------------------------', { align: 'center' });
    });

    doc.moveDown(0.5);
    doc.text(`Subtotal: R$ ${totalGeral.toFixed(2)}`, { align: 'right' });

    // Aplica taxa de serviço
    const taxa = config.taxaServico || 0;
    let valorTaxa = (totalGeral * (taxa / 100));
    if (taxa > 0) {
      doc.text(`Taxa de Serviço (${taxa}%): R$ ${valorTaxa.toFixed(2)}`, { align: 'right' });
    }

    let totalFinal = totalGeral + valorTaxa;

    // Caso tenha desconto na comanda
    if (comanda.tipoDesconto !== 'nenhum') {
      let descTexto = comanda.tipoDesconto === 'porcentagem' ? `${comanda.valorDesconto}%` : `R$ ${comanda.valorDesconto.toFixed(2)}`;
      doc.text(`Desconto: ${descTexto}`, { align: 'right' });
      // Recalcula total final
      if (comanda.tipoDesconto === 'porcentagem') {
        totalFinal = totalFinal - (totalFinal * (comanda.valorDesconto / 100));
      } else {
        totalFinal = Math.max(totalFinal - comanda.valorDesconto, 0);
      }
    }

    doc.text(`Total Final: R$ ${totalFinal.toFixed(2)}`, { align: 'right', bold: true });

    doc.moveDown(0.5);
    doc.text(`Forma de Pagamento: ${comanda.formaPagamento}`, { align: 'left' });

    doc.moveDown(1);
    doc.text('Obrigado pela preferência!', { align: 'center' });
    doc.moveDown(1);
    doc.text('Volte Sempre!', { align: 'center' });

    if (config.observacoes) {
      doc.moveDown(1);
      doc.fontSize(8).text(config.observacoes, { align: 'center' });
    }

    doc.end();

    writeStream.on('finish', () => {
      resolve(`/comandas/${comanda._id}.pdf`);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
};


// Conteúdo de: .\utils\printUtil.js
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

exports.printOrder = async (order) => {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: process.env.PRINTER_INTERFACE || 'tcp://192.168.0.100', // IP da impressora na cozinha
    options: {
      timeout: 1000
    }
  });

  printer.setTextDoubleHeight();
  printer.println('--- Novo Pedido ---');
  printer.setTextNormal();
  printer.println(`Pedido ID: ${order.orderNumber}`);
  printer.println(`Data: ${new Date(order.createdAt).toLocaleString()}`);

  printer.println('Itens:');
  order.itens.forEach((item) => {
    const nomeProduto = item.product ? item.product.nome : 'Produto Desconhecido';
    printer.println(`${item.quantidade}x ${nomeProduto}`);
  });

  printer.println(`Total: R$ ${order.total.toFixed(2)}`);
  printer.cut();

  try {
    await printer.execute();
    console.log('Pedido enviado para impressão');
  } catch (error) {
    console.error('Erro ao imprimir pedido:', error);
  }
};


