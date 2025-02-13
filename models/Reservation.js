const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: false },
  mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  dataReserva: { type: Date, required: true },
  numeroPessoas: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['ativa', 'concluida', 'cancelada'], default: 'ativa' },
  nomeCliente: { type: String, required: true },
  telefoneCliente: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', ReservationSchema);
