const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

// Se tiver middlewares de autenticação, inclua aqui
// const authMiddleware = require('../middlewares/authMiddleware');

// Cria nova entrada
router.post('/', queueController.createQueueEntry);

// Lista todas as entradas
router.get('/', queueController.getAllQueueEntries);

// Atualiza dados de uma entrada
router.put('/:id', queueController.updateQueueEntry);

// Finaliza entrada (libera mesa)
router.put('/:id/finish', queueController.finishQueueEntry);

// Exclui entrada (libera mesa e remove do banco)
router.delete('/:id', queueController.deleteQueueEntry);

module.exports = router;
