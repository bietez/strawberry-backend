// utils/notaFiscalUtil.js

/**
 * notaFiscalUtil.js
 * Gera o XML necessário para envio à SEFAZ e inclui assinatura digital, com ajustes para o ramo de restaurantes.
 */

const crypto = require("crypto"); // Para operações criptográficas
const fs = require("fs"); // Para carregar o certificado
const xmlbuilder = require('xmlbuilder'); // Para construir o XML
const { SignedXml } = require('xml-crypto'); // Para assinatura digital conforme padrão XML DSig

/**
 * Gera o XML da NF-e a partir do objeto NotaFiscal.
 *
 * @param {Object} notaFiscal - Objeto NotaFiscal do banco de dados.
 * @returns {String} - XML da NF-e assinada.
 */
const gerarXML = (notaFiscal) => {
    // Gera a chave de acesso se não existir
    if (!notaFiscal.chaveAcesso) {
        notaFiscal.chaveAcesso = gerarChaveAcesso(notaFiscal);
    }

    // Inicia a construção do XML
    const xml = xmlbuilder.create('NFe', { encoding: 'UTF-8' })
        .att('xmlns', 'http://www.portalfiscal.inf.br/nfe')
        .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
        .att('xsi:schemaLocation', 'http://www.portalfiscal.inf.br/nfe nfe_v4.00.xsd')
        .ele('infNFe', { Id: `NFe${notaFiscal.chaveAcesso}`, versao: '4.00' })
            .ele('ide')
                .ele('cUF', notaFiscal.ide.cUF).up()
                .ele('cNF', notaFiscal.ide.cNF).up()
                .ele('natOp', notaFiscal.ide.natOp).up()
                .ele('mod', notaFiscal.ide.mod).up()
                .ele('serie', notaFiscal.ide.serie).up()
                .ele('nNF', notaFiscal.ide.nNF).up()
                .ele('dhEmi', notaFiscal.ide.dhEmi).up()
                .ele('dhSaiEnt', notaFiscal.ide.dhSaiEnt).up()
                .ele('tpNF', notaFiscal.ide.tpNF).up()
                .ele('idDest', notaFiscal.ide.idDest).up()
                .ele('cMunFG', notaFiscal.ide.cMunFG).up()
                .ele('tpImp', notaFiscal.ide.tpImp).up()
                .ele('tpEmis', notaFiscal.ide.tpEmis).up()
                .ele('cDV', notaFiscal.ide.cDV).up()
                .ele('tpAmb', notaFiscal.ide.tpAmb).up()
                .ele('finNFe', notaFiscal.ide.finNFe).up()
                .ele('indFinal', notaFiscal.ide.indFinal).up()
                .ele('indPres', notaFiscal.ide.indPres).up()
                .ele('procEmi', notaFiscal.ide.procEmi).up()
                .ele('verProc', notaFiscal.ide.verProc).up()
                .up()
            .ele('emit')
                .ele('CNPJ', notaFiscal.emit.CNPJ).up()
                .ele('xNome', notaFiscal.emit.xNome).up()
                .ele('xFant', notaFiscal.emit.xFant).up()
                .ele('enderEmit')
                    .ele('xLgr', notaFiscal.emit.enderEmit.xLgr).up()
                    .ele('nro', notaFiscal.emit.enderEmit.nro).up()
                    .ele('xBairro', notaFiscal.emit.enderEmit.xBairro).up()
                    .ele('cMun', notaFiscal.emit.enderEmit.cMun).up()
                    .ele('xMun', notaFiscal.emit.enderEmit.xMun).up()
                    .ele('UF', notaFiscal.emit.enderEmit.UF).up()
                    .ele('CEP', notaFiscal.emit.enderEmit.CEP).up()
                    .ele('cPais', notaFiscal.emit.enderEmit.cPais).up()
                    .ele('xPais', notaFiscal.emit.enderEmit.xPais).up()
                    .ele('fone', notaFiscal.emit.enderEmit.fone).up()
                    .up()
                .ele('IE', notaFiscal.emit.IE).up()
                .ele('CRT', notaFiscal.emit.CRT).up()
                .up()
            .ele('dest')
                .ele('CNPJ', notaFiscal.dest.CNPJ || '').up()
                .ele('CPF', notaFiscal.dest.CPF || '').up()
                .ele('xNome', notaFiscal.dest.xNome).up()
                .ele('enderDest')
                    .ele('xLgr', notaFiscal.dest.enderDest.xLgr).up()
                    .ele('nro', notaFiscal.dest.enderDest.nro).up()
                    .ele('xBairro', notaFiscal.dest.enderDest.xBairro).up()
                    .ele('cMun', notaFiscal.dest.enderDest.cMun).up()
                    .ele('xMun', notaFiscal.dest.enderDest.xMun).up()
                    .ele('UF', notaFiscal.dest.enderDest.UF).up()
                    .ele('CEP', notaFiscal.dest.enderDest.CEP).up()
                    .ele('cPais', notaFiscal.dest.enderDest.cPais).up()
                    .ele('xPais', notaFiscal.dest.enderDest.xPais).up()
                    .ele('fone', notaFiscal.dest.enderDest.fone).up()
                    .up()
                .up()
            .ele('det') // Início dos Detalhes dos Produtos
    ;

    // Iteração sobre os produtos para adicionar múltiplos <det>
    notaFiscal.produtos.forEach((produto, index) => {
        xml.ele('det', { nItem: index + 1 })
            .ele('prod')
                .ele('cProd', produto.cProd).up()
                .ele('xProd', produto.xProd).up()
                .ele('NCM', produto.NCM).up()
                .ele('CFOP', produto.CFOP).up()
                .ele('uCom', produto.uCom).up()
                .ele('qCom', produto.qCom).up()
                .ele('vUnCom', produto.vUnCom).up()
                .ele('vProd', produto.vProd).up()
                .ele('indTot', produto.indTot).up()
                .up()
            .ele('imposto')
                .ele('ICMS')
                    .ele('ICMS00')
                        .ele('orig', produto.imposto.ICMS.ICMS00.orig).up()
                        .ele('CST', produto.imposto.ICMS.ICMS00.CST).up()
                        .ele('modBC', produto.imposto.ICMS.ICMS00.modBC).up()
                        .ele('vBC', produto.imposto.ICMS.ICMS00.vBC).up()
                        .ele('pICMS', produto.imposto.ICMS.ICMS00.pICMS).up()
                        .ele('vICMS', produto.imposto.ICMS.ICMS00.vICMS).up()
                        .up()
                    .up()
                .ele('PIS')
                    .ele('PISAliq')
                        .ele('CST', produto.imposto.PIS.PISAliq.CST).up()
                        .ele('vBC', produto.imposto.PIS.PISAliq.vBC).up()
                        .ele('pPIS', produto.imposto.PIS.PISAliq.pPIS).up()
                        .ele('vPIS', produto.imposto.PIS.PISAliq.vPIS).up()
                        .up()
                    .up()
                .ele('COFINS')
                    .ele('COFINSAliq')
                        .ele('CST', produto.imposto.COFINS.COFINSAliq.CST).up()
                        .ele('vBC', produto.imposto.COFINS.COFINSAliq.vBC).up()
                        .ele('pCOFINS', produto.imposto.COFINS.COFINSAliq.pCOFINS).up()
                        .ele('vCOFINS', produto.imposto.COFINS.COFINSAliq.vCOFINS).up()
                        .up()
                    .up()
                .up()
            .up();
    });

    // Continuação do XML após os produtos
    xml.up() // Fecha o último <det>
        .ele('total')
            .ele('ICMSTot')
                .ele('vBC', notaFiscal.total.ICMSTot.vBC).up()
                .ele('vICMS', notaFiscal.total.ICMSTot.vICMS).up()
                .ele('vPIS', notaFiscal.total.ICMSTot.vPIS).up()
                .ele('vCOFINS', notaFiscal.total.ICMSTot.vCOFINS).up()
                .ele('vProd', notaFiscal.total.ICMSTot.vProd).up()
                .ele('vNF', notaFiscal.total.ICMSTot.vNF).up()
                .up()
            .up()
        .ele('transp')
            .ele('modFrete', notaFiscal.transp.modFrete).up()
            .up()
        .ele('infAdic')
            .ele('infCpl', notaFiscal.infAdic.infCpl).up()
            .up()
        .up()
        .end({ pretty: true });

    // Assinar o XML
    const xmlAssinado = assinarXML(xml);

    return xmlAssinado;
};

/**
 * Assina digitalmente o XML da NF-e usando a biblioteca xml-crypto.
 *
 * @param {String} xml - XML da NF-e gerado sem assinatura.
 * @returns {String} - XML da NF-e assinado.
 */
const assinarXML = (xml) => {
    const sig = new SignedXml();
    sig.addReference("//*[local-name(.)='infNFe']", [
        "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
        "http://www.w3.org/2001/10/xml-exc-c14n#"
    ]);

    // Carrega o certificado e a chave privada
    const privateKey = fs.readFileSync("./certificados/seu_certificado.pem", "utf8"); // Atualize o caminho conforme necessário
    sig.signingKey = privateKey;

    // Inclui o certificado no XML
    sig.keyInfoProvider = {
        getKeyInfo: () => `<X509Data><X509Certificate>${obterCertificadoBase64(privateKey)}</X509Certificate></X509Data>`
    };

    sig.computeSignature(xml, {
        location: { reference: "//*[local-name(.)='infNFe']", action: 'append' }
    });

    return sig.getSignedXml();
};

/**
 * Extrai o certificado em formato Base64 a partir da chave privada.
 *
 * @param {String} privateKey - Chave privada em formato PEM.
 * @returns {String} - Certificado em formato Base64.
 */
const obterCertificadoBase64 = (privateKey) => {
    // Este é um exemplo simplificado.
    // Na prática, você deve extrair o certificado correspondente à chave privada.
    // Pode ser necessário armazenar o certificado separadamente ou extrair de um arquivo PKCS#12 (.pfx/.p12).
    // Aqui assumimos que o certificado está disponível no mesmo arquivo.
    // Atualize conforme sua implementação.

    // Exemplo de leitura do certificado de um arquivo separado
    const certPath = "./certificados/seu_certificado.crt"; // Atualize o caminho conforme necessário
    const certificado = fs.readFileSync(certPath, "utf8");
    const certificadoBase64 = certificado
        .replace("-----BEGIN CERTIFICATE-----", "")
        .replace("-----END CERTIFICATE-----", "")
        .replace(/\s+/g, '');
    return certificadoBase64;
};

/**
 * Gera a chave de acesso da NF-e.
 *
 * @param {Object} notaFiscal - Objeto NotaFiscal do banco de dados.
 * @returns {String} - Chave de acesso gerada.
 */
const gerarChaveAcesso = (notaFiscal) => {
    // Estrutura oficial da chave de acesso da NF-e:
    // 44 dígitos: [cUF][AAMM][CNPJ][mod][serie][nNF][tpEmis][cNF][cDV]

    const cUF = notaFiscal.ide.cUF; // 2 dígitos
    const AAMM = notaFiscal.ide.dhEmi.slice(2, 4) + notaFiscal.ide.dhEmi.slice(5, 7); // 4 dígitos (Ano e Mês)
    const CNPJ = notaFiscal.emit.CNPJ; // 14 dígitos
    const mod = notaFiscal.ide.mod; // 2 dígitos
    const serie = notaFiscal.ide.serie; // 3 dígitos
    const nNF = notaFiscal.ide.nNF.toString().padStart(9, '0'); // 9 dígitos
    const tpEmis = notaFiscal.ide.tpEmis; // 1 dígito
    const cNF = gerarCodigoRandomico(8); // 8 dígitos
    const chaveSemDV = `${cUF}${AAMM}${CNPJ}${mod}${serie}${nNF}${tpEmis}${cNF}`;
    const cDV = calcularDigitoVerificador(chaveSemDV);

    return `${chaveSemDV}${cDV}`;
};

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

module.exports = {
    gerarXML,
    gerarChaveAcesso,
    calcularDigitoVerificador
};
