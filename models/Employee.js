const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const EmployeeSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  funcao: { type: String, required: true, enum: ['Garçom', 'Cozinheiro', 'Gerente'] },
  email: { type: String, unique: true, required: true, match: /.+\@.+\..+/ },
  senha: { type: String, required: true },
  permissoes: { type: [String], default: [] },
}, { timestamps: true });

// Cria índice único para o campo 'email'
EmployeeSchema.index({ email: 1 }, { unique: true });

// Hash da senha antes de salvar
EmployeeSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Método para comparar senha
EmployeeSchema.methods.comparePassword = async function (senha) {
  return await bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.model('Employee', EmployeeSchema);
