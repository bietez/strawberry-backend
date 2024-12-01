// models/IfoodToken.js
const mongoose = require('mongoose');

const IfoodTokenSchema = new mongoose.Schema({
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresIn: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('IfoodToken', IfoodTokenSchema);
