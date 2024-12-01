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
