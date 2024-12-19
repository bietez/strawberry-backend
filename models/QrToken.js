// models/QrToken.js
const mongoose = require('mongoose');

const QrTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
});

QrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // token expira após a data
module.exports = mongoose.model('QrToken', QrTokenSchema);
