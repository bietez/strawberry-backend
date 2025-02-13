// server.js

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { json, urlencoded } = express;
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar Config
const config = require('./config');

// Importar Middlewares
const errorMiddleware = require('./middlewares/errorMiddleware');
const authMiddleware = require('./middlewares/authMiddleware'); // Import authMiddleware

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
const queueRoutes = require('./routes/queueRoutes');
const lancamentosRoutes = require('./routes/lancamentosRoutes');
const categoriaRoutes = require('./routes/categoriasRoutes');
const dreRoutes = require('./routes/dreRoutes');
const nfeRoutes = require('./routes/nfeRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const emailRoutes = require('./routes/emailRoutes');
const ifoodKeepAliveRoutes = require('./routes/ifoodKeepAliveRoutes');
const IfoodCatalogRoutes = require('./routes/ifoodCatalogRoutes');

// Importar Serviço de Keep Alive

// Inicialização do App
const app = express();

// Middleware de CORS
app.use(
  cors({
    origin: 'http://localhost:3000', // ou seu(s) endereço(s) do frontend
    credentials: true,               // Permite envio de cookies
  })
);

// Limiter
const limiter = rateLimit({
  windowMs: 60 * 1 * 1000, // 1 min
  max: 30,
  message: {
    message: 'Muitas requisições deste IP. Tente novamente em alguns minutos.',
  },
  skip: (req, res) => {
    const token = req.headers['authorization'];
    return !!token; // se tiver token, pular rate-limit
  },
});
app.use(limiter);

// Configurações Básicas do Express
app.use(json());
app.use(urlencoded({ extended: true }));

// Conexão com o MongoDB
mongoose
  .connect(config.mongoURI)
  .then(async () => {
    console.log('Conectado ao MongoDB');
  })
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Configurando a Sessão com connect-mongo
const sessionStore = MongoStore.create({
  mongoUrl: config.mongoURI,
  collectionName: 'sessions',
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback_session_secret',
    resave: true,             // Mude para true
    saveUninitialized: true,  // Mude para true
    store: sessionStore,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 dia
      secure: false,              // Em produção (HTTPS), seria true
      sameSite: 'none',           // Necessário para permitir cookies cross-site
    },
  })
);

// Servir Arquivos Estáticos
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads/ingredients', express.static(path.join(__dirname, 'uploads/ingredients')));
app.use('/comandas', express.static(path.join(__dirname, 'public/comandas')));
app.use('/conferences', express.static(path.join(__dirname, 'public', 'conferences')));
app.use('/sales-goal', express.static(path.join(__dirname, 'public', 'sales-goal')));
app.use('/nfe', express.static(path.join(__dirname, 'public', 'nfe')));
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------------
// Configure o authMiddleware para ser aplicado a todas as rotas,
// exceto as que começam com "/api/ifood/"
app.use(
  authMiddleware.unless({ path: [/^\/api\/ifood\//, /^\/api\/auth\//] })
);

// -----------------------------------------------------------------

// Definição das Rotas
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
app.use('/api/ifood', ifoodRoutes); // As rotas do iFood já estão isoladas e protegidas
app.use('/api/categories', categoryRoutes);
app.use('/api/sales-goals', salesGoalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/server-time', timeRoutes);
app.use('/api/finalized-tables', finalizedTableRoutes);
app.use('/api/comandas', comandasRouter);
app.use('/api/qr', qrRoutes);
app.use('/api/config', configRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/lancamentos', lancamentosRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/dre', dreRoutes);
app.use('/api/nfe', nfeRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/send-invoice-email', emailRoutes);
app.use('/api/ifood', ifoodKeepAliveRoutes);
app.use('/api/ifood', IfoodCatalogRoutes);

// Rota Adicional de Teste
app.get('/server-time', (req, res) => {
  res.json({ serverTime: new Date() });
});

// Middleware Final para Tratamento de Erros
app.use(errorMiddleware);

// Exportar o App
module.exports = app;
