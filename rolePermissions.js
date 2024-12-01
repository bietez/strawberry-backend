// rolePermissions.js
module.exports = {
    admin: ['*'], // Acesso total
    manager: [
      'viewProduct',
      'createProduct',
      'editProduct',
      'manageStock',
      // Adicione outras permissões conforme necessário
    ],
    agent: ['viewProduct', 'createSale'],
    feeder: ['viewProduct'],
  };
  