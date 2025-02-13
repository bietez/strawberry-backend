const mongoose = require('mongoose');
const SalesGoal = require('../models/SalesGoal');
const User = require('../models/User');
const Product = require('../models/Product');
const FinalizedTable = require('../models/FinalizedTable');
const PDFDocument = require('pdfkit');
const pdfUtil = require('../utils/pdfUtil'); // Ajuste o caminho se precisar


exports.exportSalesGoalsPDF = async (req, res) => {
  try {
    // Parâmetros de filtro
    const { status, employeeId, dataInicial, dataFinal } = req.query;

    // Monta filter
    const filter = {};
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;
    // Se quiser filtrar pelo período, depende de como você trata datas no model:
    if (dataInicial || dataFinal) {
      filter.startDate = {};
      if (dataInicial) {
        filter.startDate.$gte = new Date(dataInicial);
      }
      if (dataFinal) {
        const dt = new Date(dataFinal);
        dt.setHours(23, 59, 59, 999);
        filter.startDate.$lte = dt;
      }
    }

    // Buscar metas populadas
    const salesGoals = await SalesGoal.find(filter)
      .populate('employee', 'nome')
      .populate('manager', 'nome')
      .populate('product', 'nome')
      .exec();

    if (!salesGoals || salesGoals.length === 0) {
      return res.status(404).json({ message: 'Nenhuma meta encontrada para exportar.' });
    }

    // Gerar PDF em disco
    const pdfRelativePath = await pdfUtil.createSalesGoalsPDF(salesGoals);
    // Ex: "/conferences/salesGoals_1673029494382.pdf" ou outro caminho

    return res.json({
      message: 'PDF gerado com sucesso!',
      url: pdfRelativePath, // Este é o path que o frontend poderá abrir via http://host:8000 + pdfRelativePath
    });

  } catch (err) {
    console.error('Erro ao exportar PDF de SalesGoals:', err);
    return res.status(500).json({ message: 'Falha ao gerar PDF das Metas.', error: err.message });
  }
};


// ----------------------------------------------------
// 2. Criar nova meta de vendas
// ----------------------------------------------------
exports.createSalesGoal = async (req, res) => {
  try {
    const {
      employeeId,
      productId,
      goalName,
      goalAmount,
      startDate,
      endDate,
      // Caso queira vir "status" do front, descomente:
      // status,
    } = req.body;

    // Supondo que req.user é o manager
    // ou que iremos definir manager fixo se for "admin"
    // ajustando a lógica como preferir:
    const managerId = req.user ? req.user.id : null;

    if (!managerId) {
      return res.status(403).json({ message: 'Somente usuários autenticados podem criar metas.' });
    }

    // Verifica se employee e product existem
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Funcionário não encontrado' });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Start/end date
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: 'startDate deve ser antes de endDate',
      });
    }

    const newGoal = new SalesGoal({
      employee: employeeId,
      manager: managerId, // se seu schema exige
      product: productId,
      goalName,
      goalAmount,
      startDate: startDate || null,
      endDate: endDate || null,
      // Se quiser fixar status inicial:
      status: 'em_andamento',
    });

    await newGoal.save();
    res.status(201).json({
      message: 'Meta de vendas criada com sucesso!',
      salesGoal: newGoal,
    });
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    res.status(500).json({ message: 'Erro ao criar meta', error: error.message });
  }
};


exports.getAdvancedSalesGoals = async (req, res) => {
  try {
    let { page = 1, limit = 10, dataInicial, dataFinal, status, employeeId } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    // Montar query base
    const query = {};

    // Se quiser filtrar por status
    if (status && ['em_andamento', 'alcancada', 'finalizada'].includes(status)) {
      query.status = status;
    }

    // Se quiser filtrar por funcionário
    if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
      query.employee = employeeId;
    }

    const total = await SalesGoal.countDocuments(query);

    // Buscar metas com paginação
    let salesGoals = await SalesGoal.find(query)
      .populate('employee')
      .populate('manager')
      .populate('product')
      .skip((page - 1) * limit)
      .limit(limit);

    // Montar filtro para FinalizedTable
    const filterFinalized = {};
    if (dataInicial || dataFinal) {
      filterFinalized.dataFinalizacao = {};
      if (dataInicial) {
        filterFinalized.dataFinalizacao.$gte = new Date(dataInicial);
      }
      if (dataFinal) {
        const dt = new Date(dataFinal);
        dt.setHours(23, 59, 59, 999);
        filterFinalized.dataFinalizacao.$lte = dt;
      }
    }

    // Buscar finalizedTables conforme o filtro
    const finalizedTables = await FinalizedTable.find(filterFinalized)
      .populate('garcomId', 'nome')
      .populate({
        path: 'pedidos',
        populate: { path: 'itens.product', model: 'Product' },
      });

    // Montar metas enriquecidas
    const enrichedGoals = salesGoals.map((goal) => {
      let totalSold = 0;

      // Verifica datas para a meta
      const metaInicio = goal.startDate || new Date(0);
      const metaFim = goal.endDate || new Date('9999-12-31');

      // Percorrer mesas finalizadas
      finalizedTables.forEach((table) => {
        // Validar se a dataFinalizacao está dentro do período da meta
        const df = new Date(table.dataFinalizacao);
        if (df >= metaInicio && df <= metaFim) {
          // Verifica se garcomId corresponde ao employee
          if (
            table.garcomId &&
            goal.employee &&
            String(table.garcomId._id) === String(goal.employee._id)
          ) {
            table.pedidos.forEach((pedido) => {
              if (pedido.itens && Array.isArray(pedido.itens)) {
                pedido.itens.forEach((item) => {
                  if (
                    item.product &&
                    goal.product &&
                    String(item.product._id) === String(goal.product._id)
                  ) {
                    const valor = (item.product.preco || 0) * (item.quantidade || 0);
                    totalSold += valor;
                  }
                });
              }
            });
          }
        }
      });

      // Calcula progress
      const progress = goal.goalAmount > 0
        ? (totalSold / goal.goalAmount) * 100
        : 0;

      // Inicializa updatedStatus com o status atual
      let updatedStatus = goal.status;
      const now = new Date();

      // **Nova Condição Adicionada:**
      // Se o status atual for 'alcancada', não altera mais
      if (goal.status !== 'alcancada') {
        if (progress >= 100) {
          // se a meta for >= 100% => alcancada
          updatedStatus = 'alcancada';
        } else {
          // se endDate já passou, mas progress < 100, => finalizada
          if (goal.endDate && now > goal.endDate) {
            updatedStatus = 'finalizada';
          } else {
            // senão => em_andamento
            updatedStatus = 'em_andamento';
          }
        }

        // Se o status atual (no BD) for diferente, atualiza no BD
        if (updatedStatus !== goal.status) {
          goal.status = updatedStatus;
          // Atualiza o doc no BD
          goal.save().catch(err => {
            console.error('Erro ao salvar status da meta:', err);
          });
        }
      }

      return {
        ...goal.toObject(),
        currentSales: +totalSold.toFixed(2),
        progress: +progress.toFixed(2),
      };
    });

    res.json({
      salesGoals: enrichedGoals,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Erro ao obter metas de vendas avançadas:', error);
    res.status(500).json({ message: 'Erro ao obter metas de vendas avançadas.' });
  }
};

exports.exportGoalsToPDF = async (req, res) => {
  try {
    // Parâmetros de filtro
    const { status, employeeId, dataInicial, dataFinal } = req.query;

    // Monta filter
    const filter = {};
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;
    // Filtrar pelo período
    if (dataInicial || dataFinal) {
      filter.startDate = {};
      if (dataInicial) {
        filter.startDate.$gte = new Date(dataInicial);
      }
      if (dataFinal) {
        const dt = new Date(dataFinal);
        dt.setHours(23, 59, 59, 999);
        filter.startDate.$lte = dt;
      }
    }

    // Buscar metas populadas
    const salesGoals = await SalesGoal.find(filter)
      .populate('employee', 'nome')
      .populate('manager', 'nome')
      .populate('product', 'nome')
      .exec();

    if (!salesGoals || salesGoals.length === 0) {
      return res.status(404).json({ message: 'Nenhuma meta encontrada para exportar.' });
    }

    // Buscar todas as mesas finalizadas que correspondem às metas
    const finalizedTables = await FinalizedTable.find({
      'pedidos.product': { $in: salesGoals.map(goal => goal.product) },
      dataFinalizacao: dataFinal ? { $lte: new Date(dataFinal) } : undefined,
      // Você pode adicionar mais filtros conforme necessário
    })
    .populate({
      path: 'pedidos.itens.product',
      model: 'Product',
    })
    .populate('garcomId')
    .exec();

    // Calcular 'currentSales' e 'progress' para cada meta
    const enrichedSalesGoals = salesGoals.map(goal => {
      let totalSold = 0;

      finalizedTables.forEach(table => {
        if (
          table.garcomId &&
          String(table.garcomId._id) === String(goal.employee._id)
        ) {
          table.pedidos.forEach(pedido => {
            pedido.itens.forEach(item => {
              if (
                item.product &&
                String(item.product._id) === String(goal.product._id)
              ) {
                const valorItem = (item.product.preco || 0) * (item.quantidade || 0);
                totalSold += valorItem;
              }
            });
          });
        }
      });

      const progress = goal.goalAmount > 0
        ? (totalSold / goal.goalAmount) * 100
        : 0;

      return {
        ...goal.toObject(),
        currentSales: parseFloat(totalSold.toFixed(2)),
        progress: parseFloat(progress.toFixed(2)),
      };
    });

    // Gerar PDF utilizando o utilitário
    const pdfRelativePath = await pdfUtil.createSalesGoalsPDF(enrichedSalesGoals);
    // Exemplo: "/sales-goal/salesGoals_1673029494382.pdf"

    return res.json({
      message: 'PDF gerado com sucesso!',
      url: pdfRelativePath, // O frontend poderá acessar via http://host:8000 + pdfRelativePath
    });

  } catch (err) {
    console.error('Erro ao exportar PDF de SalesGoals:', err);
    return res.status(500).json({ message: 'Falha ao gerar PDF das Metas.', error: err.message });
  }
};

exports.getSalesGoalsByEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Se não for admin e user.id != id => 403
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    const salesGoals = await SalesGoal.find({ employee: id }).populate('employee manager product');
    res.json(salesGoals);
  } catch (error) {
    console.error('Erro ao obter metas de vendas do funcionário:', error);
    res.status(500).json({ message: 'Erro ao obter metas de vendas do funcionário.' });
  }
};

/**
 * GET /sales-goals/:id/details
 * Retorna detalhes de uma meta específica, incluindo:
 *  - totalSold (valor total vendido para essa meta)
 *  - últimas 10 vendas (cada venda com date e amount)
 */
exports.getSalesGoalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const salesGoal = await SalesGoal.findById(id)
      .populate('employee')
      .populate('product');
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }

    // Opcional: filtrar por dataInicial e dataFinal
    const { dataInicial, dataFinal } = req.query;
    const filter = {};
    if (dataInicial || dataFinal) {
      filter.dataFinalizacao = {};
      if (dataInicial) {
        filter.dataFinalizacao.$gte = new Date(dataInicial);
      }
      if (dataFinal) {
        const df = new Date(dataFinal);
        df.setHours(23, 59, 59, 999);
        filter.dataFinalizacao.$lte = df;
      }
    }

    const finalizedTables = await FinalizedTable.find(filter)
      .populate({
        path: 'pedidos',
        populate: {
          path: 'itens.product',
          model: 'Product',
        },
      })
      .populate('garcomId');

    let totalSold = 0;
    const sales = []; // Aqui registramos as vendas individuais (com date e amount)

    finalizedTables.forEach((table) => {
      if (
        table.garcomId &&
        salesGoal.employee &&
        String(table.garcomId._id) === String(salesGoal.employee._id)
      ) {
        table.pedidos.forEach((pedido) => {
          pedido.itens.forEach((item) => {
            if (
              item.product &&
              salesGoal.product &&
              String(item.product._id) === String(salesGoal.product._id)
            ) {
              const valorItem = (item.product.preco || 0) * (item.quantidade || 0);
              totalSold += valorItem;

              // Guardar data da venda e valor da venda
              sales.push({
                date: pedido.createdAt || table.dataFinalizacao || new Date(),
                amount: valorItem,
              });
            }
          });
        });
      }
    });

    // Ordenar sales por data crescente, e pegar as últimas 10 (por convenção)
    sales.sort((a, b) => new Date(a.date) - new Date(b.date));
    const lastTenSales = sales.slice(-10); // pega as últimas 10

    // Retornar totalSold e lastTenSales
    res.json({
      totalSold: parseFloat(totalSold.toFixed(2)),
      sales: lastTenSales,
    });
  } catch (error) {
    console.error('Erro ao obter detalhes da meta de vendas:', error);
    res.status(500).json({ message: 'Erro ao obter detalhes da meta de vendas.' });
  }
};

// Obter uma meta de vendas por ID
exports.getSalesGoalById = async (req, res) => {
  const { id } = req.params;
  try {
    const salesGoal = await SalesGoal.findById(id).populate('employee manager product');
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }
    res.json(salesGoal);
  } catch (error) {
    console.error('Erro ao obter meta de vendas específica:', error);
    res.status(500).json({ message: 'Erro ao obter meta de vendas específica.', error: error.message });
  }
};

// Obter todas as metas de vendas (Admin e Manager)
exports.getSalesGoals = async (req, res) => {
  try {
    // Carrega todas as metas de vendas, sem restrição:
    // (populando employee, manager e product para termos detalhes do funcionário e produto)
    let salesGoals = await SalesGoal.find().populate('employee manager product');

    // (Opcional) Verifica se há filtros de data passados via query string
    const { dataInicial, dataFinal } = req.query;
    let filter = {};
    if (dataInicial || dataFinal) {
      filter.dataFinalizacao = {};
      if (dataInicial) {
        filter.dataFinalizacao.$gte = new Date(dataInicial);
      }
      if (dataFinal) {
        // Ajustar para fim do dia
        const dataFim = new Date(dataFinal);
        dataFim.setHours(23, 59, 59, 999);
        filter.dataFinalizacao.$lte = dataFim;
      }
    }

    // Carrega todas as vendas finalizadas dentro do período (se houver)
    // Popula os pedidos com itens e o garçom (employee)
    const finalizedTables = await FinalizedTable.find(filter)
      .populate({
        path: 'pedidos',
        populate: {
          path: 'itens.product',
          model: 'Product',
        },
      })
      .populate('garcomId'); // Precisamos saber qual funcionário (employee)

    // Para cada meta, vamos somar o total vendido
    const enrichedGoals = salesGoals.map((goal) => {
      let totalSold = 0;

      // Percorre as mesas finalizadas
      finalizedTables.forEach((table) => {
        // Verifica se a mesa finalizada foi atendida pelo "employee" da meta
        // (caso a meta seja para um funcionário específico)
        if (
          table.garcomId &&
          goal.employee &&
          table.garcomId._id.toString() === goal.employee._id.toString()
        ) {
          // Percorrer cada pedido
          table.pedidos.forEach((pedido) => {
            // Percorrer cada item
            pedido.itens.forEach((item) => {
              // Se o item.product for o mesmo da meta
              if (
                item.product &&
                goal.product &&
                item.product._id.toString() === goal.product._id.toString()
              ) {
                // Soma a quantidade vendida (ou o valor, se quiser)
                totalSold += item.quantidade;
              }
            });
          });
        }
      });

      // Cria campos extras
      const currentSales = totalSold;
      const progress = goal.goalAmount > 0
        ? (currentSales / goal.goalAmount) * 100
        : 0;

      return {
        ...goal.toObject(),
        currentSales,
        progress: progress > 100 ? 100 : parseFloat(progress.toFixed(2)),
      };
    });

    // Retorna as metas já enriquecidas com currentSales e progress
    res.json(enrichedGoals);
  } catch (error) {
    console.error('Erro ao obter metas de vendas:', error);
    res.status(500).json({ message: 'Erro ao obter metas de vendas.' });
  }
};

// Atualizar uma meta de vendas
exports.updateSalesGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, goalName, goalAmount, startDate, endDate, productId } = req.body;

    const salesGoal = await SalesGoal.findById(id);
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }

    // Verifica permissão
    if (
      req.user.role === 'manager' &&
      salesGoal.manager.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar esta meta' });
    }

    // Verifica se startDate é antes de endDate
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'startDate deve ser antes de endDate' });
    }

    // Atualiza o funcionário se employeeId for fornecido
    if (employeeId !== undefined) {
      const employee = await User.findById(employeeId);
      if (!employee || employee.role !== 'agent') {
        return res.status(404).json({ message: 'Funcionário não encontrado ou não é um agente' });
      }

      // Se o usuário for gerente, verifica se ele gerencia o funcionário
      if (req.user.role === 'manager' && (!employee.manager || employee.manager.toString() !== req.user.id)) {
        return res.status(403).json({ message: 'Você não tem permissão para atribuir esta meta a este funcionário' });
      }

      salesGoal.employee = employeeId;
    }

    // Atualiza outros campos
    if (goalName !== undefined) salesGoal.goalName = goalName;
    if (goalAmount !== undefined) salesGoal.goalAmount = goalAmount;
    if (startDate !== undefined) salesGoal.startDate = startDate;
    if (endDate !== undefined) salesGoal.endDate = endDate;

    // Atualiza o produto se productId for fornecido
    if (productId !== undefined) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      salesGoal.product = productId;
    }

    await salesGoal.save();

    res.json({ message: 'Meta de vendas atualizada com sucesso', salesGoal });
  } catch (error) {
    console.error('Erro ao atualizar meta de vendas:', error);
    res.status(500).json({ message: 'Erro ao atualizar meta de vendas', error: error.message });
  }
};

// Excluir uma meta de vendas
exports.deleteSalesGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const salesGoal = await SalesGoal.findById(id);
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }

    if (req.user.role !== 'admin') {
      // aqui a checagem literal
      return res.status(403).json({ message: 'Somente administradores podem excluir metas.' });
    }

    await salesGoal.deleteOne();
    return res.json({ message: 'Meta de vendas excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir meta de vendas:', error);
    res.status(500).json({ message: 'Erro ao excluir meta de vendas.' });
  }
};

// Obter metas de vendas por funcionário
exports.getSalesGoalsByEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o usuário autenticado tem permissão para acessar os dados
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    // Busca as metas de vendas do funcionário específico
    const salesGoals = await SalesGoal.find({ employee: id }).populate('employee manager product');

    res.json(salesGoals);
  } catch (error) {
    console.error('Erro ao obter metas de vendas do funcionário:', error);
    res.status(500).json({ message: 'Erro ao obter metas de vendas do funcionário.', error: error.message });
  }
};


// Obter detalhes da meta de vendas
exports.getSalesGoalDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const salesGoal = await SalesGoal.findById(id).populate('employee manager product');
    if (!salesGoal) {
      return res.status(404).json({ message: 'Meta de vendas não encontrada' });
    }

    // Agregando dados das mesas finalizadas (FinalizedTable)
    const finalizedTables = await FinalizedTable.find({
      garcomId: salesGoal.employee,
      dataFinalizacao: { $gte: salesGoal.startDate, $lte: salesGoal.endDate },
      // Filtra pedidos pelo produto da meta
      'pedidos.product': salesGoal.product,
    }).populate({
      path: 'pedidos.product',
      model: 'Product',
    });

    // Calculando o total vendido para o produto específico
    let totalSold = 0;
    const sales = [];

    finalizedTables.forEach(table => {
      table.pedidos.forEach(pedido => {
        if (pedido.product && pedido.product._id.toString() === salesGoal.product.toString()) {
          const saleAmount = (pedido.quantidade || 0) * (pedido.product.preco || 0); // Supondo que o produto tenha campo 'preco'
          totalSold += saleAmount;
          sales.push({
            date: table.dataFinalizacao,
            amount: saleAmount,
          });
        }
      });
    });

    // Limitando as últimas 10 vendas
    const lastTenSales = sales.slice(-10).reverse();

    res.json({ totalSold, sales: lastTenSales });
  } catch (error) {
    console.error('Erro ao obter detalhes da meta de vendas:', error);
    res.status(500).json({ message: 'Erro ao obter detalhes da meta de vendas.', error: error.message });
  }
};
