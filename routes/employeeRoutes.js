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
