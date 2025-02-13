// cash-register-backend/routes/configRoutes.js
const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para armazenar a imagem do logotipo em 'public/images'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

router.get('/', authMiddleware, configController.getConfig);
router.post('/', authMiddleware, upload.single('logotipo'), configController.createConfig);
router.put('/', authMiddleware, upload.single('logotipo'), configController.updateConfig);

// GET /settings/draggable: retorna { draggable: true/false }
router.get(
  '/draggable',
  authMiddleware,
  configController.getDraggable
);

// PUT /settings/draggable: atualiza { draggable: true/false }
router.put(
  '/draggable',
  authMiddleware,
  configController.updateDraggable
);

router.get('/cnpj/:cnpj', configController.fetchCnpj);



module.exports = router;
