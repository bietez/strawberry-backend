// middlewares/logMiddleware.js

module.exports = (req, res, next) => {
  const startTime = Date.now();

  // Clona a função original de envio de resposta
  const originalSend = res.send;

  // Cria um "gancho" na função send para capturar o que é enviado na resposta
  res.send = function (body) {
    // Tempo total da requisição
    const totalTime = Date.now() - startTime;

    // Logar detalhes da resposta
    console.log('========== Resposta ===========');
    console.log('Status:', res.statusCode);
    console.log('Resposta (body):', body);
    console.log('Tempo:', totalTime + 'ms');
    console.log('===============================');

    // Retorna a resposta original
    return originalSend.call(this, body);
  };

  // Logar detalhes da requisição
  console.log('========== Requisição =========');
  console.log('Método:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('Body da Requisição:', req.body);
  console.log('===============================');

  // Continua para o próximo middleware ou para o controlador
  next();
};
