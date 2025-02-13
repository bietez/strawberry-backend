// backend/models/Categoria.js
const mongoose = require('mongoose');

const CategoriaSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    tipo: {
      type: String,
      enum: ['Receita', 'Despesa'],
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria',
      default: null,
    },
  },
  { timestamps: true }
);

// Índice composto para evitar duplicidade no par (nome, tipo, parent)
CategoriaSchema.index(
  { nome: 1, tipo: 1, parent: 1 },
  { unique: true, collation: { locale: 'pt', strength: 2 } }
);

module.exports = mongoose.model('Categoria', CategoriaSchema);
