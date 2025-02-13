// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
  senha: { type: String, required: true },
  role: {
    type: String,
    enum: [
      'admin',
      'manager',
      'agent',
      'feeder',
      'chef',
      'waiter',
      'receptionist',
      'deliveryMan',
      'kitchenAssistant',
      'barman',
      'cleaning'
    ],
    default: 'agent',
  },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Novo campo
  permissions: { type: [String], default: [] },
  resetPasswordOTP: { type: String },
  telefone: { type: String },
  resetPasswordExpires: { type: Date },

  vacancy: { type: String, default: '' },
  // Ajuste no enum conforme discutido (CLT-Definitivo ou Free Lancer)
  contractType: {
    type: String,
    enum: ['CLT-Definitivo', 'Free Lancer'],
    default: 'CLT-Definitivo'
  },
  imagem: { type: String, default: 'https://placehold.co/150' },
  refreshTokens: { type: [String], default: [] },

  // Campo para data de contratação
  hiredSince: { type: String, default: '' },
}, { timestamps: true });

// Hash da senha antes de salvar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
UserSchema.methods.comparePassword = async function (senha) {
  return await bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.model('User', UserSchema);
