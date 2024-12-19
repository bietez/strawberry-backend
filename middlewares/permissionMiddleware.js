function permissionMiddleware(requiredPermissions) {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const userRole = req.user.role;

    // Admin tem todas as permissões
    if (userRole === 'admin' || userPermissions.includes('*')) {
      return next();
    }

    // Verificar se o usuário possui todas as permissões necessárias
    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (hasPermission) {
      return next();
    } else {
      return res.status(403).json({
        message: 'Acesso proibido. Você não tem permissão para este recurso.',
      });
    }
  };
}

module.exports = permissionMiddleware;
