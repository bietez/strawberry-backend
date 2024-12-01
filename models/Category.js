// models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  categoria: { type: String, required: true, unique: true },
  descricao: { type: String },
  habilitado: { type: Boolean, default: true },
});

module.exports = mongoose.model('Category', CategorySchema);
