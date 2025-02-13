// controllers/ifoodCatalogController.js
const axios = require("axios");
const IfoodToken = require("../models/IfoodToken"); // seu model Mongoose que guarda o token
require("dotenv").config();

const BASE_URL = "https://merchant-api.ifood.com.br/catalog/v2.0";
const merchantId = process.env.IFOOD_MERCHANT_ID;

/**
 * Verifica se há token válido; se não, responde 401
 * Retorna o token.ifoodAccessToken, caso exista e seja válido
 */
async function getValidAccessToken(res) {
  const token = await IfoodToken.findOne({});
  if (!token || token.isExpired()) {
    res.status(401).json({ message: "Token inválido ou expirado." });
    return null;
  }
  return token.ifoodAccessToken;
}

/* -------------------------------------------------------------------
 * 1) Listar Catálogos (v2.0)
 * GET /merchants/{merchantId}/catalogs
 * ------------------------------------------------------------------- */
exports.listCatalogs = async (req, res) => {
  console.log("[listCatalogs] Iniciando listagem de catálogos...");
  try {
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return; // já retornou 401

    const url = `${BASE_URL}/merchants/${merchantId}/catalogs`;
    console.log("[listCatalogs] GET ->", url);

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("[listCatalogs] Resposta iFood:", response.data);
    return res.json(response.data);
  } catch (error) {
    console.error("[listCatalogs] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao listar catálogos.",
      details: error.response?.data || error.message,
    });
  }
};

/* -------------------------------------------------------------------
 * 2) Listar itens "unsellable" (v2.0)
 * GET /merchants/{merchantId}/catalogs/{catalogId}/unsellableItems
 * ------------------------------------------------------------------- */
exports.listUnsellableItems = async (req, res) => {
  console.log("[listUnsellableItems] Catalog ID:", req.params.catalogId);
  try {
    const { catalogId } = req.params;
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const url = `${BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/unsellableItems`;
    console.log("[listUnsellableItems] GET ->", url);

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("[listUnsellableItems] Resposta iFood:", response.data);
    return res.json(response.data);
  } catch (error) {
    console.error("[listUnsellableItems] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao listar unsellable items.",
      details: error.response?.data || error.message,
    });
  }
};

/* -------------------------------------------------------------------
 * 3) Listar itens "sellable" (v2.0)
 * GET /merchants/{merchantId}/catalogs/{groupId}/sellableItems
 * ------------------------------------------------------------------- */
exports.listSellableItems = async (req, res) => {
  console.log("[listSellableItems] Group ID:", req.params.groupId);
  try {
    const { groupId } = req.params;
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const url = `${BASE_URL}/merchants/${merchantId}/catalogs/${groupId}/sellableItems`;
    console.log("[listSellableItems] GET ->", url);

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("[listSellableItems] Resposta iFood:", response.data);
    return res.json(response.data);
  } catch (error) {
    console.error("[listSellableItems] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao listar sellable items.",
      details: error.response?.data || error.message,
    });
  }
};

/* -------------------------------------------------------------------
 * 4) Verificar versão do catálogo (v2.0)
 * GET /merchants/{merchantId}/catalog/version
 * ------------------------------------------------------------------- */
exports.checkVersion = async (req, res) => {
  console.log("[checkVersion] Iniciando verificação de versão do catálogo...");
  try {
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const url = `${BASE_URL}/merchants/${merchantId}/catalog/version`;
    console.log("[checkVersion] GET ->", url);

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("[checkVersion] Resposta iFood:", response.data); // "v1" ou "v2"
    return res.json(response.data);
  } catch (error) {
    console.error("[checkVersion] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao verificar versão do catálogo.",
      details: error.response?.data || error.message,
    });
  }
};

/* -------------------------------------------------------------------
 * 5) Upgrade do catálogo para v2
 * POST /merchants/{merchantId}/version/upgrade
 * ------------------------------------------------------------------- */
exports.upgradeVersion = async (req, res) => {
  console.log("[upgradeVersion] Iniciando upgrade de versão...");
  try {
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const { cleanMigration = false } = req.body;
    const url = `${BASE_URL}/merchants/${merchantId}/version/upgrade`;
    console.log("[upgradeVersion] POST ->", url, "cleanMigration =", cleanMigration);

    const response = await axios.post(url, null, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { cleanMigration },
    });

    console.log("[upgradeVersion] Resposta iFood:", response.data);
    return res.status(201).json({
      message: "Upgrade solicitado com sucesso",
      ifoodResponse: response.data,
    });
  } catch (error) {
    console.error("[upgradeVersion] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao fazer upgrade do catálogo.",
      details: error.response?.data || error.message,
    });
  }
};

/* -------------------------------------------------------------------
 * ========== CRUD DE CATEGORIAS ==========
 * doc: /merchants/{merchantId}/catalogs/{catalogId}/categories
 * ------------------------------------------------------------------- */

/** Listar categorias de um catálogo */
exports.listCategories = async (req, res) => {
  console.log("[listCategories] Iniciando listagem de categorias...");
  try {
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const { catalogId } = req.params;
    // Query param optional: includeItems
    const { includeItems = false } = req.query;

    const url = `${BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories`;
    console.log("[listCategories] GET ->", url, `?includeItems=${includeItems}`);

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { includeItems },
    });

    console.log("[listCategories] Resposta iFood:", response.data);
    return res.json(response.data);
  } catch (error) {
    console.error("[listCategories] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao listar categorias do catálogo.",
      details: error.response?.data || error.message,
    });
  }
};

/** Criar categoria (template "DEFAULT" ou "PIZZA") */
exports.createCategory = async (req, res) => {
  console.log("[createCategory] Iniciando criação de categoria...");
  try {
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const { catalogId } = req.params;
    const {
      id,
      name,
      externalCode,
      status,
      index,
      template,
      pizza,
    } = req.body;

    const url = `${BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories`;
    console.log("[createCategory] POST ->", url);

    const bodyData = {
      id,
      name,
      externalCode,
      status,
      index,
      template, // "DEFAULT" ou "PIZZA"
      pizza,    // objeto pizza caso seja template = "PIZZA"
    };

    const response = await axios.post(url, bodyData, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("[createCategory] Resposta iFood:", response.data);
    return res.status(201).json(response.data);
  } catch (error) {
    console.error("[createCategory] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao criar categoria.",
      details: error.response?.data || error.message,
    });
  }
};

/** Obter dados de uma categoria específica */
exports.getCategory = async (req, res) => {
  console.log("[getCategory] Iniciando obtenção de categoria...");
  try {
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const { catalogId, categoryId } = req.params;
    const { includeItems = false } = req.query;

    const url = `${BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories/${categoryId}`;
    console.log("[getCategory] GET ->", url, `?includeItems=${includeItems}`);

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { includeItems },
    });

    console.log("[getCategory] Resposta iFood:", response.data);
    return res.json(response.data);
  } catch (error) {
    console.error("[getCategory] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao obter categoria.",
      details: error.response?.data || error.message,
    });
  }
};

/** Atualizar categoria (PATCH) */
exports.updateCategory = async (req, res) => {
  console.log("[updateCategory] Iniciando atualização de categoria...");
  try {
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const { catalogId, categoryId } = req.params;
    const {
      name,
      externalCode,
      status,
      index,
      template,
      pizza,
    } = req.body;

    const url = `${BASE_URL}/merchants/${merchantId}/catalogs/${catalogId}/categories/${categoryId}`;
    console.log("[updateCategory] PATCH ->", url);

    const bodyData = {
      name,
      externalCode,
      status,
      index,
      template, // "DEFAULT" ou "PIZZA"
      pizza,    // objeto pizza atualizado
    };

    const response = await axios.patch(url, bodyData, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("[updateCategory] Resposta iFood:", response.data);
    return res.json(response.data);
  } catch (error) {
    console.error("[updateCategory] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao atualizar categoria.",
      details: error.response?.data || error.message,
    });
  }
};

/** Excluir categoria */
exports.deleteCategory = async (req, res) => {
  console.log("[deleteCategory] Iniciando exclusão de categoria...");
  try {
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const { categoryId } = req.params;

    // doc original: DELETE /merchants/{merchantId}/categories/{categoryId}
    const url = `${BASE_URL}/merchants/${merchantId}/categories/${categoryId}`;
    console.log("[deleteCategory] DELETE ->", url);

    await axios.delete(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("[deleteCategory] Categoria excluída com sucesso!");
    return res.json({ message: "Categoria excluída com sucesso!" });
  } catch (error) {
    console.error("[deleteCategory] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao excluir categoria.",
      details: error.response?.data || error.message,
    });
  }
};

/* -------------------------------------------------------------------
 * ========== CRUD DE PRODUTOS ==========
 * doc v2: /merchants/{merchantId}/products
 * ------------------------------------------------------------------- */

/** A) Listar Produtos */
exports.listProducts = async (req, res) => {
  console.log("[listProducts] Iniciando listagem de produtos...");
  try {
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    // Query: limit e page
    const { limit = 50, page = 0 } = req.query;
    const url = `${BASE_URL}/merchants/${merchantId}/products`;

    console.log("[listProducts] GET ->", url, `?limit=${limit}&page=${page}`);

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit, page },
    });

    console.log("[listProducts] Resposta iFood:", response.data);
    // Normalmente retorna um array de produtos
    return res.json(response.data);
  } catch (error) {
    console.error("[listProducts] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao listar produtos.",
      details: error.response?.data || error.message,
    });
  }
};

/** B) Criar Produto */
exports.createProduct = async (req, res) => {
  console.log("[createProduct] Iniciando criação de produto...");
  try {
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const {
      name,
      description,
      additionalInformation,
      externalCode,
      imagePath,
      serving,
      dietaryRestrictions,
      ean,
      weight,
      multipleImages,
    } = req.body;

    const url = `${BASE_URL}/merchants/${merchantId}/products`;
    console.log("[createProduct] POST ->", url);

    const dataBody = {
      name,
      description,
      additionalInformation,
      externalCode,
      imagePath,
      serving,
      dietaryRestrictions,
      ean,
      weight,
      multipleImages,
    };

    const response = await axios.post(url, dataBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("[createProduct] Resposta iFood:", response.data);
    return res.status(201).json(response.data);
  } catch (error) {
    console.error("[createProduct] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao criar produto.",
      details: error.response?.data || error.message,
    });
  }
};

/** C) Editar Produto */
exports.updateProduct = async (req, res) => {
  console.log("[updateProduct] Iniciando atualização de produto...");
  try {
    const { productId } = req.params;
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const url = `${BASE_URL}/merchants/${merchantId}/products/${productId}`;
    console.log("[updateProduct] PUT ->", url);

    const {
      name,
      description,
      additionalInformation,
      externalCode,
      imagePath,
      serving,
      dietaryRestrictions,
      ean,
      weight,
      multipleImages,
    } = req.body;

    const dataBody = {
      name,
      description,
      additionalInformation,
      externalCode,
      imagePath,
      serving,
      dietaryRestrictions,
      ean,
      weight,
      multipleImages,
    };

    const response = await axios.put(url, dataBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("[updateProduct] Resposta iFood:", response.data);
    return res.json(response.data);
  } catch (error) {
    console.error("[updateProduct] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao editar produto.",
      details: error.response?.data || error.message,
    });
  }
};

/** D) Excluir Produto */
exports.deleteProduct = async (req, res) => {
  console.log("[deleteProduct] Iniciando exclusão de produto...");
  try {
    const { productId } = req.params;
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const url = `${BASE_URL}/merchants/${merchantId}/products/${productId}`;
    console.log("[deleteProduct] DELETE ->", url);

    await axios.delete(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("[deleteProduct] Produto excluído com sucesso!");
    return res.json({ message: "Produto excluído com sucesso!" });
  } catch (error) {
    console.error("[deleteProduct] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao excluir produto.",
      details: error.response?.data || error.message,
    });
  }
};

/* -------------------------------------------------------------------
 * ========== ITENS ==========
 * doc: PUT /merchants/{merchantId}/items
 *      PATCH /merchants/{merchantId}/items/price
 * ------------------------------------------------------------------- */

/** Criar ou atualizar um item (podendo ser Pizza) */
exports.upsertItem = async (req, res) => {
  console.log("[upsertItem] Iniciando criação/atualização de item...");
  try {
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    const url = `${BASE_URL}/merchants/${merchantId}/items`;
    console.log("[upsertItem] PUT ->", url);

    // Body de acordo com doc
    // {
    //   "item": {...}, "products": [...], "optionGroups": [...], "options": [...]
    // }
    const itemPayload = req.body;

    const response = await axios.put(url, itemPayload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("[upsertItem] Resposta iFood:", response.data);
    return res.json(response.data);
  } catch (error) {
    console.error("[upsertItem] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao criar/atualizar item.",
      details: error.response?.data || error.message,
    });
  }
};

/** Atualizar preço de um item */
exports.updateItemPrice = async (req, res) => {
  console.log("[updateItemPrice] Iniciando atualização de preço do item...");
  try {
    const accessToken = await getValidAccessToken(res);
    if (!accessToken) return;

    // doc: PATCH /merchants/{merchantId}/items/price
    // Body: { "itemId": "xxx", "price": {...}, "priceByCatalog": [...] }
    const url = `${BASE_URL}/merchants/${merchantId}/items/price`;
    console.log("[updateItemPrice] PATCH ->", url);

    const pricePayload = req.body;
    const response = await axios.patch(url, pricePayload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("[updateItemPrice] Resposta iFood:", response.data);
    return res.json(response.data);
  } catch (error) {
    console.error("[updateItemPrice] Erro:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erro ao atualizar preço do item.",
      details: error.response?.data || error.message,
    });
  }
};
