// models/IfoodToken.js

const mongoose = require('mongoose');

const IfoodTokenSchema = new mongoose.Schema({
  ifoodAccessToken: {
    type: String,
    required: true,
  },
  ifoodRefreshToken: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 21600 * 1000), // 6 horas padrão
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

IfoodTokenSchema.methods.isExpired = function () {
  return Date.now() >= this.expiresAt.getTime();
};

const IfoodToken = mongoose.model('IfoodToken', IfoodTokenSchema);

module.exports = IfoodToken;
