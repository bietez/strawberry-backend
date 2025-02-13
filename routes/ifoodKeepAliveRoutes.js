// routes/ifoodKeepAliveRoutes.js

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { keepStoreAlive } = require('../scripts/ifoodKeepAliveService');

// Merchant ID fixo ou do .env
const MERCHANT_ID = process.env.IFOOD_MERCHANT_ID || '0ef6eb75-8fce-4622-943f-96364eb74b88';

router.get(
  '/ifood/keepAlive',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  async (req, res) => {
    try {
      await keepStoreAlive(MERCHANT_ID);
      return res.json({ message: 'Ok, keepAlive chamado. Loja aberta e polling iniciado!' });
    } catch (error) {
      console.error('Erro em /ifood/keepAlive:', error.message);
      return res.status(500).json({ message: 'Erro ao manter a loja online.', details: error.message });
    }
  }
);

module.exports = router;
