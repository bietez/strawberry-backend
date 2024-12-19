const express = require('express');
const router = express.Router();
const ambienteController = require('../controllers/ambienteController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para ambientes
router.post('/', authMiddleware, roleMiddleware(['manager']), ambienteController.createAmbiente);
router.get('/', authMiddleware, roleMiddleware(['manager', 'agent']), ambienteController.getAmbientes);
router.put('/:id', authMiddleware, roleMiddleware(['manager']), ambienteController.updateAmbiente);
router.delete('/:id', authMiddleware, roleMiddleware(['manager']), ambienteController.deleteAmbiente);

module.exports = router;
