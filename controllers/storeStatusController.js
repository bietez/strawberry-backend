// controllers/storeStatusController.js

const StoreStatus = require('../models/StoreStatus');

/**
 * Atualizar o status da loja (Online/Offline)
 */
exports.updateStoreStatus = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { isOnline } = req.body;

    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ message: 'O campo isOnline deve ser booleano.' });
    }

    // Atualizar ou criar o documento de status
    const storeStatus = await StoreStatus.findOneAndUpdate(
      { merchantId },
      { isOnline, updatedAt: Date.now() },
      { new: true, upsert: true }
    );

    return res.json({ message: 'Status da loja atualizado com sucesso.', storeStatus });
  } catch (error) {
    console.error('Erro ao atualizar o status da loja:', error.message);
    return res.status(500).json({ message: 'Erro ao atualizar o status da loja.', details: error.message });
  }
};

/**
 * Obter o status atual da loja
 */
exports.getStoreStatus = async (req, res) => {
  try {
    const { merchantId } = req.params;

    const storeStatus = await StoreStatus.findOne({ merchantId });

    if (!storeStatus) {
      return res.status(404).json({ message: 'Status da loja não encontrado.' });
    }

    return res.json({ storeStatus });
  } catch (error) {
    console.error('Erro ao obter o status da loja:', error.message);
    return res.status(500).json({ message: 'Erro ao obter o status da loja.', details: error.message });
  }
};
