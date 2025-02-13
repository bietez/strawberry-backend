const express = require('express');
const router = express.Router();
const dreController = require('../controllers/dreController');
const authMiddleware = require('../middlewares/authMiddleware');

// POST: /dre/comparativo => recebe array de períodos
router.post('/comparativo', authMiddleware, dreController.comparativoDRE);

module.exports = router;
