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
