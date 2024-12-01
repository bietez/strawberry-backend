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
