// routes/timeRoutes.js
const express = require('express');
const router = express.Router();
const timeController = require('../controllers/timeController');
const authMiddleware = require('../middlewares/authMiddleware'); // Se necessário

router.get('/', authMiddleware, timeController.getServerTime);

module.exports = router;
