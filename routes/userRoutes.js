// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/check-nome/:nome', userController.checkNomeDuplicado);

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
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  userController.updateUser
);

router.post(
  '/',
  authMiddleware, // ou outro middleware se necessário
  roleMiddleware(['admin']), // defina quem pode criar usuários
  userController.createUser
);

// Obter dados do usuário logado
router.get('/me', authMiddleware, userController.getMe);

// Outras rotas conforme necessário

module.exports = router;
