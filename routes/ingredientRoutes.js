// server/routes/ingredientRoutes.js
const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para armazenar as imagens em 'public/images'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'images')); // Caminho para 'public/images'
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Nome único para o arquivo
  },
});

// Filtro para aceitar apenas tipos de imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Apenas imagens JPEG, JPG, PNG e GIF são permitidas'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

// Rotas para ingredientes
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['manager']),
  upload.single('imagem'), // Middleware de upload para campo 'imagem'
  ingredientController.createIngredient
);

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['manager', 'agent']),
  ingredientController.getIngredients
);

router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['manager', 'agent']),
  ingredientController.getIngredientById
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['manager']),
  upload.single('imagem'), // Middleware de upload para campo 'imagem'
  ingredientController.updateIngredient
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['manager']),
  ingredientController.deleteIngredient
);

module.exports = router;
