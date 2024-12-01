// models/Employee.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const employeeSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  funcao: { type: String, required: true, enum: ['Garçom', 'Cozinheiro', 'Gerente'] },
  email: { type: String, unique: true, required: true },
  senha: { type: String, required: true },
  permissoes: [String],
}, { timestamps: true });

// Cria índice único para o campo 'email'
employeeSchema.index({ email: 1 }, { unique: true });

// Hash da senha antes de salvar
employeeSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Método para comparar senha
employeeSchema.methods.comparePassword = async function (senha) {
  return await bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.model('Employee', employeeSchema);
