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
