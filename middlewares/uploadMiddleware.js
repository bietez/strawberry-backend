// middlewares/uploadMiddleware.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define o diretório de destino para uploads temporários
const uploadDir = path.join(__dirname, '..', 'uploads', 'certificates');

// Cria o diretório se não existir
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do armazenamento do multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Nome único para evitar conflitos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro para aceitar apenas arquivos .pem (certificado) e .key (chave privada)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /pem|key/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    if (extName && mimeType) {
        return cb(null, true);
    } else {
        cb(new Error('Apenas arquivos .pem e .key são permitidos!'));
    }
};

// Inicializa o multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
    fileFilter: fileFilter
});

module.exports = upload;
