// middlewares/errorMiddleware.js
function errorMiddleware(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ message: 'Algo deu errado!', error: err.message });
  }
  
  module.exports = errorMiddleware;
  