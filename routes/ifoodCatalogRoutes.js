// routes/ifoodCatalogRoutes.js
const express = require("express");
const router = express.Router();
const ifoodCatalogController = require("../controllers/ifoodCatalogController");

/* ------------------- Catalog v2 ------------------- */
// 1. Listar catálogos
router.get("/catalogs", ifoodCatalogController.listCatalogs);

// 2. Listar itens indisponíveis (unsellable)
router.get("/catalogs/:catalogId/unsellableItems", ifoodCatalogController.listUnsellableItems);

// 3. Listar itens vendáveis (sellable)
router.get("/catalogs/:groupId/sellableItems", ifoodCatalogController.listSellableItems);

// 4. Check Version
router.get("/catalog/version", ifoodCatalogController.checkVersion);

// 5. Upgrade p/ v2
router.post("/catalog/upgrade", ifoodCatalogController.upgradeVersion);

/* ------------------- Categorias (CRUD) ------------------- */
// Listar categorias do catálogo
router.get("/catalogs/:catalogId/categories", ifoodCatalogController.listCategories);

// Criar categoria
router.post("/catalogs/:catalogId/categories", ifoodCatalogController.createCategory);

// Obter categoria específica
router.get("/catalogs/:catalogId/categories/:categoryId", ifoodCatalogController.getCategory);

// Atualizar categoria
router.patch("/catalogs/:catalogId/categories/:categoryId", ifoodCatalogController.updateCategory);

// Excluir categoria
// A doc do iFood mostra DELETE /merchants/{merchantId}/categories/{categoryId}, sem /catalogs
// mas manteremos assim para simplificar e não conflitar com outro endpoint
router.delete("/categories/:categoryId", ifoodCatalogController.deleteCategory);

/* ------------------- Produtos (CRUD) ------------------- */
// Listar produtos
router.get("/products", ifoodCatalogController.listProducts);

// Criar produto
router.post("/products", ifoodCatalogController.createProduct);

// Editar produto
router.put("/products/:productId", ifoodCatalogController.updateProduct);

// Excluir produto
router.delete("/products/:productId", ifoodCatalogController.deleteProduct);

/* ------------------- Itens ------------------- */
// Criar ou atualizar um item
router.put("/items", ifoodCatalogController.upsertItem);

// Atualizar preço de item
router.patch("/items/price", ifoodCatalogController.updateItemPrice);

module.exports = router;
