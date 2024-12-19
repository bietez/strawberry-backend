// seed.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

// Importar o modelo User
const User = require('./models/User');

// Carregar variáveis de ambiente
dotenv.config();

// Função principal para semear a coleção de usuários
async function seedUsers() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado ao MongoDB para seed de Users');

    // Limpar a coleção de Users
    await User.deleteMany({});
    console.log('Coleção de Users limpa com sucesso.');

    // Hash das senhas
    const hashedPasswordAdmin = await bcrypt.hash('mzgxdyj8', 10); // Senha para admin
    const hashedPasswordUsers = await bcrypt.hash('senha123', 10); // Senhas padrão para outros usuários

    // Inserir usuários (administradores, gerentes, agentes, feeders)
    const usersData = [
      {
        nome: 'Andre Biete',
        email: 'agb_junior@live.com',
        senha: hashedPasswordAdmin,
        role: 'admin',
        permissions: ['*'], // Acesso total
      },
      {
        nome: 'Gerente Maria',
        email: 'gerente_maria@example.com',
        senha: hashedPasswordUsers,
        role: 'manager',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createProduct',
          'editProduct',
          'deleteProduct',
          'viewCustomer',
          'createCustomer',
          'editCustomer',
          'deleteCustomer',
          'viewEmployee',
          'createEmployee',
          'editEmployee',
          'deleteEmployee',
          'viewIngredient',
          'createIngredient',
          'editIngredient',
          'deleteIngredient',
          'viewRecipe',
          'createRecipe',
          'editRecipe',
          'deleteRecipe',
          'createOrder',
          'manageStock',
          'viewReports',
          'processPayment',
          'viewAmbiente',
          'createAmbiente',
          'editAmbiente',
          'deleteAmbiente',
          'viewTable',
          'createTable',
          'editTable',
          'deleteTable',
          'viewReservation',
          'createReservation',
          'editReservation',
          'deleteReservation',
          'manageIfoodAuth',
          'createCategory',
          'viewCategory',
          'editCategory',
          'deleteCategory',
          'addUser',
          'manageSalesGoals',
          'viewTeamMembers',
        ],
      },
      {
        nome: 'Gerente Carlos',
        email: 'gerente_carlos@example.com',
        senha: hashedPasswordUsers,
        role: 'manager',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createProduct',
          'editProduct',
          'deleteProduct',
          'viewCustomer',
          'createCustomer',
          'editCustomer',
          'deleteCustomer',
          'viewEmployee',
          'createEmployee',
          'editEmployee',
          'deleteEmployee',
          'viewIngredient',
          'createIngredient',
          'editIngredient',
          'deleteIngredient',
          'viewRecipe',
          'createRecipe',
          'editRecipe',
          'deleteRecipe',
          'createOrder',
          'manageStock',
          'viewReports',
          'processPayment',
          'viewAmbiente',
          'createAmbiente',
          'editAmbiente',
          'deleteAmbiente',
          'viewTable',
          'createTable',
          'editTable',
          'deleteTable',
          'viewReservation',
          'createReservation',
          'editReservation',
          'deleteReservation',
          'manageIfoodAuth',
          'createCategory',
          'viewCategory',
          'editCategory',
          'deleteCategory',
          'addUser',
          'manageSalesGoals',
          'viewTeamMembers',
        ],
      },
      {
        nome: 'Agente João',
        email: 'agente_joao@example.com',
        senha: hashedPasswordUsers,
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null, // Será associado posteriormente
      },
      {
        nome: 'Agente Ana',
        email: 'agente_ana@example.com',
        senha: hashedPasswordUsers,
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
      {
        nome: 'Feeder Pedro',
        email: 'feeder_pedro@example.com',
        senha: hashedPasswordUsers,
        role: 'feeder',
        permissions: [
          'viewProduct',
        ],
        manager: null,
      },
      {
        nome: 'Agente Lucas',
        email: 'agente_lucas@example.com',
        senha: hashedPasswordUsers,
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
      {
        nome: 'Agente Juliana',
        email: 'agente_juliana@example.com',
        senha: hashedPasswordUsers,
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
      {
        nome: 'Feeder Fernanda',
        email: 'feeder_fernanda@example.com',
        senha: hashedPasswordUsers,
        role: 'feeder',
        permissions: [
          'viewProduct',
        ],
        manager: null,
      },
      {
        nome: 'Agente Ricardo',
        email: 'agente_ricardo@example.com',
        senha: hashedPasswordUsers,
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
      {
        nome: 'Agente Patrícia',
        email: 'agente_patricia@example.com',
        senha: hashedPasswordUsers,
        role: 'agent',
        permissions: [
          'viewDashboard',
          'viewProduct',
          'createOrder',
          'processPayment',
          'viewAmbiente',
          'viewTable',
          'viewReservation',
          'manageSalesGoals',
        ],
        manager: null,
      },
    ];

    // Inserir os usuários
    const users = await User.insertMany(usersData);
    console.log('Usuários inseridos:', users.length);

    // Associar agentes e feeders aos gerentes
    const gerentes = users.filter(user => user.role === 'manager');
    const agentes = users.filter(user => user.role === 'agent');
    const feeders = users.filter(user => user.role === 'feeder');

    if (gerentes.length === 0) {
      throw new Error('Nenhum gerente encontrado para associar os agentes e feeders.');
    }

    const gerenteMaria = gerentes.find(g => g.email === 'gerente_maria@example.com');
    const gerenteCarlos = gerentes.find(g => g.email === 'gerente_carlos@example.com');

    if (!gerenteMaria || !gerenteCarlos) {
      throw new Error('Gerentes específicos não encontrados.');
    }

    // Distribuir agentes entre os gerentes
    for (let i = 0; i < agentes.length; i++) {
      const agente = agentes[i];
      const gerente = (i % 2 === 0) ? gerenteMaria : gerenteCarlos;
      agente.manager = gerente._id;
      await agente.save();
    }

    // Distribuir feeders entre os gerentes
    for (let i = 0; i < feeders.length; i++) {
      const feeder = feeders[i];
      const gerente = (i % 2 === 0) ? gerenteMaria : gerenteCarlos;
      feeder.manager = gerente._id;
      await feeder.save();
    }

    console.log('Agentes e feeders associados aos gerentes.');

    console.log('Banco de dados de Users semeado com sucesso!');
    process.exit();
  } catch (error) {
    console.error('Erro ao semear o banco de dados de Users:', error);
    process.exit(1);
  }
}

// Executar a função principal
seedUsers();
