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
