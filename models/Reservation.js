// Conteúdo de: .\models\Reservation.js
// models/Reservation.js
const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  dataReserva: { type: Date, required: true },
  numeroPessoas: { type: Number, required: true },
  status: { type: String, enum: ['ativa', 'concluida', 'cancelada'], default: 'ativa' },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', ReservationSchema);
