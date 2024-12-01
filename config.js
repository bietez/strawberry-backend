// config.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  paymentApiKey: process.env.PAYMENT_API_KEY,
  deliveryPlatformApiKey: process.env.DELIVERY_PLATFORM_API_KEY,
};
