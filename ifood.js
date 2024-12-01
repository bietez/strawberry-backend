// Importando as dependências
const axios = require('axios');
const readline = require('readline');
const qs = require('querystring');

// Configuração do MongoDB e variáveis de ambiente
require('dotenv').config();

const IFOOD_CLIENT_ID = process.env.IFOOD_CLIENT_ID;
const IFOOD_CLIENT_SECRET = process.env.IFOOD_CLIENT_SECRET;
const IFOOD_TOKEN_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';

// Inicializando a leitura de entrada do console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para solicitar o código de usuário do iFood
envocarTokenUsuario();

function envocarTokenUsuario() {
  axios.post('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/userCode', qs.stringify({
    clientId: IFOOD_CLIENT_ID
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
    .then((response) => {
      const { userCode, authorizationCodeVerifier, verificationUrlComplete } = response.data;
      console.log(`\nPor favor, acesse o seguinte link para autorizar o aplicativo: ${verificationUrlComplete}`);
      console.log(`\nuserCode: ${userCode}`);
      console.log(`\nauthorizationCodeVerifier: ${authorizationCodeVerifier}`);
      aguardarCodigoDeAutorizacao(authorizationCodeVerifier);
    })
    .catch((error) => {
      console.error("Erro ao obter o userCode: ", error.response ? error.response.data : error.message);
    });
}

function aguardarCodigoDeAutorizacao(authorizationCodeVerifier) {
  rl.question('\nDigite o código de autorização fornecido pelo portal do iFood: ', (authorizationCode) => {
    obterTokenDeAcesso(authorizationCode, authorizationCodeVerifier);
  });
}

// Função para obter o token de acesso usando o código de autorização fornecido pelo iFood
function obterTokenDeAcesso(authorizationCode, authorizationCodeVerifier) {
  axios.post(IFOOD_TOKEN_URL, qs.stringify({
    grantType: 'authorization_code',
    clientId: IFOOD_CLIENT_ID,
    clientSecret: IFOOD_CLIENT_SECRET,
    authorizationCode: authorizationCode,
    authorizationCodeVerifier: authorizationCodeVerifier
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
    .then((response) => {
      console.log('Token de acesso obtido com sucesso:', response.data);
      rl.close();
    })
    .catch((error) => {
      console.error("Erro ao obter o token de acesso do iFood: ", error.response ? error.response.data : error.message);
      rl.close();
    });
}