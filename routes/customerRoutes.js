// routes/customerRoutes.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

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
router.get('/advanced', authMiddleware, getCustomersAdvanced);

// Rota para criação de cliente
router.post('/', authMiddleware, createCustomer);

// Rota para obter todos os clientes (sem paginação)
router.get('/', authMiddleware, getCustomers);

// Rotas com parâmetros dinâmicos devem vir por último
router.get('/:id', authMiddleware, getCustomerById);
router.put('/:id', authMiddleware, updateCustomer);
router.delete('/:id', authMiddleware, deleteCustomer);

module.exports = router;
