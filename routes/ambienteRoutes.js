// Conteúdo de: .\routes\ambienteRoutes.js
// routes/ambienteRoutes.js
const express = require('express');
const router = express.Router();
const ambienteController = require('../controllers/ambienteController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para ambientes
router.post('/', authMiddleware, roleMiddleware(['Gerente']), ambienteController.createAmbiente);
router.get('/', authMiddleware, roleMiddleware(['Gerente', 'Garçom']), ambienteController.getAmbientes);
router.put('/:id', authMiddleware, roleMiddleware(['Gerente']), ambienteController.updateAmbiente);
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente']), ambienteController.deleteAmbiente);

module.exports = router;
