// Conteúdo de: .\ambienteRoutes.js
const express = require('express');
const router = express.Router();
const ambienteController = require('../controllers/ambienteController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para ambientes
router.post('/', authMiddleware, ambienteController.createAmbiente);
router.get('/', authMiddleware, ambienteController.getAmbientes);
router.put('/:id', authMiddleware, ambienteController.updateAmbiente);
router.delete('/:id', authMiddleware, ambienteController.deleteAmbiente);
router.put('/order', authMiddleware, ambienteController.updateAmbienteOrder);


module.exports = router;    


// Conteúdo de: .\authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas de autenticação
router.post('/register', authMiddleware, roleMiddleware(['admin', 'manager']), authController.register);
router.post('/login', authController.login);

// Rotas para recuperação de senha
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPasswordWithOTP);


// Rota para atualizar usuário
router.put('/users/:id', authMiddleware, roleMiddleware(['admin', 'manager']), authController.updateUser);
module.exports = router;


// Conteúdo de: .\caixaRoutes.js
// routes/caixaRoutes.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();
const caixaController = require('../controllers/caixaController');

router.get('/history', authMiddleware, caixaController.getCaixaHistory);

// Rota para iniciar o caixa
router.post('/iniciar', authMiddleware, caixaController.iniciarCaixa);

// Rota para finalizar o caixa
router.post('/finalizar', authMiddleware, caixaController.finalizarCaixa);

// Rota para obter o status do caixa
router.get('/status', authMiddleware, caixaController.getCaixaStatus);

module.exports = router;


// Conteúdo de: .\categoriasRoutes.js
// backend/routes/categoriaRoutes.js
const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/arvore', authMiddleware, categoriaController.listarCategoriasArvore);

// Listar categorias
router.get('/', authMiddleware, categoriaController.listarCategorias);

// Criar categoria
router.post('/', authMiddleware, categoriaController.criarCategoria);

// Atualizar categoria
router.put('/:id', authMiddleware, categoriaController.atualizarCategoria);

// Excluir categoria
router.delete('/:id', authMiddleware, categoriaController.excluirCategoria);

module.exports = router;


// Conteúdo de: .\categoryRoutes.js
// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');


router.get('/', authMiddleware, categoryController.getAllCategories);


// Criar categoria
router.post(
  '/',
  authMiddleware,
  categoryController.createCategory
);

// Buscar categorias avançadas com paginação, pesquisa e ordenação
router.get(
  '/advanced',
  authMiddleware,
  categoryController.getCategories
);

// Obter categoria por ID
router.get(
  '/:categoryId',
  authMiddleware,
  categoryController.getCategoryById
);

// Atualizar categoria
router.put(
  '/:categoryId',
  authMiddleware,
  categoryController.updateCategory
);

// Deletar categoria
router.delete(
  '/:categoryId',
  authMiddleware,
  categoryController.deleteCategory
);

module.exports = router;


// Conteúdo de: .\comandaRoutes.js
// cash-register-backend/routes/comandaRoutes.js

const express = require('express');
const router = express.Router();
const comandaController = require('../controllers/comandaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const Table = require('../models/Table'); // <--- IMPORTANTE

// Enviar email
router.post(
  '/send-email',
  authMiddleware,
  comandaController.sendComandaEmail
);
// Listar comandas
router.get(
  '/',
  authMiddleware,
  comandaController.getComandas
);

// Baixar PDF
router.get(
  '/:id/pdf',
  authMiddleware,
  comandaController.downloadComandaPDF
);



// Nova rota para PDF de Conferência (antes de finalizar a mesa)
router.get(
  '/:tableId/conferencia',
  authMiddleware,
  comandaController.generateConferencePDF
);

// Adicionar pagamento parcial
router.put(
  '/:comandaId/payments',
  authMiddleware,
  comandaController.addPayment
);

router.get(
  '/:comandaId/invoice',
  authMiddleware,
  comandaController.generateInvoicePDF
);

module.exports = router;


// Conteúdo de: .\configRoutes.js
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

router.get('/', authMiddleware, roleMiddleware(['admin']), configController.getConfig);
router.post('/', authMiddleware, roleMiddleware(['admin']), upload.single('logotipo'), configController.createConfig);
router.put('/', authMiddleware, roleMiddleware(['admin']), upload.single('logotipo'), configController.updateConfig);

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


module.exports = router;


// Conteúdo de: .\customerRoutes.js
// routes/customerRoutes.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomersAdvanced, // Importando o novo método
} = require('../controllers/customerController');


// **Nova Rota para busca avançada - Deve vir antes das rotas com parâmetros dinâmicos**
router.get('/advanced', authMiddleware, getCustomersAdvanced);

// Rota para criação de cliente
router.post('/', authMiddleware, createCustomer);

// Rota para obter todos os clientes (sem paginação)
router.get('/', authMiddleware, getCustomers);

// Rotas com parâmetros dinâmicos devem vir por último
router.get('/:id', authMiddleware, getCustomerById);
router.put('/:id', authMiddleware, updateCustomer);
router.delete('/:id', authMiddleware, deleteCustomer);

module.exports = router;


// Conteúdo de: .\dreRoutes.js
const express = require('express');
const router = express.Router();
const dreController = require('../controllers/dreController');
const authMiddleware = require('../middlewares/authMiddleware');

// POST: /dre/comparativo => recebe array de períodos
router.post('/comparativo', authMiddleware, dreController.comparativoDRE);

module.exports = router;


// Conteúdo de: .\emailRoutes.js
// src/routes/emailRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const { sendEmail } = require('../utils/emailUtil');

// Middleware para autenticação, se necessário
// const authenticate = require('../middlewares/authenticate');

router.post('/send-invoice-email', /* authenticate, */ async (req, res) => {
  const { email, pdfPath } = req.body;

  if (!email || !pdfPath) {
    return res.status(400).json({ message: 'Email e pdfPath são obrigatórios.' });
  }

  try {
    const fullPdfPath = path.join(__dirname, '..', 'public', pdfPath); // Ajuste o caminho conforme necessário

    // Verifique se o arquivo existe
    const fs = require('fs');
    if (!fs.existsSync(fullPdfPath)) {
      return res.status(404).json({ message: 'Arquivo PDF não encontrado.' });
    }

    // Enviar email
    await sendEmail(
      email,
      'Finalização da Mesa',
      'Segue em anexo a finalização da sua mesa.',
      `<p>Olá,</p><p>Segue em anexo a finalização da sua mesa.</p>`,
      [
        {
          filename: path.basename(fullPdfPath),
          path: fullPdfPath,
          contentType: 'application/pdf',
        },
      ]
    );

    res.status(200).json({ message: 'Email enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({ message: 'Erro ao enviar email.' });
  }
});

module.exports = router;


// Conteúdo de: .\employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para funcionários
router.post('/', authMiddleware, roleMiddleware(['manager']), employeeController.createEmployee);
router.get('/', authMiddleware, roleMiddleware(['manager']), employeeController.getEmployees);
router.get('/:id', authMiddleware, roleMiddleware(['manager']), employeeController.getEmployeeById);
router.put('/:id', authMiddleware, roleMiddleware(['manager']), employeeController.updateEmployee);
router.delete('/:id', authMiddleware, roleMiddleware(['manager']), employeeController.deleteEmployee);

// Rota pública para login
router.post('/login', employeeController.loginEmployee);

module.exports = router;


// Conteúdo de: .\finalizedTableRoutes.js
// routes/finalizedTableRoutes.js
const express = require('express');
const router = express.Router();
const finalizedTableController = require('../controllers/finalizedTableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Obter lista de mesas finalizadas (com paginação, pesquisa, ordenação)
router.get('/', authMiddleware,  finalizedTableController.getFinalizedTables);


router.get('/relatorios/periodo', authMiddleware,  finalizedTableController.getVendasPorPeriodo);

router.get('/sales-by-category', authMiddleware, finalizedTableController.getSalesByCategory);

// Relatório de vendas por garçom

router.get('/relatorios/garcom', authMiddleware,  finalizedTableController.getVendasPorGarcom);

// Obter uma mesa finalizada específica
router.put('/:id',authMiddleware, finalizedTableController.updateFinalizedTable);


// Relatório de vendas por período


router.post('/:id/finalizar', authMiddleware,  finalizedTableController.finalizarMesa);


module.exports = router;


// Conteúdo de: .\ifoodRoutes.js
const express = require('express');
const router = express.Router();
const ifoodAuthController = require('../controllers/ifoodAuthController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// 1) Iniciar o processo de autenticação
//    POST /ifood/auth/start
router.post(
  '/ifood/auth/start',
  authMiddleware,
  roleMiddleware(['admin', 'manager']), 
  ifoodAuthController.startAuth
);

// 2) Concluir a autenticação
//    POST /ifood/auth/complete
router.post(
  '/ifood/auth/complete',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  ifoodAuthController.completeAuth
);

// 3) Obter status da autenticação
//    GET /ifood/auth/status
router.get(
  '/ifood/auth/status',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  ifoodAuthController.getStatus
);

// 4) Renovar token
//    POST /ifood/auth/refresh
router.post(
  '/ifood/auth/refresh',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  ifoodAuthController.refreshToken
);

// 5) Exemplo: obter pedidos do iFood
//    GET /ifood/orders
router.get(
  '/ifood/orders',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  ifoodAuthController.getOrders
);

module.exports = router;


// Conteúdo de: .\ingredientRoutes.js
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
  upload.single('imagem'), // Middleware de upload para campo 'imagem'
  ingredientController.createIngredient
);

router.get(
  '/',
  authMiddleware,
  ingredientController.getIngredients
);

router.get(
  '/:id',
  authMiddleware,
  ingredientController.getIngredientById
);

router.put(
  '/:id',
  authMiddleware,
  upload.single('imagem'), // Middleware de upload para campo 'imagem'
  ingredientController.updateIngredient
);

router.delete(
  '/:id',
  authMiddleware,
  ingredientController.deleteIngredient
);

module.exports = router;


// Conteúdo de: .\integrationRoutes.js
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para integrações
router.get('/delivery-orders', authMiddleware, roleMiddleware(['manager', 'admin']), integrationController.fetchDeliveryOrders);

module.exports = router;


// Conteúdo de: .\lancamentosRoutes.js
// routes/lancamentos.js
const express = require('express');
const router = express.Router();
const lancamentoController = require('../controllers/lancamentoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/check-duplicate', authMiddleware, lancamentoController.checkDuplicate);
// GET: Listar lançamentos
router.get('/', authMiddleware, lancamentoController.listarLancamentos);

// GET: Obter 1 lançamento
router.get('/:id', authMiddleware, lancamentoController.obterLancamento);

// POST: Criar um lançamento
router.post('/', authMiddleware, lancamentoController.criarLancamento);

// PUT: Atualizar
router.put('/:id', authMiddleware, lancamentoController.atualizarLancamento);

// DELETE: Excluir
router.delete('/:id', authMiddleware, lancamentoController.excluirLancamento);

// GET: Resumo
router.get('/summary/resumo', authMiddleware, lancamentoController.resumoLancamentos);

module.exports = router;


// Conteúdo de: .\nfeRoutes.js
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


// Conteúdo de: .\orderRoutes.js
// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');


router.get('/sales-by-category', authMiddleware, orderController.getSalesByCategory);

// Rota para criar um novo pedido
router.post('/', authMiddleware, orderController.createOrder);

// Rota para obter todos os pedidos
router.get('/', authMiddleware, orderController.getOrders);

// Rota para obter um pedido por ID
router.get('/:id', authMiddleware, orderController.getOrderById);

// Rota para atualizar o status de um pedido
router.put('/:id/status', authMiddleware, orderController.updateOrderStatus);

// **Nova Rota para Atualizar Pedido Completo**
router.put('/:id', authMiddleware, orderController.updateOrder);

// Rota para excluir um pedido
router.delete('/:id', authMiddleware, orderController.deleteOrder);



module.exports = router;


// Conteúdo de: .\paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para pagamentos
router.post('/', authMiddleware, roleMiddleware(['agent', 'manager', 'admin']), paymentController.processPayment);

module.exports = router;


// Conteúdo de: .\printersRoutes.js
/* const express = require('express');
const router = express.Router();
const printer = require('printer'); // Importa a biblioteca printer

router.get('/printers', (req, res) => {
  try {
    const printers = printer.getPrinters(); // Obtém impressoras disponíveis
    const printerNames = printers.map((p) => p.name); // Apenas os nomes
    res.json(printerNames); // Retorna como JSON
  } catch (error) {
    console.error('Erro ao obter impressoras:', error);
    res.status(500).json({ message: 'Erro ao obter impressoras disponíveis' });
  }
}); */

// Conteúdo de: .\productRoutes.js
// routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// **Nova Rota para Verificar Duplicidade de Nome**
// Esta rota deve ser adicionada antes das rotas dinâmicas para evitar conflitos.
router.get(
  '/check-nome/:nome',
  authMiddleware,
  productController.checkNomeDuplicado
);

// **Nova Rota para Busca Avançada - Deve Vir Antes das Rotas Dinâmicas**
router.get(
  '/advanced',
  authMiddleware,
  productController.getProductsAdvanced
);

// Criar produto - requer a permissão 'createProduct'
router.post(
  '/',
  authMiddleware,
  productController.createProduct
);


// Obter todos os produtos - requer a permissão 'viewProduct'
router.get(
  '/',  
  authMiddleware,
  productController.getProducts
);

// Obter produto por ID - requer a permissão 'viewProduct'
router.get(
  '/:productId',
  authMiddleware,
  productController.getProductById
);

// Atualizar produto - requer a permissão 'editProduct'
router.put(
  '/:productId',
  authMiddleware,
  productController.updateProduct
);

// Deletar produto - requer a permissão 'deleteProduct'
router.delete(
  '/:productId',
  authMiddleware,
  productController.deleteProduct
);

module.exports = router;


// Conteúdo de: .\qrRoutes.js
// routes/qrRoutes.js
const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Somente admin ou manager geram o crachá
router.post('/generate', authMiddleware, roleMiddleware(['manager', 'admin']), qrController.generatePermanentQr);

// Endpoint para login via QR (público, pois só recebe o token gerado)
router.post('/login', authMiddleware, qrController.loginWithQr);

module.exports = router;


// Conteúdo de: .\queueRoutes.js
const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

// Se tiver middlewares de autenticação, inclua aqui
// const authMiddleware = require('../middlewares/authMiddleware');

// Cria nova entrada
router.post('/', queueController.createQueueEntry);

// Lista todas as entradas
router.get('/', queueController.getAllQueueEntries);

// Atualiza dados de uma entrada
router.put('/:id', queueController.updateQueueEntry);

// Finaliza entrada (libera mesa)
router.put('/:id/finish', queueController.finishQueueEntry);

// Exclui entrada (libera mesa e remove do banco)
router.delete('/:id', queueController.deleteQueueEntry);

module.exports = router;


// Conteúdo de: .\recipeRoutes.js
const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para receitas
router.post('/', authMiddleware, roleMiddleware(['manager']), recipeController.createRecipe);
router.get('/', authMiddleware, roleMiddleware(['manager', 'agent']), recipeController.getRecipes);
router.get('/:id', authMiddleware, roleMiddleware(['manager', 'agent']), recipeController.getRecipeById);
router.put('/:id', authMiddleware, roleMiddleware(['manager']), recipeController.updateRecipe);
router.delete('/:id', authMiddleware, roleMiddleware(['manager']), recipeController.deleteRecipe);

module.exports = router;


// Conteúdo de: .\reportRoutes.js
// src/routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware'); // Middleware de autenticação

// Rota para obter todas as estatísticas
router.get('/statistics', authMiddleware, reportController.getStatistics);

// Rota para obter produtos com estoque baixo
router.get('/produtosComEstoqueBaixo', authMiddleware, reportController.getProdutosComEstoqueBaixo);

module.exports = router;


// Conteúdo de: .\reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// Criar reserva
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createReservation']),
  reservationController.createReservation
);

router.delete(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['deleteReservation']),
  reservationController.deleteReservation
);

// Cancelar reserva
router.put(
  '/:reservationId/cancel',
  authMiddleware,
  permissionMiddleware(['editReservation']),
  reservationController.cancelReservation
);

// Obter todas as reservas (opcional para debug)
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservations
);

// Obter reserva por ID (opcional)
router.get(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservationById
);

router.get(
  '/available',
  authMiddleware,
  permissionMiddleware(['viewTables']),
  reservationController.getAvailableTables
);


module.exports = router;


// Conteúdo de: .\salesGoalRoutes.js
// src/routes/salesGoalRoutes.js

const express = require('express');
const router = express.Router();
const salesGoalController = require('../controllers/salesGoalController');
const authMiddleware = require('../middlewares/authMiddleware');

// Listagem avançada
router.get('/advanced', authMiddleware, salesGoalController.getAdvancedSalesGoals);

// Exportar metas em PDF
router.get('/export-pdf', authMiddleware, salesGoalController.exportGoalsToPDF);

// Detalhes
router.get('/:id/details', authMiddleware, salesGoalController.getSalesGoalDetails);

// Criar
router.post('/', authMiddleware, salesGoalController.createSalesGoal);

// Editar
router.put('/:id', authMiddleware, salesGoalController.updateSalesGoal);

// Excluir - Somente admin
router.delete('/:id', authMiddleware, salesGoalController.deleteSalesGoal);

// Obter metas de um funcionário
router.get('/employee/:id', authMiddleware, salesGoalController.getSalesGoalsByEmployee);

// Exporta as rotas
module.exports = router;


// Conteúdo de: .\stockRoutes.js
// src/routes/stockRoutes.js

const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para estoque
router.get('/', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), stockController.getStock);
router.put('/:productId', authMiddleware, roleMiddleware(['manager', 'admin']), stockController.updateStock);

module.exports = router;


// Conteúdo de: .\supplierRoutes.js
// routes/supplierRoutes.js
const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');

// Validações para criação e atualização de fornecedores
const supplierValidationRules = [
  body('category')
    .notEmpty()
    .withMessage('Categoria é obrigatória.')
    .isIn([
      'Alimentos',
      'Bebidas',
      'Limpeza',
      'Higiene Pessoal',
      'Utensílios',
      'Tecnologia',
      'Outro',
    ])
    .withMessage('Categoria inválida.'),
  body('name')
    .notEmpty()
    .withMessage('Nome do fornecedor é obrigatório.'),
  body('email')
    .isEmail()
    .withMessage('Email inválido.'),
  body('phone')
    .matches(/^(\+?55)?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)
    .withMessage('Telefone inválido.'),
  body('cnpj')
    .notEmpty()
    .withMessage('CNPJ é obrigatório.')
    .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .withMessage('CNPJ no formato inválido.'),
  body('address')
    .notEmpty()
    .withMessage('Endereço é obrigatório.'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website inválido.'),
  body('products')
    .isArray({ min: 1 })
    .withMessage('Pelo menos um produto deve ser fornecido.'),
  body('products.*')
    .notEmpty()
    .withMessage('Nome do produto não pode ser vazio.'),
];

// Criar um novo fornecedor
router.post(
  '/',
  authMiddleware,
  supplierValidationRules,
  supplierController.createSupplier
);

// Obter todos os fornecedores com busca e paginação
router.get('/', authMiddleware, supplierController.getSuppliers);

// Obter um fornecedor específico pelo ID
router.get('/:id', authMiddleware, supplierController.getSupplierById);

// Atualizar um fornecedor existente
router.put(
  '/:id',
  authMiddleware,
  supplierValidationRules,
  supplierController.updateSupplier
);

// Deletar um fornecedor
router.delete('/:id', authMiddleware, supplierController.deleteSupplier);

module.exports = router;


// Conteúdo de: .\tableRoutes.js
// routes/table.js
const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// === Rotas Estáticas Primeiro ===

// Rota para pegar mesas por ambiente
router.get(
  '/by-ambiente/:ambienteId',
  authMiddleware,
  tableController.getTablesByAmbiente
);

// Outros endpoints estáticos
router.get(
  '/available',
  authMiddleware,
  tableController.getAvailableTables
);

router.get(
  '/dashboard',
  authMiddleware,
  tableController.getTablesDashboard
);

router.get(
  '/advanced',
  authMiddleware,
  roleMiddleware(['manager', 'agent', 'admin']),
  tableController.getAdvancedTables
);

// Rotas para Mesas
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.createTable
);

router.get(
  '/',
  authMiddleware,
  tableController.getTables
);

// === Rotas Dinâmicas Depois ===

// Rota para finalizar mesa
router.post(
  '/:id/finalizar',
  authMiddleware,
  roleMiddleware(['manager', 'agent', 'admin']),
  tableController.finalizarMesa
);

// Atualizar status da mesa
router.put(
  '/:tableId/status',
  authMiddleware,
  roleMiddleware(['manager', 'agent', 'admin']),
  tableController.updateTableStatus
);

// Rotas para atualizar seatSeparation
router.put(
  '/:id/seat-separation',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.updateSeatSeparation
);

// Rotas para atualizar assentos
router.put(
  '/:id/assentos',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.updateAssentos
);

// ATENÇÃO: Use uma rota PUT principal para atualizar a mesa
router.put(
  '/:tableId',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.updateTable
);

router.delete(
  '/:tableId',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.deleteTable
);

// === Rota Dinâmica Principal ===

// Adicionar a rota GET /tables/:id (deve ser a última rota dinâmica)
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['manager', 'admin', 'agent']), // Adicione os papéis apropriados
  tableController.getTableById
);

module.exports = router;


// Conteúdo de: .\timeRoutes.js
// routes/timeRoutes.js
const express = require('express');
const router = express.Router();
const timeController = require('../controllers/timeController');
const authMiddleware = require('../middlewares/authMiddleware'); // Se necessário

router.get('/', authMiddleware, timeController.getServerTime);

module.exports = router;


// Conteúdo de: .\todo-backend.js
// Conteúdo de: .\ambienteRoutes.js
const express = require('express');
const router = express.Router();
const ambienteController = require('../controllers/ambienteController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para ambientes
router.post('/', authMiddleware, ambienteController.createAmbiente);
router.get('/', authMiddleware, ambienteController.getAmbientes);
router.put('/:id', authMiddleware, ambienteController.updateAmbiente);
router.delete('/:id', authMiddleware, ambienteController.deleteAmbiente);
router.put('/order', authMiddleware, ambienteController.updateAmbienteOrder);


module.exports = router;    


// Conteúdo de: .\authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas de autenticação
router.post('/register', authMiddleware, roleMiddleware(['admin', 'manager']), authController.register);
router.post('/login', authController.login);

// Rotas para recuperação de senha
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPasswordWithOTP);


// Rota para atualizar usuário
router.put('/users/:id', authMiddleware, roleMiddleware(['admin', 'manager']), authController.updateUser);
module.exports = router;


// Conteúdo de: .\caixaRoutes.js
// routes/caixaRoutes.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();
const caixaController = require('../controllers/caixaController');

router.get('/history', authMiddleware, caixaController.getCaixaHistory);

// Rota para iniciar o caixa
router.post('/iniciar', authMiddleware, caixaController.iniciarCaixa);

// Rota para finalizar o caixa
router.post('/finalizar', authMiddleware, caixaController.finalizarCaixa);

// Rota para obter o status do caixa
router.get('/status', authMiddleware, caixaController.getCaixaStatus);

module.exports = router;


// Conteúdo de: .\categoriasRoutes.js
// backend/routes/categoriaRoutes.js
const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/arvore', authMiddleware, categoriaController.listarCategoriasArvore);

// Listar categorias
router.get('/', authMiddleware, categoriaController.listarCategorias);

// Criar categoria
router.post('/', authMiddleware, categoriaController.criarCategoria);

// Atualizar categoria
router.put('/:id', authMiddleware, categoriaController.atualizarCategoria);

// Excluir categoria
router.delete('/:id', authMiddleware, categoriaController.excluirCategoria);

module.exports = router;


// Conteúdo de: .\categoryRoutes.js
// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');


router.get('/', authMiddleware, categoryController.getAllCategories);


// Criar categoria
router.post(
  '/',
  authMiddleware,
  categoryController.createCategory
);

// Buscar categorias avançadas com paginação, pesquisa e ordenação
router.get(
  '/advanced',
  authMiddleware,
  categoryController.getCategories
);

// Obter categoria por ID
router.get(
  '/:categoryId',
  authMiddleware,
  categoryController.getCategoryById
);

// Atualizar categoria
router.put(
  '/:categoryId',
  authMiddleware,
  categoryController.updateCategory
);

// Deletar categoria
router.delete(
  '/:categoryId',
  authMiddleware,
  categoryController.deleteCategory
);

module.exports = router;


// Conteúdo de: .\comandaRoutes.js
// cash-register-backend/routes/comandaRoutes.js

const express = require('express');
const router = express.Router();
const comandaController = require('../controllers/comandaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const Table = require('../models/Table'); // <--- IMPORTANTE

// Enviar email
router.post(
  '/send-email',
  authMiddleware,
  comandaController.sendComandaEmail
);
// Listar comandas
router.get(
  '/',
  authMiddleware,
  comandaController.getComandas
);

// Baixar PDF
router.get(
  '/:id/pdf',
  authMiddleware,
  comandaController.downloadComandaPDF
);



// Nova rota para PDF de Conferência (antes de finalizar a mesa)
router.get(
  '/:tableId/conferencia',
  authMiddleware,
  comandaController.generateConferencePDF
);

// Adicionar pagamento parcial
router.put(
  '/:comandaId/payments',
  authMiddleware,
  comandaController.addPayment
);

router.get(
  '/:comandaId/invoice',
  authMiddleware,
  comandaController.generateInvoicePDF
);

module.exports = router;


// Conteúdo de: .\configRoutes.js
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

router.get('/', authMiddleware, roleMiddleware(['admin']), configController.getConfig);
router.post('/', authMiddleware, roleMiddleware(['admin']), upload.single('logotipo'), configController.createConfig);
router.put('/', authMiddleware, roleMiddleware(['admin']), upload.single('logotipo'), configController.updateConfig);

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


module.exports = router;


// Conteúdo de: .\customerRoutes.js
// routes/customerRoutes.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomersAdvanced, // Importando o novo método
} = require('../controllers/customerController');


// **Nova Rota para busca avançada - Deve vir antes das rotas com parâmetros dinâmicos**
router.get('/advanced', authMiddleware, getCustomersAdvanced);

// Rota para criação de cliente
router.post('/', authMiddleware, createCustomer);

// Rota para obter todos os clientes (sem paginação)
router.get('/', authMiddleware, getCustomers);

// Rotas com parâmetros dinâmicos devem vir por último
router.get('/:id', authMiddleware, getCustomerById);
router.put('/:id', authMiddleware, updateCustomer);
router.delete('/:id', authMiddleware, deleteCustomer);

module.exports = router;


// Conteúdo de: .\dreRoutes.js
const express = require('express');
const router = express.Router();
const dreController = require('../controllers/dreController');
const authMiddleware = require('../middlewares/authMiddleware');

// POST: /dre/comparativo => recebe array de períodos
router.post('/comparativo', authMiddleware, dreController.comparativoDRE);

module.exports = router;


// Conteúdo de: .\emailRoutes.js
// src/routes/emailRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const { sendEmail } = require('../utils/emailUtil');

// Middleware para autenticação, se necessário
// const authenticate = require('../middlewares/authenticate');

router.post('/send-invoice-email', /* authenticate, */ async (req, res) => {
  const { email, pdfPath } = req.body;

  if (!email || !pdfPath) {
    return res.status(400).json({ message: 'Email e pdfPath são obrigatórios.' });
  }

  try {
    const fullPdfPath = path.join(__dirname, '..', 'public', pdfPath); // Ajuste o caminho conforme necessário

    // Verifique se o arquivo existe
    const fs = require('fs');
    if (!fs.existsSync(fullPdfPath)) {
      return res.status(404).json({ message: 'Arquivo PDF não encontrado.' });
    }

    // Enviar email
    await sendEmail(
      email,
      'Finalização da Mesa',
      'Segue em anexo a finalização da sua mesa.',
      `<p>Olá,</p><p>Segue em anexo a finalização da sua mesa.</p>`,
      [
        {
          filename: path.basename(fullPdfPath),
          path: fullPdfPath,
          contentType: 'application/pdf',
        },
      ]
    );

    res.status(200).json({ message: 'Email enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({ message: 'Erro ao enviar email.' });
  }
});

module.exports = router;


// Conteúdo de: .\employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para funcionários
router.post('/', authMiddleware, roleMiddleware(['manager']), employeeController.createEmployee);
router.get('/', authMiddleware, roleMiddleware(['manager']), employeeController.getEmployees);
router.get('/:id', authMiddleware, roleMiddleware(['manager']), employeeController.getEmployeeById);
router.put('/:id', authMiddleware, roleMiddleware(['manager']), employeeController.updateEmployee);
router.delete('/:id', authMiddleware, roleMiddleware(['manager']), employeeController.deleteEmployee);

// Rota pública para login
router.post('/login', employeeController.loginEmployee);

module.exports = router;


// Conteúdo de: .\finalizedTableRoutes.js
// routes/finalizedTableRoutes.js
const express = require('express');
const router = express.Router();
const finalizedTableController = require('../controllers/finalizedTableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Obter lista de mesas finalizadas (com paginação, pesquisa, ordenação)
router.get('/', authMiddleware,  finalizedTableController.getFinalizedTables);


router.get('/relatorios/periodo', authMiddleware,  finalizedTableController.getVendasPorPeriodo);

router.get('/sales-by-category', authMiddleware, finalizedTableController.getSalesByCategory);

// Relatório de vendas por garçom

router.get('/relatorios/garcom', authMiddleware,  finalizedTableController.getVendasPorGarcom);

// Obter uma mesa finalizada específica
router.put('/:id',authMiddleware, finalizedTableController.updateFinalizedTable);


// Relatório de vendas por período


router.post('/:id/finalizar', authMiddleware,  finalizedTableController.finalizarMesa);


module.exports = router;


// Conteúdo de: .\ifoodRoutes.js
const express = require('express');
const router = express.Router();
const ifoodAuthController = require('../controllers/ifoodAuthController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// 1) Iniciar o processo de autenticação
//    POST /ifood/auth/start
router.post(
  '/ifood/auth/start',
  authMiddleware,
  roleMiddleware(['admin', 'manager']), 
  ifoodAuthController.startAuth
);

// 2) Concluir a autenticação
//    POST /ifood/auth/complete
router.post(
  '/ifood/auth/complete',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  ifoodAuthController.completeAuth
);

// 3) Obter status da autenticação
//    GET /ifood/auth/status
router.get(
  '/ifood/auth/status',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  ifoodAuthController.getStatus
);

// 4) Renovar token
//    POST /ifood/auth/refresh
router.post(
  '/ifood/auth/refresh',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  ifoodAuthController.refreshToken
);

// 5) Exemplo: obter pedidos do iFood
//    GET /ifood/orders
router.get(
  '/ifood/orders',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  ifoodAuthController.getOrders
);

module.exports = router;


// Conteúdo de: .\ingredientRoutes.js
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
  upload.single('imagem'), // Middleware de upload para campo 'imagem'
  ingredientController.createIngredient
);

router.get(
  '/',
  authMiddleware,
  ingredientController.getIngredients
);

router.get(
  '/:id',
  authMiddleware,
  ingredientController.getIngredientById
);

router.put(
  '/:id',
  authMiddleware,
  upload.single('imagem'), // Middleware de upload para campo 'imagem'
  ingredientController.updateIngredient
);

router.delete(
  '/:id',
  authMiddleware,
  ingredientController.deleteIngredient
);

module.exports = router;


// Conteúdo de: .\integrationRoutes.js
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para integrações
router.get('/delivery-orders', authMiddleware, roleMiddleware(['manager', 'admin']), integrationController.fetchDeliveryOrders);

module.exports = router;


// Conteúdo de: .\lancamentosRoutes.js
// routes/lancamentos.js
const express = require('express');
const router = express.Router();
const lancamentoController = require('../controllers/lancamentoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/check-duplicate', authMiddleware, lancamentoController.checkDuplicate);
// GET: Listar lançamentos
router.get('/', authMiddleware, lancamentoController.listarLancamentos);

// GET: Obter 1 lançamento
router.get('/:id', authMiddleware, lancamentoController.obterLancamento);

// POST: Criar um lançamento
router.post('/', authMiddleware, lancamentoController.criarLancamento);

// PUT: Atualizar
router.put('/:id', authMiddleware, lancamentoController.atualizarLancamento);

// DELETE: Excluir
router.delete('/:id', authMiddleware, lancamentoController.excluirLancamento);

// GET: Resumo
router.get('/summary/resumo', authMiddleware, lancamentoController.resumoLancamentos);

module.exports = router;


// Conteúdo de: .\nfeRoutes.js
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


// Conteúdo de: .\orderRoutes.js
// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');


router.get('/sales-by-category', authMiddleware, orderController.getSalesByCategory);

// Rota para criar um novo pedido
router.post('/', authMiddleware, orderController.createOrder);

// Rota para obter todos os pedidos
router.get('/', authMiddleware, orderController.getOrders);

// Rota para obter um pedido por ID
router.get('/:id', authMiddleware, orderController.getOrderById);

// Rota para atualizar o status de um pedido
router.put('/:id/status', authMiddleware, orderController.updateOrderStatus);

// **Nova Rota para Atualizar Pedido Completo**
router.put('/:id', authMiddleware, orderController.updateOrder);

// Rota para excluir um pedido
router.delete('/:id', authMiddleware, orderController.deleteOrder);



module.exports = router;


// Conteúdo de: .\paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para pagamentos
router.post('/', authMiddleware, roleMiddleware(['agent', 'manager', 'admin']), paymentController.processPayment);

module.exports = router;


// Conteúdo de: .\printersRoutes.js
/* const express = require('express');
const router = express.Router();
const printer = require('printer'); // Importa a biblioteca printer

router.get('/printers', (req, res) => {
  try {
    const printers = printer.getPrinters(); // Obtém impressoras disponíveis
    const printerNames = printers.map((p) => p.name); // Apenas os nomes
    res.json(printerNames); // Retorna como JSON
  } catch (error) {
    console.error('Erro ao obter impressoras:', error);
    res.status(500).json({ message: 'Erro ao obter impressoras disponíveis' });
  }
}); */

// Conteúdo de: .\productRoutes.js
// routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// **Nova Rota para Verificar Duplicidade de Nome**
// Esta rota deve ser adicionada antes das rotas dinâmicas para evitar conflitos.
router.get(
  '/check-nome/:nome',
  authMiddleware,
  productController.checkNomeDuplicado
);

// **Nova Rota para Busca Avançada - Deve Vir Antes das Rotas Dinâmicas**
router.get(
  '/advanced',
  authMiddleware,
  productController.getProductsAdvanced
);

// Criar produto - requer a permissão 'createProduct'
router.post(
  '/',
  authMiddleware,
  productController.createProduct
);


// Obter todos os produtos - requer a permissão 'viewProduct'
router.get(
  '/',  
  authMiddleware,
  productController.getProducts
);

// Obter produto por ID - requer a permissão 'viewProduct'
router.get(
  '/:productId',
  authMiddleware,
  productController.getProductById
);

// Atualizar produto - requer a permissão 'editProduct'
router.put(
  '/:productId',
  authMiddleware,
  productController.updateProduct
);

// Deletar produto - requer a permissão 'deleteProduct'
router.delete(
  '/:productId',
  authMiddleware,
  productController.deleteProduct
);

module.exports = router;


// Conteúdo de: .\qrRoutes.js
// routes/qrRoutes.js
const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Somente admin ou manager geram o crachá
router.post('/generate', authMiddleware, roleMiddleware(['manager', 'admin']), qrController.generatePermanentQr);

// Endpoint para login via QR (público, pois só recebe o token gerado)
router.post('/login', authMiddleware, qrController.loginWithQr);

module.exports = router;


// Conteúdo de: .\queueRoutes.js
const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

// Se tiver middlewares de autenticação, inclua aqui
// const authMiddleware = require('../middlewares/authMiddleware');

// Cria nova entrada
router.post('/', queueController.createQueueEntry);

// Lista todas as entradas
router.get('/', queueController.getAllQueueEntries);

// Atualiza dados de uma entrada
router.put('/:id', queueController.updateQueueEntry);

// Finaliza entrada (libera mesa)
router.put('/:id/finish', queueController.finishQueueEntry);

// Exclui entrada (libera mesa e remove do banco)
router.delete('/:id', queueController.deleteQueueEntry);

module.exports = router;


// Conteúdo de: .\recipeRoutes.js
const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para receitas
router.post('/', authMiddleware, roleMiddleware(['manager']), recipeController.createRecipe);
router.get('/', authMiddleware, roleMiddleware(['manager', 'agent']), recipeController.getRecipes);
router.get('/:id', authMiddleware, roleMiddleware(['manager', 'agent']), recipeController.getRecipeById);
router.put('/:id', authMiddleware, roleMiddleware(['manager']), recipeController.updateRecipe);
router.delete('/:id', authMiddleware, roleMiddleware(['manager']), recipeController.deleteRecipe);

module.exports = router;


// Conteúdo de: .\reportRoutes.js
// src/routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware'); // Middleware de autenticação

// Rota para obter todas as estatísticas
router.get('/statistics', authMiddleware, reportController.getStatistics);

// Rota para obter produtos com estoque baixo
router.get('/produtosComEstoqueBaixo', authMiddleware, reportController.getProdutosComEstoqueBaixo);

module.exports = router;


// Conteúdo de: .\reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// Criar reserva
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createReservation']),
  reservationController.createReservation
);

router.delete(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['deleteReservation']),
  reservationController.deleteReservation
);

// Cancelar reserva
router.put(
  '/:reservationId/cancel',
  authMiddleware,
  permissionMiddleware(['editReservation']),
  reservationController.cancelReservation
);

// Obter todas as reservas (opcional para debug)
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservations
);

// Obter reserva por ID (opcional)
router.get(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservationById
);

router.get(
  '/available',
  authMiddleware,
  permissionMiddleware(['viewTables']),
  reservationController.getAvailableTables
);


module.exports = router;


// Conteúdo de: .\salesGoalRoutes.js
// src/routes/salesGoalRoutes.js

const express = require('express');
const router = express.Router();
const salesGoalController = require('../controllers/salesGoalController');
const authMiddleware = require('../middlewares/authMiddleware');

// Listagem avançada
router.get('/advanced', authMiddleware, salesGoalController.getAdvancedSalesGoals);

// Exportar metas em PDF
router.get('/export-pdf', authMiddleware, salesGoalController.exportGoalsToPDF);

// Detalhes
router.get('/:id/details', authMiddleware, salesGoalController.getSalesGoalDetails);

// Criar
router.post('/', authMiddleware, salesGoalController.createSalesGoal);

// Editar
router.put('/:id', authMiddleware, salesGoalController.updateSalesGoal);

// Excluir - Somente admin
router.delete('/:id', authMiddleware, salesGoalController.deleteSalesGoal);

// Obter metas de um funcionário
router.get('/employee/:id', authMiddleware, salesGoalController.getSalesGoalsByEmployee);

// Exporta as rotas
module.exports = router;


// Conteúdo de: .\stockRoutes.js
// src/routes/stockRoutes.js

const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para estoque
router.get('/', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), stockController.getStock);
router.put('/:productId', authMiddleware, roleMiddleware(['manager', 'admin']), stockController.updateStock);

module.exports = router;


// Conteúdo de: .\supplierRoutes.js
// routes/supplierRoutes.js
const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');

// Validações para criação e atualização de fornecedores
const supplierValidationRules = [
  body('category')
    .notEmpty()
    .withMessage('Categoria é obrigatória.')
    .isIn([
      'Alimentos',
      'Bebidas',
      'Limpeza',
      'Higiene Pessoal',
      'Utensílios',
      'Tecnologia',
      'Outro',
    ])
    .withMessage('Categoria inválida.'),
  body('name')
    .notEmpty()
    .withMessage('Nome do fornecedor é obrigatório.'),
  body('email')
    .isEmail()
    .withMessage('Email inválido.'),
  body('phone')
    .matches(/^(\+?55)?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)
    .withMessage('Telefone inválido.'),
  body('cnpj')
    .notEmpty()
    .withMessage('CNPJ é obrigatório.')
    .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .withMessage('CNPJ no formato inválido.'),
  body('address')
    .notEmpty()
    .withMessage('Endereço é obrigatório.'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website inválido.'),
  body('products')
    .isArray({ min: 1 })
    .withMessage('Pelo menos um produto deve ser fornecido.'),
  body('products.*')
    .notEmpty()
    .withMessage('Nome do produto não pode ser vazio.'),
];

// Criar um novo fornecedor
router.post(
  '/',
  authMiddleware,
  supplierValidationRules,
  supplierController.createSupplier
);

// Obter todos os fornecedores com busca e paginação
router.get('/', authMiddleware, supplierController.getSuppliers);

// Obter um fornecedor específico pelo ID
router.get('/:id', authMiddleware, supplierController.getSupplierById);

// Atualizar um fornecedor existente
router.put(
  '/:id',
  authMiddleware,
  supplierValidationRules,
  supplierController.updateSupplier
);

// Deletar um fornecedor
router.delete('/:id', authMiddleware, supplierController.deleteSupplier);

module.exports = router;


// Conteúdo de: .\tableRoutes.js
// routes/table.js
const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// === Rotas Estáticas Primeiro ===

// Rota para pegar mesas por ambiente
router.get(
  '/by-ambiente/:ambienteId',
  authMiddleware,
  tableController.getTablesByAmbiente
);

// Outros endpoints estáticos
router.get(
  '/available',
  authMiddleware,
  tableController.getAvailableTables
);

router.get(
  '/dashboard',
  authMiddleware,
  tableController.getTablesDashboard
);

router.get(
  '/advanced',
  authMiddleware,
  roleMiddleware(['manager', 'agent', 'admin']),
  tableController.getAdvancedTables
);

// Rotas para Mesas
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.createTable
);

router.get(
  '/',
  authMiddleware,
  tableController.getTables
);

// === Rotas Dinâmicas Depois ===

// Rota para finalizar mesa
router.post(
  '/:id/finalizar',
  authMiddleware,
  roleMiddleware(['manager', 'agent', 'admin']),
  tableController.finalizarMesa
);

// Atualizar status da mesa
router.put(
  '/:tableId/status',
  authMiddleware,
  roleMiddleware(['manager', 'agent', 'admin']),
  tableController.updateTableStatus
);

// Rotas para atualizar seatSeparation
router.put(
  '/:id/seat-separation',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.updateSeatSeparation
);

// Rotas para atualizar assentos
router.put(
  '/:id/assentos',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.updateAssentos
);

// ATENÇÃO: Use uma rota PUT principal para atualizar a mesa
router.put(
  '/:tableId',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.updateTable
);

router.delete(
  '/:tableId',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  tableController.deleteTable
);

// === Rota Dinâmica Principal ===

// Adicionar a rota GET /tables/:id (deve ser a última rota dinâmica)
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['manager', 'admin', 'agent']), // Adicione os papéis apropriados
  tableController.getTableById
);

module.exports = router;


// Conteúdo de: .\uploadRoute.js
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


// Conteúdo de: .\userRoutes.js
// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/check-nome/:nome', userController.checkNomeDuplicado);

// Obter membros da equipe
router.get(
  '/team-members',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  userController.getTeamMembers
);

// Atualizar usuário (PUT)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  userController.updateUser
);

// Obter dados do usuário logado
router.get('/me', authMiddleware, userController.getMe);

// Outras rotas conforme necessário

module.exports = router;


