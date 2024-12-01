// models/Product.js
const mongoose = require('mongoose');
const removeDiacritics = require('diacritics').remove;

const ProductSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  nomeNormalizado: { type: String, required: true, unique: true },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  preco: { type: Number, required: true },
  descricao: { type: String },
  disponivel: { type: Boolean, default: true },
  quantidadeEstoque: { type: Number, default: 0 },
});

// Middleware para definir nomeNormalizado antes de salvar
ProductSchema.pre('validate', function (next) {
  this.nomeNormalizado = removeDiacritics(this.nome).toLowerCase();
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
