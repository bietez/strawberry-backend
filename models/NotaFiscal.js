// backend/models/NotaFiscal.js

const mongoose = require('mongoose');

// Esquema para Itens (Produtos) da Nota Fiscal
const ItemSchema = new mongoose.Schema({
    codigo: { type: String, required: true },
    descricao: { type: String, required: true },
    ncm: { type: String, default: '21069090' },
    cfop: { type: String, default: '5.102' },
    unidade: { type: String, required: true },
    quantidade: { type: Number, required: true },
    valorUnitario: { type: Number, required: true },
    valorTotal: { type: Number, required: true }
}, { _id: false });

// Esquema para Destinatário da Nota Fiscal
const DestinatarioSchema = new mongoose.Schema({
    CNPJ: { type: String },
    CPF: { type: String },
    nome: { type: String, required: true },
    endereco: {
        logradouro: { type: String, required: true },
        numero: { type: String, required: true },
        bairro: { type: String, required: true },
        codigoMunicipio: { type: String, required: true },
        municipio: { type: String, required: true },
        uf: { type: String, required: true },
        cep: { type: String, required: true }
    },
    telefone: { type: String, required: true }
}, { _id: false });

// Esquema para Impostos Gerais
const ImpostoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    valor: { type: Number, required: true }
}, { _id: false });

// Esquema Principal da Nota Fiscal
const NotaFiscalSchema = new mongoose.Schema({
    // Campos de Identificação
    numero: { type: String, required: true, unique: true },
    serie: { type: String, required: true },
    naturezaOperacao: { type: String, required: true },
    tipoOperacao: { type: String, required: true, enum: ['entrada', 'saida'] }, // 'entrada' ou 'saida'
    dataEmissao: { type: Date, default: Date.now },
    // Emitente (Pode ser unificado ou separado conforme necessidade)
    emitente: {
        CNPJ: { type: String, required: true },
        xNome: { type: String, required: true },
        xFant: { type: String, required: true },
        enderEmit: {
            xLgr: { type: String, required: true },
            nro: { type: String, required: true },
            xBairro: { type: String, required: true },
            cMun: { type: String, required: true },
            xMun: { type: String, required: true },
            UF: { type: String, required: true },
            CEP: { type: String, required: true },
            cPais: { type: String, default: '1058' },
            xPais: { type: String, default: 'Brasil' },
            fone: { type: String, required: true },
        },
        IE: { type: String, required: true },
        CRT: { type: String, required: true, enum: ['1', '2', '3'] } // 1: Simples Nacional, 2: Simples Nacional - Excesso, 3: Regime Normal
    },
    // Destinatário
    destinatario: { type: DestinatarioSchema, required: true },
    // Itens (Produtos)
    itens: { type: [ItemSchema], required: true },
    // Impostos Gerais
    impostos: { type: [ImpostoSchema], required: true },
    // Valores Totais
    valorTotal: { type: Number, required: true },
    tipoArquivo: { type: String, enum: ['XML', 'PDF'], required: true },
    originalFileName: { type: String, required: true },
    uploadPath: { type: String, required: true },
    // Informações Adicionais
    xml: { type: String },
    status: { type: String, default: 'pendente', enum: ['pendente', 'autorizada', 'erro'] },
    chaveAcesso: { type: String, unique: true },
    protocolo: { type: String }
    // Note: Remove manual `createdAt` and `updatedAt` as timestamps: true handles them
}, { timestamps: true });

// Atualiza o campo `updatedAt` automaticamente antes de salvar
// Removed as `timestamps: true` handles it

// Índices adicionais - Remove duplicate index definitions
// NotaFiscalSchema.index({ chaveAcesso: 1 }, { unique: true });
// NotaFiscalSchema.index({ numero: 1 }, { unique: true });

module.exports = mongoose.model('NotaFiscal', NotaFiscalSchema);