// seed.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

// Importar os modelos
const Ambiente = require('./models/Ambiente');
const Table = require('./models/Table');
const Reservation = require('./models/Reservation');
const Customer = require('./models/Customer');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');
const SalesGoal = require('./models/SalesGoal');
const Ingredient = require('./models/Ingredient');
const Recipe = require('./models/Recipe');
const AuditLog = require('./models/AuditLog');

// Carregar variáveis de ambiente
dotenv.config();

// Função principal para semear o banco de dados
async function seedDatabase() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado ao MongoDB para seed');

    // Limpar as coleções existentes
    await Ambiente.deleteMany({});
    await Table.deleteMany({});
    await Reservation.deleteMany({});
    await Customer.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    await SalesGoal.deleteMany({});
    await Ingredient.deleteMany({});
    await Recipe.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Coleções limpas com sucesso.');

    // Inserir categorias
    const categoriesData = [
      { categoria: 'Bebidas', descricao: 'Todas as bebidas disponíveis', habilitado: true },
      { categoria: 'Entradas', descricao: 'Pratos de entrada', habilitado: true },
      { categoria: 'Pratos Principais', descricao: 'Pratos principais', habilitado: true },
      { categoria: 'Sobremesas', descricao: 'Sobremesas deliciosas', habilitado: true },
      { categoria: 'Especialidades da Casa', descricao: 'Pratos exclusivos do chef', habilitado: true },
      { categoria: 'Vegano', descricao: 'Opções veganas', habilitado: true },
      { categoria: 'Sem Glúten', descricao: 'Opções sem glúten', habilitado: true },
      { categoria: 'Combos', descricao: 'Combos especiais', habilitado: true },
    ];

    const categories = await Category.insertMany(categoriesData);
    console.log('Categorias inseridas:', categories.length);

    // Inserir ingredientes
    const ingredientsData = [
      { nome: 'Tomate', unidadeMedida: 'kg', quantidadeEstoque: 100, precoCusto: 5.0 },
      { nome: 'Cebola', unidadeMedida: 'kg', quantidadeEstoque: 80, precoCusto: 3.0 },
      { nome: 'Alho', unidadeMedida: 'kg', quantidadeEstoque: 50, precoCusto: 7.0 },
      { nome: 'Frango', unidadeMedida: 'kg', quantidadeEstoque: 60, precoCusto: 20.0 },
      { nome: 'Carne Bovina', unidadeMedida: 'kg', quantidadeEstoque: 40, precoCusto: 30.0 },
      { nome: 'Batata', unidadeMedida: 'kg', quantidadeEstoque: 90, precoCusto: 4.0 },
      { nome: 'Arroz', unidadeMedida: 'kg', quantidadeEstoque: 150, precoCusto: 2.5 },
      { nome: 'Feijão', unidadeMedida: 'kg', quantidadeEstoque: 120, precoCusto: 3.5 },
      { nome: 'Leite', unidadeMedida: 'litro', quantidadeEstoque: 200, precoCusto: 4.5 },
      { nome: 'Ovo', unidadeMedida: 'unidade', quantidadeEstoque: 500, precoCusto: 0.5 },
      { nome: 'Farinha de Trigo', unidadeMedida: 'kg', quantidadeEstoque: 100, precoCusto: 3.0 },
      { nome: 'Açúcar', unidadeMedida: 'kg', quantidadeEstoque: 80, precoCusto: 2.0 },
      { nome: 'Manteiga', unidadeMedida: 'kg', quantidadeEstoque: 60, precoCusto: 10.0 },
      { nome: 'Queijo', unidadeMedida: 'kg', quantidadeEstoque: 70, precoCusto: 15.0 },
      { nome: 'Sal', unidadeMedida: 'kg', quantidadeEstoque: 200, precoCusto: 1.0 },
      { nome: 'Pimenta', unidadeMedida: 'kg', quantidadeEstoque: 50, precoCusto: 8.0 },
      { nome: 'Manjericão', unidadeMedida: 'kg', quantidadeEstoque: 30, precoCusto: 12.0 },
      { nome: 'Limão', unidadeMedida: 'kg', quantidadeEstoque: 60, precoCusto: 4.0 },
      { nome: 'Espinafre', unidadeMedida: 'kg', quantidadeEstoque: 40, precoCusto: 6.0 },
      { nome: 'Cogumelos', unidadeMedida: 'kg', quantidadeEstoque: 35, precoCusto: 18.0 },
      { nome: 'Pimentão', unidadeMedida: 'kg', quantidadeEstoque: 55, precoCusto: 5.5 },
      { nome: 'Azeite', unidadeMedida: 'litro', quantidadeEstoque: 100, precoCusto: 20.0 },
      { nome: 'Vinho Tinto', unidadeMedida: 'litro', quantidadeEstoque: 50, precoCusto: 25.0 },
      { nome: 'Vinho Branco', unidadeMedida: 'litro', quantidadeEstoque: 50, precoCusto: 22.0 },
      { nome: 'Cerveja', unidadeMedida: 'unidade', quantidadeEstoque: 300, precoCusto: 3.0 },
      { nome: 'Refrigerante', unidadeMedida: 'litro', quantidadeEstoque: 150, precoCusto: 4.0 },
      { nome: 'Suco de Laranja', unidadeMedida: 'litro', quantidadeEstoque: 100, precoCusto: 5.0 },
      { nome: 'Suco de Maçã', unidadeMedida: 'litro', quantidadeEstoque: 100, precoCusto: 5.0 },
      { nome: 'Melancia', unidadeMedida: 'kg', quantidadeEstoque: 40, precoCusto: 7.0 },
      { nome: 'Abacaxi', unidadeMedida: 'kg', quantidadeEstoque: 30, precoCusto: 6.5 },
      { nome: 'Morango', unidadeMedida: 'kg', quantidadeEstoque: 25, precoCusto: 12.0 },
      { nome: 'Banana', unidadeMedida: 'kg', quantidadeEstoque: 80, precoCusto: 3.0 },
      { nome: 'Maçã', unidadeMedida: 'kg', quantidadeEstoque: 70, precoCusto: 4.0 },
      // Ingredientes faltantes
      { nome: 'Alface', unidadeMedida: 'kg', quantidadeEstoque: 50, precoCusto: 4.0 },
      { nome: 'Parmesão', unidadeMedida: 'kg', quantidadeEstoque: 20, precoCusto: 15.0 },
      { nome: 'Camarão', unidadeMedida: 'kg', quantidadeEstoque: 40, precoCusto: 25.0 },
      { nome: 'Café', unidadeMedida: 'kg', quantidadeEstoque: 25, precoCusto: 10.0 },
      // Adicione mais ingredientes conforme necessário
    ];

    const ingredients = await Ingredient.insertMany(ingredientsData);
    console.log('Ingredientes inseridos:', ingredients.length);

    // Inserir receitas
    const recipesData = [
      {
        nome: 'Salada Caesar',
        categoria: 'Entradas',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Alho')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Cebola')._id, quantidade: 0.1 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Alface')._id, quantidade: 0.2 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Parmesão')._id, quantidade: 0.05 },
        ],
        precoVenda: 15.0,
        descricao: 'Salada clássica com alface, parmesão e molho Caesar.',
      },
      {
        nome: 'Bife Ancho',
        categoria: 'Pratos Principais',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Carne Bovina')._id, quantidade: 0.3 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Sal')._id, quantidade: 0.01 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Pimenta')._id, quantidade: 0.005 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Azeite')._id, quantidade: 0.02 },
        ],
        precoVenda: 35.0,
        descricao: 'Bife Ancho grelhado com sal e pimenta.',
      },
      {
        nome: 'Risoto de Camarão',
        categoria: 'Pratos Principais',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Arroz')._id, quantidade: 0.2 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Camarão')._id, quantidade: 0.25 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Alho')._id, quantidade: 0.02 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Cebola')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Vinho Branco')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Azeite')._id, quantidade: 0.03 },
        ],
        precoVenda: 30.0,
        descricao: 'Risoto cremoso com camarões frescos.',
      },
      {
        nome: 'Frango à Parmegiana',
        categoria: 'Pratos Principais',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Frango')._id, quantidade: 0.25 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Tomate')._id, quantidade: 0.1 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Queijo')._id, quantidade: 0.1 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Farinha de Trigo')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Ovo')._id, quantidade: 2 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Azeite')._id, quantidade: 0.02 },
        ],
        precoVenda: 28.0,
        descricao: 'Peito de frango empanado com molho de tomate e queijo derretido.',
      },
      {
        nome: 'Tiramisu',
        categoria: 'Sobremesas',
        ingredientes: [
          { ingrediente: ingredients.find(ing => ing.nome === 'Ovo')._id, quantidade: 3 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Açúcar')._id, quantidade: 0.1 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Farinha de Trigo')._id, quantidade: 0.05 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Café')._id, quantidade: 0.2 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Azeite')._id, quantidade: 0.01 },
          { ingrediente: ingredients.find(ing => ing.nome === 'Queijo')._id, quantidade: 0.15 },
        ],
        precoVenda: 18.0,
        descricao: 'Sobremesa italiana clássica com camadas de queijo mascarpone e café.',
      },
      // Adicione mais receitas conforme necessário
    ];

    const recipes = await Recipe.insertMany(recipesData);
    console.log('Receitas inseridas:', recipes.length);

    // Inserir produtos
    const productsData = [
      { nome: 'Coca-Cola', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 5.0, descricao: 'Refrigerante Coca-Cola 350ml', disponivel: true, quantidadeEstoque: 200 },
      { nome: 'Suco de Laranja Natural', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 6.5, descricao: 'Suco de laranja natural 500ml', disponivel: true, quantidadeEstoque: 150 },
      { nome: 'Água Mineral', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 3.0, descricao: 'Água mineral sem gás 500ml', disponivel: true, quantidadeEstoque: 300 },
      { nome: 'Salada Caesar', categoria: categories.find(cat => cat.categoria === 'Entradas')._id, preco: 15.0, descricao: 'Salada Caesar com croutons e parmesão', disponivel: true, quantidadeEstoque: 80 },
      { nome: 'Bruschetta', categoria: categories.find(cat => cat.categoria === 'Entradas')._id, preco: 12.0, descricao: 'Bruschetta tradicional com tomate e manjericão', disponivel: true, quantidadeEstoque: 60 },
      { nome: 'Sopa de Abóbora', categoria: categories.find(cat => cat.categoria === 'Entradas')._id, preco: 14.0, descricao: 'Sopa cremosa de abóbora com gengibre', disponivel: true, quantidadeEstoque: 70 },
      { nome: 'Bife Ancho', categoria: categories.find(cat => cat.categoria === 'Pratos Principais')._id, preco: 35.0, descricao: 'Bife Ancho grelhado ao ponto', disponivel: true, quantidadeEstoque: 50 },
      { nome: 'Risoto de Camarão', categoria: categories.find(cat => cat.categoria === 'Pratos Principais')._id, preco: 30.0, descricao: 'Risoto cremoso com camarões frescos', disponivel: true, quantidadeEstoque: 45 },
      { nome: 'Frango à Parmegiana', categoria: categories.find(cat => cat.categoria === 'Pratos Principais')._id, preco: 28.0, descricao: 'Peito de frango empanado com molho de tomate e queijo', disponivel: true, quantidadeEstoque: 60 },
      { nome: 'Tiramisu', categoria: categories.find(cat => cat.categoria === 'Sobremesas')._id, preco: 18.0, descricao: 'Sobremesa italiana com camadas de queijo mascarpone e café', disponivel: true, quantidadeEstoque: 40 },
      { nome: 'Pudim de Leite', categoria: categories.find(cat => cat.categoria === 'Sobremesas')._id, preco: 16.0, descricao: 'Pudim de leite cremoso', disponivel: true, quantidadeEstoque: 50 },
      { nome: 'Cheesecake', categoria: categories.find(cat => cat.categoria === 'Sobremesas')._id, preco: 20.0, descricao: 'Cheesecake com cobertura de frutas vermelhas', disponivel: true, quantidadeEstoque: 35 },
      { nome: 'Prato Especial do Chef', categoria: categories.find(cat => cat.categoria === 'Especialidades da Casa')._id, preco: 40.0, descricao: 'Prato exclusivo preparado pelo chef', disponivel: true, quantidadeEstoque: 25 },
      { nome: 'Lasanha Trufada', categoria: categories.find(cat => cat.categoria === 'Especialidades da Casa')._id, preco: 38.0, descricao: 'Lasanha com molho trufado e cogumelos', disponivel: true, quantidadeEstoque: 30 },
      { nome: 'Polvo à Lagareiro', categoria: categories.find(cat => cat.categoria === 'Especialidades da Casa')._id, preco: 45.0, descricao: 'Polvo assado com batatas e azeite', disponivel: true, quantidadeEstoque: 20 },
      { nome: 'Espinafre ao Alho', categoria: categories.find(cat => cat.categoria === 'Vegano')._id, preco: 12.0, descricao: 'Espinafre refogado com alho e azeite', disponivel: true, quantidadeEstoque: 50 },
      { nome: 'Risoto Vegano', categoria: categories.find(cat => cat.categoria === 'Vegano')._id, preco: 25.0, descricao: 'Risoto vegano com legumes frescos', disponivel: true, quantidadeEstoque: 30 },
      { nome: 'Salada Sem Glúten', categoria: categories.find(cat => cat.categoria === 'Sem Glúten')._id, preco: 14.0, descricao: 'Salada fresca sem ingredientes com glúten', disponivel: true, quantidadeEstoque: 40 },
      { nome: 'Pizza Vegana', categoria: categories.find(cat => cat.categoria === 'Sem Glúten')._id, preco: 22.0, descricao: 'Pizza vegana com massa sem glúten', disponivel: true, quantidadeEstoque: 35 },
      { nome: 'Combo Família', categoria: categories.find(cat => cat.categoria === 'Combos')._id, preco: 80.0, descricao: 'Combo para família com entradas, pratos principais e sobremesas', disponivel: true, quantidadeEstoque: 20 },
      { nome: 'Combo Amigos', categoria: categories.find(cat => cat.categoria === 'Combos')._id, preco: 60.0, descricao: 'Combo para amigos com diversas opções de pratos', disponivel: true, quantidadeEstoque: 25 },
      { nome: 'Cerveja Long Neck', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 3.0, descricao: 'Cerveja Long Neck 330ml', disponivel: true, quantidadeEstoque: 300 },
      { nome: 'Vinho Rosé', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 28.0, descricao: 'Vinho rosé 750ml', disponivel: true, quantidadeEstoque: 40 },
      { nome: 'Espumante Brut', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 35.0, descricao: 'Espumante brut 750ml', disponivel: true, quantidadeEstoque: 30 },
      { nome: 'Whisky', categoria: categories.find(cat => cat.categoria === 'Bebidas')._id, preco: 50.0, descricao: 'Whisky envelhecido 1 ano', disponivel: true, quantidadeEstoque: 25 },
      // Adicione mais produtos conforme necessário
    ];

    const products = await Product.insertMany(productsData);
    console.log('Produtos inseridos:', products.length);

    // Inserir ambientes
    const ambientesData = [
      { nome: 'Sala Principal', limitePessoas: 50 },
      { nome: 'Terraço', limitePessoas: 30 },
      { nome: 'Salão Privativo', limitePessoas: 20 },
      { nome: 'Bar', limitePessoas: 25 },
      { nome: 'Cozinha', limitePessoas: 10 },
      { nome: 'Banheiro Masculino', limitePessoas: 10 },
      { nome: 'Banheiro Feminino', limitePessoas: 10 },
    ];

    const ambientes = await Ambiente.insertMany(ambientesData);
    console.log('Ambientes inseridos:', ambientes.length);

    // Inserir mesas
    const tablesData = [
      { numeroMesa: 1, ambiente: ambientes.find(a => a.nome === 'Sala Principal')._id, position: { x: 10, y: 20 }, numeroAssentos: 4 },
      { numeroMesa: 2, ambiente: ambientes.find(a => a.nome === 'Sala Principal')._id, position: { x: 30, y: 20 }, numeroAssentos: 4 },
      { numeroMesa: 3, ambiente: ambientes.find(a => a.nome === 'Terraço')._id, position: { x: 10, y: 50 }, numeroAssentos: 6 },
      { numeroMesa: 4, ambiente: ambientes.find(a => a.nome === 'Salão Privativo')._id, position: { x: 50, y: 20 }, numeroAssentos: 8 },
      { numeroMesa: 5, ambiente: ambientes.find(a => a.nome === 'Bar')._id, position: { x: 70, y: 20 }, numeroAssentos: 2 },
      { numeroMesa: 6, ambiente: ambientes.find(a => a.nome === 'Bar')._id, position: { x: 90, y: 20 }, numeroAssentos: 2 },
      { numeroMesa: 7, ambiente: ambientes.find(a => a.nome === 'Sala Principal')._id, position: { x: 110, y: 20 }, numeroAssentos: 4 },
      { numeroMesa: 8, ambiente: ambientes.find(a => a.nome === 'Sala Principal')._id, position: { x: 130, y: 20 }, numeroAssentos: 4 },
      { numeroMesa: 9, ambiente: ambientes.find(a => a.nome === 'Terraço')._id, position: { x: 10, y: 80 }, numeroAssentos: 6 },
      { numeroMesa: 10, ambiente: ambientes.find(a => a.nome === 'Salão Privativo')._id, position: { x: 150, y: 20 }, numeroAssentos: 8 },
      // Adicione mais mesas conforme necessário
    ];

    const tables = await Table.insertMany(tablesData);
    console.log('Mesas inseridas:', tables.length);

    // Inserir clientes
    const customersData = [
      { nome: 'João Silva', cpf: '123.456.789-00', email: 'joao@example.com', telefone: '11999999999' },
      { nome: 'Maria Souza', cpf: '987.654.321-00', email: 'maria@example.com', telefone: '11888888888' },
      { nome: 'Pedro Oliveira', cpf: '456.789.123-00', email: 'pedro@example.com', telefone: '11777777777' },
      { nome: 'Ana Paula', cpf: '321.654.987-00', email: 'ana@example.com', telefone: '11666666666' },
      { nome: 'Carlos Alberto', cpf: '654.321.789-00', email: 'carlos@example.com', telefone: '11555555555' },
      { nome: 'Fernanda Lima', cpf: '789.123.456-00', email: 'fernanda@example.com', telefone: '11444444444' },
      { nome: 'Ricardo Dias', cpf: '147.258.369-00', email: 'ricardo@example.com', telefone: '11333333333' },
      { nome: 'Patrícia Gomes', cpf: '369.258.147-00', email: 'patricia@example.com', telefone: '11222222222' },
      { nome: 'Lucas Martins', cpf: '258.147.369-00', email: 'lucas@example.com', telefone: '11111111111' },
      { nome: 'Juliana Costa', cpf: '159.753.486-00', email: 'juliana@example.com', telefone: '11000000000' },
    ];

    const customers = await Customer.insertMany(customersData);
    console.log('Clientes inseridos:', customers.length);

    // Inserir usuários (administradores, gerentes, agentes, feeders)
    const hashedPasswordAdmin = await bcrypt.hash('mzgxdyj8', 10); // Senha para admin
    const hashedPasswordUsers = await bcrypt.hash('senha123', 10); // Senhas padrão para outros usuários

    const usersData = [
      {
        nome: 'AGB Junior',
        email: 'agb_junior@live.com',
        senha: 'mzgxdyj8',
        role: 'admin',
        permissions: ['*'], // Acesso total
      },
      {
        nome: 'Gerente Maria',
        email: 'gerente_maria@example.com',
        senha: 'senha123',
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
        senha: 'senha123',
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
        senha: 'senha123',
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
        senha: 'senha123',
        role: 'feeder',
        permissions: [
          'viewProduct',
        ],
        manager: null,
      },
      {
        nome: 'Gerente Carlos',
        email: 'gerente_carlos@example.com',
        senha: 'senha123',
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
        nome: 'Agente Lucas',
        email: 'agente_lucas@example.com',
        senha: 'senha123',
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
        senha: 'senha123',
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
        senha: 'senha123',
        role: 'feeder',
        permissions: [
          'viewProduct',
        ],
        manager: null,
      },
      {
        nome: 'Agente Ricardo',
        email: 'agente_ricardo@example.com',
        senha: 'senha123',
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
        senha: 'senha123',
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

    // Distribuir agentes entre os gerentes
    agentes.forEach((agente, index) => {
      const gerente = index % 2 === 0 ? gerenteMaria : gerenteCarlos;
      agente.manager = gerente._id;
      agente.save();
    });

    // Distribuir feeders entre os gerentes
    feeders.forEach((feeder, index) => {
      const gerente = index % 2 === 0 ? gerenteMaria : gerenteCarlos;
      feeder.manager = gerente._id;
      feeder.save();
    });

    console.log('Agentes e feeders associados aos gerentes.');

    // Inserir metas de vendas
    const salesGoalsData = [
      {
        employee: users.find(user => user.email === 'agente_joao@example.com')._id,
        manager: gerenteMaria._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 5000.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_ana@example.com')._id,
        manager: gerenteMaria._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4500.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_lucas@example.com')._id,
        manager: gerenteCarlos._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4800.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_juliana@example.com')._id,
        manager: gerenteCarlos._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4700.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_ricardo@example.com')._id,
        manager: gerenteMaria._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4900.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
      {
        employee: users.find(user => user.email === 'agente_patricia@example.com')._id,
        manager: gerenteCarlos._id,
        goalName: 'Meta de Vendas de Abril',
        goalAmount: 4600.0,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
      },
    ];

    const salesGoals = await SalesGoal.insertMany(salesGoalsData);
    console.log('Metas de Vendas inseridas:', salesGoals.length);

    // Inserir reservas
    const reservationsData = [
      {
        cliente: customers.find(c => c.email === 'joao@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 1).id,
        dataReserva: new Date('2024-04-15T19:00:00'),
        numeroPessoas: 4,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'maria@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 3).id,
        dataReserva: new Date('2024-04-16T20:30:00'),
        numeroPessoas: 6,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'pedro@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 5).id,
        dataReserva: new Date('2024-04-17T18:00:00'),
        numeroPessoas: 2,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'ana@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 2).id,
        dataReserva: new Date('2024-04-18T19:30:00'),
        numeroPessoas: 4,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'carlos@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 4).id,
        dataReserva: new Date('2024-04-19T20:00:00'),
        numeroPessoas: 8,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'fernanda@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 6).id,
        dataReserva: new Date('2024-04-20T21:00:00'),
        numeroPessoas: 2,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'ricardo@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 7).id,
        dataReserva: new Date('2024-04-21T19:00:00'),
        numeroPessoas: 4,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'patricia@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 8).id,
        dataReserva: new Date('2024-04-22T20:30:00'),
        numeroPessoas: 4,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'lucas@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 9).id,
        dataReserva: new Date('2024-04-23T18:00:00'),
        numeroPessoas: 6,
        status: 'ativa',
      },
      {
        cliente: customers.find(c => c.email === 'juliana@example.com')._id,
        mesa: tables.find(t => t.numeroMesa === 10).id,
        dataReserva: new Date('2024-04-24T19:30:00'),
        numeroPessoas: 8,
        status: 'ativa',
      },
    ];

    const reservations = await Reservation.insertMany(reservationsData);
    console.log('Reservas inseridas:', reservations.length);

    console.log('Banco de dados semeado com sucesso!');
    process.exit();
  } catch (error) {
    console.error('Erro ao semear o banco de dados:', error);
    process.exit(1);
  }
}

// Executar a função principal
seedDatabase();
