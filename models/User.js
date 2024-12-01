// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'manager', 'agent', 'feeder'],
    default: 'agent',
  },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Novo campo
  permissions: { type: [String], default: [] }, // Lista de permissões
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date },
});

// Hash da senha antes de salvar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

// Método para comparar senhas
UserSchema.methods.comparePassword = function (senha) {
  return bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.model('User', UserSchema);
