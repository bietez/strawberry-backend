// routes/lancamentos.js
const express = require('express');
const router = express.Router();
const lancamentoController = require('../controllers/lancamentoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/check-duplicate', authMiddleware, lancamentoController.checkDuplicate);
// GET: Listar lançamentos
router.get('/', authMiddleware, lancamentoController.listarLancamentos);

// GET: Obter 1 lançamento
router.get('/:id', authMiddleware, lancamentoController.obterLancamento);

// POST: Criar um lançamento
router.post('/', authMiddleware, lancamentoController.criarLancamento);

// PUT: Atualizar
router.put('/:id', authMiddleware, lancamentoController.atualizarLancamento);

// DELETE: Excluir
router.delete('/:id', authMiddleware, lancamentoController.excluirLancamento);

// GET: Resumo
router.get('/summary/resumo', authMiddleware, lancamentoController.resumoLancamentos);

module.exports = router;
