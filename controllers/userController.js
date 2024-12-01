// controllers/userController.js
const User = require('../models/User');

exports.getTeamMembers = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    let teamMembers;
    if (req.user.role === 'admin') {
      // Admin pode ver todos os agentes e gerentes
      teamMembers = await User.find({ role: { $in: ['agent', 'manager'] } }).populate('manager');
    } else {
      // Manager vê apenas seus agentes
      teamMembers = await User.find({ manager: req.user.id }).populate('manager');
    }

    res.json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter membros da equipe', error: error.message });
  }
};
