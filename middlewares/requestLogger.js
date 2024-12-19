// middlewares/requestLogger.js
const fs = require('fs');
const path = require('path');

const requestLogger = (req, res, next) => {
  const logDirectory = path.join(__dirname, '../logs');

  // Certifica-se de que a pasta de logs existe
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
  }

  const logFile = path.join(logDirectory, 'requests.log');
  const timestamp = new Date().toISOString();
  const logEntry = `
  [${timestamp}] ${req.method} ${req.originalUrl}
  Headers: ${JSON.stringify(req.headers, null, 2)}
  Params: ${JSON.stringify(req.params, null, 2)}
  Query: ${JSON.stringify(req.query, null, 2)}
  Body: ${JSON.stringify(req.body, null, 2)}
  ------------------------------
  `;

  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Erro ao gravar log de requisição:', err);
    }
  });

  // Também exibe no console
  console.log(logEntry);

  next();
};

module.exports = requestLogger;
