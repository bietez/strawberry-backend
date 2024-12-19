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
