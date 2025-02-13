// models/QueueEntry.js
const mongoose = require('mongoose');

const QueueEntrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  numberOfPeople: {
    type: Number,
    required: true,
    min: 1,
  },
  contact: {
    type: String,
    default: ''
  },
  telefone: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Aguardando', 'Finalizado'],
    default: 'Aguardando',
  },
  assignedTable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  assignedAt: {
    type: Date,
    default: null,
  },
  timeToAssign: {
    type: Number,
    default: 0,
  },
 
}, { versionKey: false });

module.exports = mongoose.model('QueueEntry', QueueEntrySchema);
