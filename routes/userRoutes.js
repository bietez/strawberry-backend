const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Obter membros da equipe
router.get(
  '/team-members',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  userController.getTeamMembers
);

// Atualizar usuário (PUT)
router.put(
  '/:id',
  authMiddleware, roleMiddleware(['admin', 'manager']), userController.updateUser
  // Aqui não limitamos a role diretamente, pois a lógica está no controller.
  // Mas se quiser, pode permitir apenas admin e manager:
  // roleMiddleware(['admin', 'manager'])
);

router.get('/me', authMiddleware, userController.getMe);


router.get(
  '/employees/list',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  async (req, res) => {
    try {
      const employees = await User.find({ role: { $in: ['manager', 'agent'] } }).select('nome email');
      res.json(employees);
    } catch (error) {
      console.error('Erro ao obter funcionários:', error);
      res.status(500).json({ message: 'Erro ao obter funcionários', error: error.message });
    }
  }
);

module.exports = router;
