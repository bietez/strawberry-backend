// controllers/timeController.js
exports.getServerTime = (req, res) => {
    try {
      const serverTime = new Date();
      res.json({ serverTime });
    } catch (error) {
      console.error('Erro ao obter hora do servidor:', error);
      res.status(500).json({ message: 'Erro ao obter hora do servidor', error: error.message });
    }
  };
  