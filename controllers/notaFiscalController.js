// backend/controllers/notaFiscalController.js

const path = require('path');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');
const pdfParse = require('pdf-parse');
const NotaFiscal = require('../models/NotaFiscal');
const User = require('../models/User');
const Config = require('../models/Config');
const { NFe } = require('node-nfe'); // Biblioteca para NF-e
const { gerarXML } = require('../utils/notaFiscalUtil'); // Função para gerar XML, ajuste conforme necessário
const soap = require('soap');
require('dotenv').config();

// Configuração da NF-e
const nfe = new NFe({
    certificado: {
        path: process.env.CERT_PATH,
        password: process.env.CERT_PASS,
    },
    ambiente: process.env.AMBIENTE || 'homologacao', // 'producao' para produção
    cnpj: process.env.CNPJ_EMITENTE, // Seu CNPJ, definido nas variáveis de ambiente
    // Outros parâmetros necessários conforme a documentação do node-nfe
});

/**
 * Gera um código aleatório com o número de dígitos especificado.
 *
 * @param {Number} length - Número de dígitos.
 * @returns {String} - Código aleatório.
 */
const gerarCodigoRandomico = (length) => {
    let codigo = '';
    for (let i = 0; i < length; i++) {
        codigo += Math.floor(Math.random() * 10);
    }
    return codigo;
};

/**
 * Calcula o dígito verificador (DV) da chave de acesso usando o algoritmo módulo 11.
 *
 * @param {String} chave - Chave de acesso sem o DV.
 * @returns {String} - Dígito verificador.
 */
const calcularDigitoVerificador = (chave) => {
    let soma = 0;
    let peso = 2;

    for (let i = chave.length - 1; i >= 0; i--) {
        soma += parseInt(chave[i], 10) * peso;
        peso = peso === 9 ? 2 : peso + 1;
    }

    const resto = soma % 11;
    const dv = resto < 2 ? 0 : 11 - resto;

    return dv.toString();
};

/**
 * Upload de Nota Fiscal (XML ou PDF)
 */
exports.uploadNotaFiscal = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
        }

        const { originalname, filename } = req.file;
        let tipoArquivo = '';

        // Verifica extensão
        if (originalname.toLowerCase().endsWith('.xml')) {
            tipoArquivo = 'XML';
        } else if (originalname.toLowerCase().endsWith('.pdf')) {
            tipoArquivo = 'PDF';
        } else {
            return res.status(400).json({ message: 'Formato não suportado (use .xml ou .pdf).' });
        }

        // Caminho real de upload
        const uploadPath = path.join(__dirname, '..', 'public', 'nfe', filename);

        let numero = '';
        let dataEmissao = null;
        let fornecedor = '';
        let valorTotal = 0;
        let impostos = [];

        // ---- Se for XML ----
        if (tipoArquivo === 'XML') {
            const xmlData = fs.readFileSync(uploadPath, 'utf-8');
            const parser = new XMLParser();
            const jsonObj = parser.parse(xmlData);

            const nfeProc = jsonObj.nfeProc;
            if (nfeProc && nfeProc.NFe && nfeProc.NFe.infNFe) {
                const ide = nfeProc.NFe.infNFe.ide;
                const emit = nfeProc.NFe.infNFe.emit;
                const total = nfeProc.NFe.infNFe.total?.ICMSTot;

                numero = ide.nNF || '';
                const dtEmi = ide.dhEmi || ide.dEmi;
                dataEmissao = dtEmi ? new Date(dtEmi) : null;
                fornecedor = emit?.xNome || '';
                valorTotal = parseFloat(total?.vNF) || 0;

                impostos = [
                    {
                        nome: 'ICMS',
                        valor: parseFloat(total?.vICMS) || 0,
                    },
                    {
                        nome: 'PIS',
                        valor: parseFloat(total?.vPIS) || 0,
                    },
                    {
                        nome: 'COFINS',
                        valor: parseFloat(total?.vCOFINS) || 0,
                    },
                ];
            }

        // ---- Se for PDF ----
        } else if (tipoArquivo === 'PDF') {
            const pdfBuffer = fs.readFileSync(uploadPath);
            const pdfData = await pdfParse(pdfBuffer);
            const text = pdfData.text || '';

            // Exemplos de regex (ajuste para o layout do seu DANFE)
            // 1) Número
            const matchNumero = text.match(/N(?:ú|u)mero\s*[:\-]\s*(\d+)/i);
            if (matchNumero) {
                numero = matchNumero[1].trim();
            }

            // 2) Data Emissão (ex.: "Data Emissão: 06/12/2024")
            const matchData = text.match(/Data\s+Emiss[aã]o\s*[:\-]\s*(\d{2}\/\d{2}\/\d{4})/i);
            if (matchData) {
                dataEmissao = new Date(matchData[1].trim().split('/').reverse().join('-'));
            }

            // 3) Fornecedor
            const matchFornec = text.match(/Fornecedor\s*[:\-]\s*(.+)/i);
            if (matchFornec) {
                fornecedor = matchFornec[1].split('\n')[0].trim();
            }

            // 4) Valor Total
            const matchValor = text.match(/Valor\s+Total\s*[:\-]\s*([\d.,]+)/i);
            if (matchValor) {
                let vt = matchValor[1];
                if (typeof vt === 'string') {
                    vt = vt.replace(/\./g, '').replace(',', '.');
                    vt = parseFloat(vt) || 0;
                } else {
                    vt = 0;
                }
                valorTotal = vt;
            }

            // 5) Impostos (ICMS)
            const matchICMS = text.match(/ICMS\s*[:\-]\s*([\d.,]+)/i);
            if (matchICMS) {
                let icmsVal = matchICMS[1];
                if (typeof icmsVal === 'string') {
                    icmsVal = icmsVal.replace(/\./g, '').replace(',', '.');
                    icmsVal = parseFloat(icmsVal) || 0;
                } else {
                    icmsVal = 0;
                }
                impostos.push({
                    nome: 'ICMS',
                    valor: icmsVal,
                });
            }
        }

        // Salva no BD
        const nota = new NotaFiscal({
            numero,
            dataEmissao,
            fornecedor,
            valorTotal,
            impostos,
            tipoArquivo,
            originalFileName: originalname,
            uploadPath: `/public/nfe/${filename}`
        });
        await nota.save();

        return res.json({
            message: 'Nota Fiscal processada com sucesso.',
            nota
        });

    } catch (error) {
        console.error('Erro ao processar Nota Fiscal:', error);
        return res.status(500).json({ message: 'Erro interno ao processar Nota Fiscal.' });
    }
};

/**
 * Upload de Certificado Digital
 */
exports.uploadCertificate = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Arquivo de certificado é obrigatório.' });
        }

        const { file } = req;
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            fs.unlinkSync(file.path);
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Remover certificado antigo, se existir
        if (user.certificatePath) {
            const oldCertPath = path.join(__dirname, '..', user.certificatePath);
            if (fs.existsSync(oldCertPath)) {
                fs.unlinkSync(oldCertPath);
            }
        }

        // Atualizar o caminho do certificado no usuário
        user.certificatePath = `/public/certificates/${file.filename}`;
        await user.save();

        return res.status(201).json({ message: 'Certificado enviado com sucesso!', certificatePath: user.certificatePath });
    } catch (error) {
        console.error('Erro ao enviar certificado:', error);
        return res.status(500).json({ error: 'Erro ao enviar certificado.' });
    }
};

/**
 * Listar Notas Fiscais
 */
exports.listarNotasFiscais = async (req, res) => {
    try {
        const notas = await NotaFiscal.find().sort({ createdAt: -1 });
        return res.json(notas);
    } catch (err) {
        console.error('Erro ao listar Notas Fiscais:', err);
        return res.status(500).json({ message: 'Erro interno.' });
    }
};

/**
 * Excluir Nota Fiscal
 */
exports.excluirNotaFiscal = async (req, res) => {
    try {
        const { id } = req.params;

        // Busca o registro para obter o uploadPath
        const nota = await NotaFiscal.findById(id);
        if (!nota) {
            return res.status(404).json({ message: 'Nota Fiscal não encontrada.' });
        }

        // Tenta apagar o arquivo no servidor, se existir
        if (nota.uploadPath) {
            try {
                const filePath = path.join(__dirname, '..', nota.uploadPath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error('Erro ao apagar arquivo local:', err);
            }
        }

        // Opcional: Remover certificado associado, se houver
        if (nota.certificatePath) {
            const certPath = path.join(__dirname, '..', nota.certificatePath);
            if (fs.existsSync(certPath)) {
                fs.unlinkSync(certPath);
            }
        }

        // Remove o registro do banco
        await NotaFiscal.findByIdAndDelete(id);

        return res.json({ message: 'Nota Fiscal excluída com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir Nota Fiscal:', error);
        return res.status(500).json({ message: 'Erro interno ao excluir Nota Fiscal.' });
    }
};

/**
 * Atualizar Nota Fiscal
 */
exports.atualizarNotaFiscal = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero, dataEmissao, fornecedor, valorTotal, impostos } = req.body;

        const notaAtualizada = await NotaFiscal.findByIdAndUpdate(
            id,
            { numero, dataEmissao, fornecedor, valorTotal, impostos, updatedAt: Date.now() },
            { new: true }
        );

        if (!notaAtualizada) {
            return res.status(404).json({ message: 'Nota Fiscal não encontrada.' });
        }

        return res.json({
            message: 'Nota Fiscal atualizada com sucesso.',
            notaFiscal: notaAtualizada,
        });
    } catch (error) {
        console.error('Erro ao atualizar Nota Fiscal:', error);
        return res.status(500).json({ message: 'Erro interno ao atualizar Nota Fiscal.' });
    }
};

/**
 * Gerar Nota Fiscal Eletrônica (NF-e)
 */
exports.gerarNotaFiscal = async (req, res) => {
    try {
        const data = req.body;
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || !user.certificatePath) {
            return res.status(400).json({ error: 'Certificado digital não está configurado.' });
        }

        const certificado = fs.readFileSync(path.join(__dirname, '..', user.certificatePath));
        const senhaCertificado = process.env.CERT_PASS || 'suaSenhaAqui'; // Considere receber essa senha de forma segura

        const nfe = new NFe({
            certificado: {
                buffer: certificado,
                password: senhaCertificado,
            },
            ambiente: process.env.AMBIENTE || 'homologacao',
            cnpj: process.env.CNPJ_EMITENTE,
            // Outros parâmetros necessários conforme a documentação do node-nfe
        });

        // Atualiza o campo 'cNF' se estiver vazio
        if (!data.ide.cNF) {
            data.ide.cNF = gerarCodigoRandomico(8);
        }

        // Atualiza o campo 'cDV' após gerar 'cNF'
        const chaveSemDV = `${data.ide.cUF}${data.ide.dhEmi.slice(2, 4)}${data.ide.dhEmi.slice(5, 7)}${data.emit.CNPJ}${data.ide.mod}${data.ide.serie}${data.ide.nNF.toString().padStart(9, '0')}${data.ide.tpEmis}${data.ide.cNF}`;
        data.ide.cDV = calcularDigitoVerificador(chaveSemDV);

        // Calcula os totais
        const totalProd = data.produtos.reduce((acc, p) => acc + (parseFloat(p.qCom) * parseFloat(p.vUnCom)), 0).toFixed(2);
        const totalICMS = data.produtos.reduce((acc, p) => acc + (parseFloat(p.qCom) * parseFloat(p.vUnCom) * 0.18), 0).toFixed(2);
        const totalPIS = data.produtos.reduce((acc, p) => acc + (parseFloat(p.qCom) * parseFloat(p.vUnCom) * 0.0165), 0).toFixed(2);
        const totalCOFINS = data.produtos.reduce((acc, p) => acc + (parseFloat(p.qCom) * parseFloat(p.vUnCom) * 0.076), 0).toFixed(2);

        data.total.ICMSTot.vBC = totalProd;
        data.total.ICMSTot.vICMS = totalICMS;
        data.total.ICMSTot.vPIS = totalPIS;
        data.total.ICMSTot.vCOFINS = totalCOFINS;
        data.total.ICMSTot.vProd = totalProd;
        data.total.ICMSTot.vNF = totalProd;

        // Gera o XML da NF-e
        const xml = gerarXML(data);
        data.xml = xml;

        // Salva a NF-e no banco antes de emitir
        const notaFiscal = new NotaFiscal({
            ...data,
            status: 'gerada',
        });
        await notaFiscal.save();

        // Assina e envia para a Receita Federal
        const response = await nfe.enviar(xml);

        if (response.success) {
            notaFiscal.status = 'autorizada';
            notaFiscal.chaveAcesso = response.chave;
            notaFiscal.protocolo = response.protocolo;
            await notaFiscal.save();
            res.status(201).json(notaFiscal);
        } else {
            notaFiscal.status = 'erro';
            await notaFiscal.save();
            res.status(500).json({ error: 'Erro ao emitir NF-e', detalhes: response });
        }

    } catch (error) {
        console.error('Erro ao emitir NF-e:', error);
        res.status(500).json({ error: 'Erro ao emitir NF-e.' });
    }
};

/**
 * Consultar Status de uma NF-e
 */
exports.consultarStatusNF = async (req, res) => {
    const { id } = req.params;

    try {
        const notaFiscal = await NotaFiscal.findById(id);
        if (!notaFiscal) {
            return res.status(404).json({ error: 'Nota fiscal não encontrada.' });
        }

        const user = await User.findById(notaFiscal.emitente.userId); // Ajuste conforme a estrutura do emitente
        if (!user || !user.certificatePath) {
            return res.status(400).json({ error: 'Certificado digital não está configurado.' });
        }

        const certificado = fs.readFileSync(path.join(__dirname, '..', user.certificatePath));
        const senhaCertificado = process.env.CERT_PASS || 'suaSenhaAqui';

        const nfe = new NFe({
            certificado: {
                buffer: certificado,
                password: senhaCertificado,
            },
            ambiente: process.env.AMBIENTE || 'homologacao',
            cnpj: process.env.CNPJ_EMITENTE,
            // Outros parâmetros necessários conforme a documentação do node-nfe
        });

        const response = await nfe.consultarStatus(notaFiscal.chaveAcesso);

        if (response.success) {
            notaFiscal.status = response.status;
            await notaFiscal.save();
            res.json(notaFiscal);
        } else {
            res.status(500).json({ error: 'Erro ao consultar status da NF-e', detalhes: response });
        }

    } catch (error) {
        console.error('Erro ao consultar status da NF-e:', error);
        res.status(500).json({ error: 'Erro ao consultar status da NF-e.' });
    }
};

/**
 * Recepção de NF-e
 */
exports.recepcaoNFe = async (req, res) => {
    try {
        const notas = await NotaFiscal.find({ status: 'gerada' });

        if (notas.length === 0) {
            return res.status(400).json({ message: 'Nenhuma NF-e pendente para enviar.' });
        }

        const lote = notas.map(nota => nota.xml).join('');

        // URL do Web Service de Recepção
        const wsdl = 'https://nfe.sefaz.go.gov.br/nfe/services/v2/NfeRecepcao2?wsdl';
        const client = await soap.createClientAsync(wsdl);

        // Configurações adicionais se necessário
        client.setSecurity(new soap.ClientSSLSecurityPFX(
            path.join(__dirname, '..', process.env.CERT_PATH),
            process.env.CERT_PASS
        ));

        const args = {
            NfeDadosMsg: lote,
        };

        const [result] = await client.NfeRecepcao2Async(args);

        // Processa a resposta e atualiza as notas fiscais
        // A implementação depende da estrutura da resposta do Web Service
        // Exemplo genérico:
        // for each nota em 'result', atualizar status conforme retorno

        res.json({ message: 'Lote de NF-e enviado com sucesso.', result });
    } catch (error) {
        console.error('Erro ao enviar lote de NF-e:', error);
        res.status(500).json({ error: 'Erro ao enviar lote de NF-e.' });
    }
};

/**
 * Retorno de Recepção de NF-e
 */
exports.retornoRecepcaoNFe = async (req, res) => {
    try {
        const { recibo } = req.body;

        if (!recibo) {
            return res.status(400).json({ message: 'Recibo é obrigatório.' });
        }

        // URL do Web Service de Retorno de Recepção
        const wsdl = 'https://nfe.sefaz.go.gov.br/nfe/services/v2/NfeRetRecepcao2?wsdl';
        const client = await soap.createClientAsync(wsdl);

        client.setSecurity(new soap.ClientSSLSecurityPFX(
            path.join(__dirname, '..', process.env.CERT_PATH),
            process.env.CERT_PASS
        ));

        const args = {
            NfeDadosMsg: recibo,
        };

        const [result] = await client.NfeRetRecepcao2Async(args);

        // Processa a resposta e atualiza as notas fiscais
        // A implementação depende da estrutura da resposta do Web Service

        res.json({ message: 'Status do lote de NF-e consultado com sucesso.', result });
    } catch (error) {
        console.error('Erro ao consultar retorno de recepção de NF-e:', error);
        res.status(500).json({ error: 'Erro ao consultar retorno de recepção de NF-e.' });
    }
};

/**
 * Cancelar NF-e
 */
exports.cancelarNFe = async (req, res) => {
    try {
        const { id, motivo } = req.body;

        if (!id || !motivo) {
            return res.status(400).json({ message: 'ID da NF-e e motivo são obrigatórios.' });
        }

        const notaFiscal = await NotaFiscal.findById(id);
        if (!notaFiscal) {
            return res.status(404).json({ message: 'Nota Fiscal não encontrada.' });
        }

        if (notaFiscal.status !== 'autorizada') {
            return res.status(400).json({ message: 'Somente NF-e autorizadas podem ser canceladas.' });
        }

        // URL do Web Service de Cancelamento
        const wsdl = 'https://nfe.sefaz.go.gov.br/nfe/services/v2/NfeCancelamento2?wsdl';
        const client = await soap.createClientAsync(wsdl);

        client.setSecurity(new soap.ClientSSLSecurityPFX(
            path.join(__dirname, '..', process.env.CERT_PATH),
            process.env.CERT_PASS
        ));

        const args = {
            NfeDadosMsg: gerarXMLCancelamento(notaFiscal.chaveAcesso, motivo),
        };

        const [result] = await client.NfeCancelamento2Async(args);

        // Processa a resposta e atualiza a nota fiscal
        // A implementação depende da estrutura da resposta do Web Service

        if (result.success) {
            notaFiscal.status = 'cancelada';
            await notaFiscal.save();
            res.json({ message: 'NF-e cancelada com sucesso.', notaFiscal });
        } else {
            res.status(500).json({ error: 'Erro ao cancelar NF-e', detalhes: result });
        }
    } catch (error) {
        console.error('Erro ao cancelar NF-e:', error);
        res.status(500).json({ error: 'Erro ao cancelar NF-e.' });
    }
};

/**
 * Inutilizar Numeração
 */
exports.inutilizarNumeracao = async (req, res) => {
    try {
        const { ano, serie, inicio, fim, motivo } = req.body;

        if (!ano || !serie || !inicio || !fim || !motivo) {
            return res.status(400).json({ message: 'Ano, série, início, fim e motivo são obrigatórios.' });
        }

        // URL do Web Service de Inutilização
        const wsdl = 'https://nfe.sefaz.go.gov.br/nfe/services/v2/NfeInutilizacao2?wsdl';
        const client = await soap.createClientAsync(wsdl);

        client.setSecurity(new soap.ClientSSLSecurityPFX(
            path.join(__dirname, '..', process.env.CERT_PATH),
            process.env.CERT_PASS
        ));

        const chave = `${process.env.UF_EMITENTE}${ano}${serie}${inicio}${fim}`;
        const dv = calcularDigitoVerificador(chave);
        const chaveInutilizacao = `${chave}${dv}`;

        const args = {
            NfeDadosMsg: gerarXMLInutilizacao(chaveInutilizacao, ano, serie, inicio, fim, motivo),
        };

        const [result] = await client.NfeInutilizacao2Async(args);

        // Processa a resposta e retorna
        if (result.success) {
            res.json({ message: 'Numeração inutilizada com sucesso.', result });
        } else {
            res.status(500).json({ error: 'Erro ao inutilizar numeração', detalhes: result });
        }

    } catch (error) {
        console.error('Erro ao inutilizar numeração:', error);
        res.status(500).json({ error: 'Erro ao inutilizar numeração.' });
    }
};

/**
 * Consultar Status do Serviço
 */
exports.consultarStatusServico = async (req, res) => {
    try {
        // URL do Web Service de Status do Serviço
        const wsdl = 'https://nfe.sefaz.go.gov.br/nfe/services/v2/NfeStatusServico2?wsdl';
        const client = await soap.createClientAsync(wsdl);

        client.setSecurity(new soap.ClientSSLSecurityPFX(
            path.join(__dirname, '..', process.env.CERT_PATH),
            process.env.CERT_PASS
        ));

        const args = {
            NfeDadosMsg: gerarXMLStatusServico(),
        };

        const [result] = await client.NfeStatusServico2Async(args);

        // Processa a resposta e retorna
        if (result.success) {
            res.json({ message: 'Status do serviço consultado com sucesso.', result });
        } else {
            res.status(500).json({ error: 'Erro ao consultar status do serviço', detalhes: result });
        }

    } catch (error) {
        console.error('Erro ao consultar status do serviço:', error);
        res.status(500).json({ error: 'Erro ao consultar status do serviço.' });
    }
};

/**
 * Gera o XML para Cancelamento de NF-e
 *
 * @param {String} chaveAcesso - Chave de acesso da NF-e a ser cancelada.
 * @param {String} motivo - Motivo do cancelamento.
 * @returns {String} - XML para cancelamento.
 */
const gerarXMLCancelamento = (chaveAcesso, motivo) => {
    return `
        <envEvento versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe">
            <idLote>1</idLote>
            <evento versao="1.00">
                <infEvento Id="ID110111${chaveAcesso}">
                    <cOrgao>${chaveAcesso.substring(0, 2)}</cOrgao>
                    <tpAmb>${process.env.AMBIENTE === 'producao' ? 1 : 2}</tpAmb>
                    <CNPJ>${process.env.CNPJ_EMITENTE}</CNPJ>
                    <chNFe>${chaveAcesso}</chNFe>
                    <dhEvento>${new Date().toISOString()}</dhEvento>
                    <tpEvento>110111</tpEvento>
                    <nSeqEvento>1</nSeqEvento>
                    <detEvento versao="1.00">
                        <descEvento>Cancelamento</descEvento>
                        <xJust>${motivo}</xJust>
                    </detEvento>
                </infEvento>
            </evento>
        </envEvento>
    `;
};

/**
 * Gera o XML para Inutilização de Numeração
 *
 * @param {String} chaveInutilizacao - Chave de inutilização.
 * @param {String} ano - Ano da NF-e.
 * @param {String} serie - Série da NF-e.
 * @param {String} inicio - Início da faixa a inutilizar.
 * @param {String} fim - Fim da faixa a inutilizar.
 * @param {String} motivo - Motivo da inutilização.
 * @returns {String} - XML para inutilização.
 */
const gerarXMLInutilizacao = (chaveInutilizacao, ano, serie, inicio, fim, motivo) => {
    return `
        <envEvento versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe">
            <idLote>1</idLote>
            <evento versao="1.00">
                <infEvento Id="ID110110${chaveInutilizacao}">
                    <cOrgao>${chaveInutilizacao.substring(0, 2)}</cOrgao>
                    <tpAmb>${process.env.AMBIENTE === 'producao' ? 1 : 2}</tpAmb>
                    <CNPJ>${process.env.CNPJ_EMITENTE}</CNPJ>
                    <chNFe>${chaveInutilizacao}</chNFe>
                    <dhEvento>${new Date().toISOString()}</dhEvento>
                    <tpEvento>110110</tpEvento>
                    <nSeqEvento>1</nSeqEvento>
                    <detEvento versao="1.00">
                        <descEvento>Inutilizacao de Numeracao</descEvento>
                        <xJust>${motivo}</xJust>
                        <infInut>
                            <tpAmb>${process.env.AMBIENTE === 'producao' ? 1 : 2}</tpAmb>
                            <xServ>INUTILIZAR</xServ>
                            <cUF>${chaveInutilizacao.substring(0, 2)}</cUF>
                            <ano>${ano}</ano>
                            <CNPJ>${process.env.CNPJ_EMITENTE}</CNPJ>
                            <mod>55</mod>
                            <serie>${serie}</serie>
                            <nNFIni>${inicio}</nNFIni>
                            <nNFFim>${fim}</nNFFim>
                            <xJust>${motivo}</xJust>
                        </infInut>
                    </detEvento>
                </infEvento>
            </evento>
        </envEvento>
    `;
};

/**
 * Gera o XML para Status do Serviço
 *
 * @returns {String} - XML para status do serviço.
 */
const gerarXMLStatusServico = () => {
    return `
        <consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
            <tpAmb>${process.env.AMBIENTE === 'producao' ? 1 : 2}</tpAmb>
            <xServ>STATUS</xServ>
        </consStatServ>
    `;
};
