function roleMiddleware(requiredRoles) {
  return (req, res, next) => {
    // Obtém o usuário já definido pelo authMiddleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    // Define a role do usuário (suporta 'role' ou 'funcao')
    const userRole = user.role || user.funcao;

    // Se o usuário for admin, acesso total
    if (userRole === 'admin') {
      return next();
    }

    // Verifica se a role do usuário está nas roles requeridas
    if (requiredRoles.includes(userRole)) {
      return next();
    }

    // Verifica se o usuário possui alguma permissão requerida
    if (user.permissions && requiredRoles.some(permission => user.permissions.includes(permission))) {
      return next();
    }

    return res.status(403).json({ message: 'Acesso proibido. Você não tem permissão para este recurso.' });
  };
}

module.exports = roleMiddleware;
