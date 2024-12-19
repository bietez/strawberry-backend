// routes/uploadRoute.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/authMiddleware'); // Ajuste conforme necessário

// Configuração do multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images'); // Diretório para salvar as imagens
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// Rota de Upload
router.post('/', authMiddleware, upload.single('imagem'), (req, res, next) => {
  if (!req.file) {
    const error = new Error('Nenhum arquivo enviado.');
    error.statusCode = 400;
    return next(error);
  }

  // Construir a URL da imagem
  const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

module.exports = router;
