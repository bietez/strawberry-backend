function roleMiddleware(requiredRoles) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const userRole = user.role || user.funcao; // Suporta 'role' ou 'funcao'

    // Admin tem acesso total
    if (userRole === 'admin') {
      return next();
    }

    if (requiredRoles.includes(userRole)) {
      return next(); // O usuário tem uma das roles requeridas
    }

    // Verificar se o usuário possui as permissões necessárias
    if (user.permissions && requiredRoles.some(permission => user.permissions.includes(permission))) {
      return next(); // O usuário tem a permissão necessária
    }

    return res.status(403).json({ message: 'Acesso proibido. Você não tem permissão para este recurso.' });
  };
}

module.exports = roleMiddleware;
