// backend/routes/nfeRoutes.js

const express = require('express');
const router = express.Router();
const notaFiscalController = require('../controllers/notaFiscalController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de arquivos NF-e
const storageNfe = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public', 'nfe'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now();
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        cb(null, `${base}-${uniqueSuffix}${ext}`);
    }
});
const uploadNfe = multer({ storage: storageNfe });

// Configuração do Multer para upload de Certificados
const storageCert = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public', 'certificates'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now();
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        cb(null, `${base}-${uniqueSuffix}${ext}`);
    }
});
const uploadCert = multer({
    storage: storageCert,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pfx', '.pem'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos .pfx e .pem são permitidos.'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB
});

// Rotas existentes...
router.post('/upload', authMiddleware, uploadNfe.single('nfFile'), notaFiscalController.uploadNotaFiscal);
router.post('/emitir', authMiddleware, notaFiscalController.gerarNotaFiscal);
router.get('/', authMiddleware, notaFiscalController.listarNotasFiscais);
router.delete('/:id', authMiddleware, notaFiscalController.excluirNotaFiscal);
router.put('/:id', authMiddleware, notaFiscalController.atualizarNotaFiscal);
router.get('/status/:id', authMiddleware, notaFiscalController.consultarStatusNF);

// **Nova Rota para Upload de Certificado**
router.post('/upload-certificate', authMiddleware, uploadCert.single('certificate'), notaFiscalController.uploadCertificate);

module.exports = router;
