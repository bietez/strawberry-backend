// middlewares/errorMiddleware.js
function errorMiddleware(err, req, res, next) {
  console.error('--- ERROR MIDDLEWARE START ---');
  console.error('Method:', req.method);
  console.error('URL:', req.originalUrl);
  console.error('Headers:', JSON.stringify(req.headers, null, 2));
  console.error('Params:', JSON.stringify(req.params, null, 2));
  console.error('Query:', JSON.stringify(req.query, null, 2));
  console.error('Body:', JSON.stringify(req.body, null, 2));
  console.error('Error Stack:', err.stack);
  console.error('--- ERROR MIDDLEWARE END ---');

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Algo deu errado!';

  res.status(statusCode).json({ message, error: err.message });
}

module.exports = errorMiddleware;
