const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, unique: true }, // Campo auto-incrementado
    mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    assento: { type: String },
    itens: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantidade: { type: Number, required: true, min: 1 },
        tipo: { type: String, enum: ['prato principal', 'entrada', 'sobremesa'], required: true, default: 'prato principal' },
        comentarios: { type: String }, // Novo campo para comentários específicos do item
      },
    ],
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // Corrigido para 'ObjectId'
    garcom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Opcional
    total: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['Pendente', 'Preparando', 'Pronto', 'Entregue', 'Finalizado'], // Adicionado 'Finalizado'
      default: 'Pendente' 
    },
    tipoPedido: { 
      type: String, 
      enum: ['local', 'entrega'], 
      required: true 
    },
    enderecoEntrega: { type: String }, // Se tipoPedido for 'entrega'
    preparar: { type: Boolean, default: true }, // Novo campo 'preparar' por pedido
  },
  { timestamps: true }
);

OrderSchema.plugin(AutoIncrement, { inc_field: 'orderNumber' });

module.exports = mongoose.model('Order', OrderSchema);
