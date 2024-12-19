// Conteúdo de: .\ambienteRoutes.js
const express = require('express');
const router = express.Router();
const ambienteController = require('../controllers/ambienteController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para ambientes
router.post('/', authMiddleware, roleMiddleware(['manager']), ambienteController.createAmbiente);
router.get('/', authMiddleware, roleMiddleware(['manager', 'agent']), ambienteController.getAmbientes);
router.put('/:id', authMiddleware, roleMiddleware(['manager']), ambienteController.updateAmbiente);
router.delete('/:id', authMiddleware, roleMiddleware(['manager']), ambienteController.deleteAmbiente);

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
  permissionMiddleware(['createCategory']),
  categoryController.createCategory
);

// Buscar categorias avançadas com paginação, pesquisa e ordenação
router.get(
  '/advanced',
  authMiddleware,
  permissionMiddleware(['viewCategory']),
  categoryController.getCategories
);

// Obter categoria por ID
router.get(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['viewCategory']),
  categoryController.getCategoryById
);

// Atualizar categoria
router.put(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['editCategory']),
  categoryController.updateCategory
);

// Deletar categoria
router.delete(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['deleteCategory']),
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

router.get('/', authMiddleware, roleMiddleware(['manager', 'admin']), comandaController.getComandas);
router.get('/:id/pdf', authMiddleware, roleMiddleware(['manager', 'admin']), comandaController.downloadComandaPDF);
router.post('/send-email', authMiddleware, roleMiddleware(['manager', 'admin']), comandaController.sendComandaEmail);

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

module.exports = router;


// Conteúdo de: .\customerRoutes.js
// routes/customerRoutes.js
const express = require('express');
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
router.get('/advanced', getCustomersAdvanced);

// Rota para criação de cliente
router.post('/', createCustomer);

// Rota para obter todos os clientes (sem paginação)
router.get('/', getCustomers);

// Rotas com parâmetros dinâmicos devem vir por último
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

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
router.get('/', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getFinalizedTables);

// Obter uma mesa finalizada específica
router.get('/:id', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getFinalizedTableById);

// Relatório de vendas por período
router.get('/relatorios/periodo', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getVendasPorPeriodo);

// Relatório de vendas por garçom
router.get('/relatorios/garcom', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getVendasPorGarcom);

router.post('/:id/finalizar', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.finalizarMesa);

module.exports = router;


// Conteúdo de: .\ifoodRoutes.js
const express = require('express');
const router = express.Router();
const ifoodAuthController = require('../controllers/ifoodAuthController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Iniciar o processo de autenticação
router.post('/ifood/auth/start', authMiddleware, roleMiddleware(['admin', 'manager']), ifoodAuthController.startAuth);

// Concluir a autenticação com o código de autorização
router.post('/ifood/auth/complete', authMiddleware, roleMiddleware(['admin', 'manager']), ifoodAuthController.completeAuth);

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


// Conteúdo de: .\integrationRoutes.js
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para integrações
router.get('/delivery-orders', authMiddleware, roleMiddleware(['manager', 'admin']), integrationController.fetchDeliveryOrders);

module.exports = router;


// Conteúdo de: .\orderRoutes.js
// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para pedidos

// Rota para criar um novo pedido
router.post('/', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.createOrder);

// Rota para obter todos os pedidos
router.get('/', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.getOrders);

// Rota para obter um pedido por ID
router.get('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.getOrderById);

// Rota para atualizar o status de um pedido
router.put('/:id/status', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.updateOrderStatus);

// **Nova Rota para Atualizar Pedido Completo**
router.put('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.updateOrder);

// Rota para excluir um pedido
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.deleteOrder);

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
  permissionMiddleware(['viewProduct']), // Ajuste as permissões conforme necessário
  productController.checkNomeDuplicado
);

// **Nova Rota para Busca Avançada - Deve Vir Antes das Rotas Dinâmicas**
router.get(
  '/advanced',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProductsAdvanced
);

// Criar produto - requer a permissão 'createProduct'
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createProduct']),
  productController.createProduct
);

// Obter todos os produtos - requer a permissão 'viewProduct'
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProducts
);

// Obter produto por ID - requer a permissão 'viewProduct'
router.get(
  '/:productId',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProductById
);

// Atualizar produto - requer a permissão 'editProduct'
router.put(
  '/:productId',
  authMiddleware,
  permissionMiddleware(['editProduct']),
  productController.updateProduct
);

// Deletar produto - requer a permissão 'deleteProduct'
router.delete(
  '/:productId',
  authMiddleware,
  permissionMiddleware(['deleteProduct']),
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
// routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// Rotas avançadas
router.get(
  '/advanced',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservationsAdvanced
);

// Criar reserva
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createReservation']),
  reservationController.createReservation
);

// Obter todas as reservas
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservations
);

// Obter reserva por ID
router.get(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservationById
);

// Atualizar reserva
router.put(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['editReservation']),
  reservationController.updateReservation
);

// Deletar reserva
router.delete(
  '/:reservationId',
  authMiddleware,
  permissionMiddleware(['deleteReservation']),
  reservationController.deleteReservation
);

// Obter mesas disponíveis para uma data específica
router.get(
  '/tables/available',
  authMiddleware,
  permissionMiddleware(['viewReservation']),
  reservationController.getReservationsAdvanced
);

module.exports = router;


// Conteúdo de: .\salesGoalRoutes.js
// routes/salesGoalRoutes.js

const express = require('express');
const router = express.Router();
const salesGoalController = require('../controllers/salesGoalController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Obter metas de vendas avançadas com paginação e pesquisa
router.get(
  '/advanced',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.getAdvancedSalesGoals
);

// Criar nova meta de vendas
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.createSalesGoal
);  

// Obter todas as metas de vendas (Admin e Manager)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.getSalesGoals
);

// Obter metas de vendas por funcionário
router.get(
  '/employee/:id',
  authMiddleware,
  roleMiddleware(['agent', 'admin', 'manager']),
  salesGoalController.getSalesGoalsByEmployee
);

// Atualizar uma meta de vendas
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.updateSalesGoal
);

// Excluir uma meta de vendas
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.deleteSalesGoal
);

// Obter detalhes da meta de vendas
router.get(
  '/:id/details',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  salesGoalController.getSalesGoalDetails
);

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


// Conteúdo de: .\tableRoutes.js
// routes/tableRoutes.js

const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para Mesas
router.post('/', authMiddleware, roleMiddleware(['manager', 'admin']), tableController.createTable);
router.get('/', authMiddleware, roleMiddleware(['manager', 'agent', 'admin']), tableController.getTables);
router.get('/advanced', authMiddleware, roleMiddleware(['manager', 'agent', 'admin']), tableController.getAdvancedTables);
router.put('/:tableId', authMiddleware, roleMiddleware(['manager', 'admin']), tableController.updateTable);
router.delete('/:tableId', authMiddleware, roleMiddleware(['manager', 'admin']), tableController.deleteTable);

// Finalizar Mesa
router.post('/:id/finalizar', authMiddleware, roleMiddleware(['manager', 'agent', 'admin']), tableController.finalizarMesa);

// Atualizar Status da Mesa
router.put('/:tableId/status', authMiddleware, roleMiddleware(['manager', 'agent', 'admin']), tableController.updateTableStatus);
router.get('/available', authMiddleware, roleMiddleware(['manager', 'admin']), tableController.getAvailableTables);

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
router.post('/', authMiddleware, roleMiddleware(['manager']), ambienteController.createAmbiente);
router.get('/', authMiddleware, roleMiddleware(['manager', 'agent']), ambienteController.getAmbientes);
router.put('/:id', authMiddleware, roleMiddleware(['manager']), ambienteController.updateAmbiente);
router.delete('/:id', authMiddleware, roleMiddleware(['manager']), ambienteController.deleteAmbiente);

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
  permissionMiddleware(['createCategory']),
  categoryController.createCategory
);

// Buscar categorias avançadas com paginação, pesquisa e ordenação
router.get(
  '/advanced',
  authMiddleware,
  permissionMiddleware(['viewCategory']),
  categoryController.getCategories
);

// Obter categoria por ID
router.get(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['viewCategory']),
  categoryController.getCategoryById
);

// Atualizar categoria
router.put(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['editCategory']),
  categoryController.updateCategory
);

// Deletar categoria
router.delete(
  '/:categoryId',
  authMiddleware,
  permissionMiddleware(['deleteCategory']),
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

router.get('/', authMiddleware, roleMiddleware(['manager', 'admin']), comandaController.getComandas);
router.get('/:id/pdf', authMiddleware, roleMiddleware(['manager', 'admin']), comandaController.downloadComandaPDF);
router.post('/send-email', authMiddleware, roleMiddleware(['manager', 'admin']), comandaController.sendComandaEmail);

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

module.exports = router;


// Conteúdo de: .\customerRoutes.js
// routes/customerRoutes.js
const express = require('express');
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
router.get('/advanced', getCustomersAdvanced);

// Rota para criação de cliente
router.post('/', createCustomer);

// Rota para obter todos os clientes (sem paginação)
router.get('/', getCustomers);

// Rotas com parâmetros dinâmicos devem vir por último
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

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
router.get('/', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getFinalizedTables);

// Obter uma mesa finalizada específica
router.get('/:id', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getFinalizedTableById);

// Relatório de vendas por período
router.get('/relatorios/periodo', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getVendasPorPeriodo);

// Relatório de vendas por garçom
router.get('/relatorios/garcom', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.getVendasPorGarcom);

router.post('/:id/finalizar', authMiddleware, roleMiddleware(['manager', 'admin', 'agent']), finalizedTableController.finalizarMesa);

module.exports = router;


// Conteúdo de: .\ifoodRoutes.js
const express = require('express');
const router = express.Router();
const ifoodAuthController = require('../controllers/ifoodAuthController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Iniciar o processo de autenticação
router.post('/ifood/auth/start', authMiddleware, roleMiddleware(['admin', 'manager']), ifoodAuthController.startAuth);

// Concluir a autenticação com o código de autorização
router.post('/ifood/auth/complete', authMiddleware, roleMiddleware(['admin', 'manager']), ifoodAuthController.completeAuth);

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


// Conteúdo de: .\integrationRoutes.js
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para integrações
router.get('/delivery-orders', authMiddleware, roleMiddleware(['manager', 'admin']), integrationController.fetchDeliveryOrders);

module.exports = router;


// Conteúdo de: .\orderRoutes.js
// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rotas para pedidos

// Rota para criar um novo pedido
router.post('/', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.createOrder);

// Rota para obter todos os pedidos
router.get('/', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.getOrders);

// Rota para obter um pedido por ID
router.get('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.getOrderById);

// Rota para atualizar o status de um pedido
router.put('/:id/status', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.updateOrderStatus);

// **Nova Rota para Atualizar Pedido Completo**
router.put('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.updateOrder);

// Rota para excluir um pedido
router.delete('/:id', authMiddleware, roleMiddleware(['Gerente', 'Cozinheiro', 'Garçom', 'admin']), orderController.deleteOrder);

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
  permissionMiddleware(['viewProduct']), // Ajuste as permissões conforme necessário
  productController.checkNomeDuplicado
);

// **Nova Rota para Busca Avançada - Deve Vir Antes das Rotas Dinâmicas**
router.get(
  '/advanced',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProductsAdvanced
);

// Criar produto - requer a permissão 'createProduct'
router.post(
  '/',
  authMiddleware,
  permissionMiddleware(['createProduct']),
  productController.createProduct
);

// Obter todos os produtos - requer a permissão 'viewProduct'
router.get(
  '/',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProducts
);

// Obter produto por ID - requer a permissão 'viewProduct'
router.get(
  '/:productId',
  authMiddleware,
  permissionMiddleware(['viewProduct']),
  productController.getProductById
);

// Atualizar produto - requer a permissão 'editProduct'
router.put(
  '/:productId',
  authMiddleware,
  permissionMiddleware(['editProduct']),
  productController.updateProduct
);

// Deletar produto - requer a permissão 'deleteProduct'
router.delete(
  '/:productId',
  authMiddleware,
  permissionMiddleware(['deleteProduct']),
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
const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

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
  authMiddleware, roleMiddleware(['admin', 'manager']), userController.updateUser
  // Aqui não limitamos a role diretamente, pois a lógica está no controller.
  // Mas se quiser, pode permitir apenas admin e manager:
  // roleMiddleware(['admin', 'manager'])
);

router.get('/me', authMiddleware, userController.getMe);


router.get(
  '/employees/list',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  async (req, res) => {
    try {
      const employees = await User.find({ role: { $in: ['manager', 'agent'] } }).select('nome email');
      res.json(employees);
    } catch (error) {
      console.error('Erro ao obter funcionários:', error);
      res.status(500).json({ message: 'Erro ao obter funcionários', error: error.message });
    }
  }
);

module.exports = router;


