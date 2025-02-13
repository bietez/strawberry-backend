const express = require('express');
const router = express.Router();
const ambienteController = require('../controllers/ambienteController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para ambientes
router.post('/', authMiddleware, ambienteController.createAmbiente);
router.get('/', authMiddleware, ambienteController.getAmbientes);
router.put('/:id', authMiddleware, ambienteController.updateAmbiente);
router.delete('/:id', authMiddleware, ambienteController.deleteAmbiente);
router.put('/order', authMiddleware, ambienteController.updateAmbienteOrder);


module.exports = router;    
