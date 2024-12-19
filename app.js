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
