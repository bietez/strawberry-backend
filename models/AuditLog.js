const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String }, // Para facilitar consultas
  action: { type: String, required: true },
  details: { type: Object }, // Pode armazenar detalhes adicionais sobre a ação
  timestamp: { type: Date, default: Date.now }, // Removido 'index: true'
});

// Criar índice TTL no campo 'timestamp' para expirar documentos após 60 dias
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 }); // 60 dias em segundos

module.exports = mongoose.model('AuditLog', AuditLogSchema);
