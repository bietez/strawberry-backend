// src/models/IfoodAuthState.js

const mongoose = require('mongoose');

const IfoodAuthStateSchema = new mongoose.Schema({
  ifoodUserCode: {
    type: String,
    required: true,
  },
  ifoodAuthorizationCodeVerifier: {
    type: String,
    required: true,
  },
  verificationUrlComplete: {
    type: String,
    required: true,
  },
  // Se houver multiusuário, adicione referências de usuário aqui
  // userId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true,
  // },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Opcional: Expira após 10 minutos
  },
});

module.exports = mongoose.model('IfoodAuthState', IfoodAuthStateSchema);
