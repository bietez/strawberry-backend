// middlewares/auditMiddleware.js
const AuditLog = require('../models/AuditLog');

function auditMiddleware(action) {
  return async (req, res, next) => {
    const user = req.user || {};
    const userId = user.id || 'Anônimo';
    const userEmail = user.email || 'Desconhecido';

    // Capturar detalhes relevantes
    const details = {
      method: req.method,
      path: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
    };

    // Criar registro de auditoria
    try {
      await AuditLog.create({
        userId: userId,
        userEmail: userEmail,
        action: action,
        details: details,
      });
    } catch (error) {
      console.error('Erro ao salvar registro de auditoria:', error);
    }

    next();
  };
}

module.exports = auditMiddleware;
