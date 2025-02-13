// utils/parseDanfe.js

const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Lê um DANFE em PDF (que contenha texto) e tenta extrair informações de:
 *   - Número da NF
 *   - Data de Emissão
 *   - Fornecedor
 *   - Valor Total
 *   - Impostos (ex.: ICMS)
 *
 * @param {string} pdfFilePath - Caminho do PDF a ser lido
 * @returns {Promise<{
 *   numero: string,
 *   dataEmissao: string,
 *   fornecedor: string,
 *   valorTotal: number,
 *   impostos: {
 *     ICMS?: number,
 *     PIS?: number,
 *     COFINS?: number,
 *     [key: string]: number | undefined
 *   }
 * }>}
 */
async function lerDanfePdf(pdfFilePath) {
  // Carrega o arquivo em buffer
  const pdfBuffer = fs.readFileSync(pdfFilePath);

  // Faz o parse usando pdf-parse
  const pdfData = await pdfParse(pdfBuffer);
  const text = pdfData.text || '';

  // Inicia variáveis de resultado
  let numero = '';
  let dataEmissao = '';
  let fornecedor = '';
  let valorTotal = 0;
  let impostos = {};

  // 1) Regex para tentar captar o número da NF
  const matchNumero = text.match(/(?:N(?:ú|u)mero|NF[\s.:]+)\s*[:=]?\s*(\d+)/i);
  if (matchNumero && matchNumero[1]) {
    numero = matchNumero[1].trim();
  }

  // 2) Regex para Data de Emissão
  const matchData = text.match(/Data\s+Emiss[aã]o\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (matchData && matchData[1]) {
    dataEmissao = matchData[1].trim();
  }

  // 3) Regex para Fornecedor (Razão Social / Nome)
  const matchFornec = text.match(/Fornecedor:\s*(.+)/i);
  if (matchFornec && matchFornec[1]) {
    fornecedor = matchFornec[1].split('\n')[0].trim();
  }

  // 4) Regex para Valor Total
  const matchValor = text.match(/Valor\s+Total\s*:\s*([\d.,]+)/i);
  if (matchValor && typeof matchValor[1] === 'string') {
    const valorStr = matchValor[1]
      .replace(/\./g, '') // remove pontos
      .replace(',', '.'); // troca vírgula decimal por ponto
    valorTotal = parseFloat(valorStr) || 0;
  }

  // 5) Regex para Impostos (exemplo para ICMS)
  const matchICMS = text.match(/ICMS\s*:\s*([\d.,]+)/i);
  if (matchICMS && typeof matchICMS[1] === 'string') {
    const icmsStr = matchICMS[1]
      .replace(/\./g, '')
      .replace(',', '.');
    impostos.ICMS = parseFloat(icmsStr) || 0;
  }

  // Retorna o resultado
  return {
    numero,
    dataEmissao,
    fornecedor,
    valorTotal,
    impostos,
  };
}

module.exports = { lerDanfePdf };
