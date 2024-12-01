# RESTful API para Sistema de Gerenciamento de Restaurante

## Descrição

Este é um backend desenvolvido em Node.js e Express para um sistema de gerenciamento de restaurante, que inclui funcionalidades para gerenciamento de produtos, reservas, pedidos, mesas, usuários e integração com o iFood. A API foi projetada para ser utilizada junto com um frontend que facilita a interação com as funcionalidades do sistema.

## Tecnologias Utilizadas
- Node.js
- Express.js
- MongoDB (Mongoose)
- Socket.io
- JWT (JSON Web Token) para autenticação
- Axios para integrações externas

## Funcionalidades Principais

- **Autenticação e Autorizacao**: Registro de usuários, login e gerenciamento de permissões usando JWT.
- **Produtos**: CRUD de produtos, incluindo categorias, preços e descrições.
- **Pedidos**: Registro de pedidos de clientes, gerenciamento de status e processamento de pagamentos.
- **Mesas e Ambientes**: Gerenciamento de mesas e ambientes do restaurante para alocação e reservas.
- **Reservas**: Registro e gerenciamento de reservas de clientes.
- **Integração com iFood**: Obtenção de token e integração com a plataforma de pedidos do iFood.
- **Usuários e Equipes**: Controle de acesso com diferentes permissões para administradores, gerentes, agentes e outros tipos de usuários.

## Instalação

1. Clone o repositório:
   ```sh
   git clone <URL_DO_REPOSITORIO>
   ```

2. Instale as dependências:
   ```sh
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto e defina as seguintes variáveis:
   ```
   PORT=5000
   MONGO_URI=<sua_mongo_uri>
   JWT_SECRET=<seu_segredo_jwt>
   PAYMENT_API_KEY=<api_key_de_pagamento>
   DELIVERY_PLATFORM_API_KEY=<api_key_ifood>
   IFOOD_CLIENT_ID=<ifood_client_id>
   IFOOD_CLIENT_SECRET=<ifood_client_secret>
   ```

4. Execute a aplicação:
   ```sh
   npm start
   ```

## Endpoints Principais

### Autenticação
- **POST /api/auth/register**: Registro de novo usuário
- **POST /api/auth/login**: Login de usuário e geração de token JWT

### Produtos
- **GET /api/products**: Listar produtos
- **POST /api/products**: Criar novo produto
- **PUT /api/products/:id**: Atualizar produto
- **DELETE /api/products/:id**: Deletar produto

### Reservas
- **GET /api/reservations**: Listar reservas
- **POST /api/reservations**: Criar nova reserva
- **PUT /api/reservations/:id**: Atualizar reserva
- **DELETE /api/reservations/:id**: Deletar reserva

### Integração com iFood
- **POST /api/integrations/ifood/token**: Obter token de autenticação do iFood

## Middleware de Limitação de Requisição

Este projeto utiliza o `express-rate-limit` para limitar o número de requisições consecutivas de um mesmo IP, evitando abusos e melhorando a segurança.

## Autenticação e Permissões

As rotas são protegidas por autenticação JWT e cada usuário tem permissões específicas. As permissões variam de acordo com a função do usuário:
- **Admin**: Acesso total
- **Gerente**: Permissões para gerenciar produtos, estoques, vendas e equipes
- **Agente**: Permissões limitadas para criar pedidos e gerenciar vendas
- **Feeder**: Visualização de produtos

## Estrutura de Pastas

- **app.js**: Arquivo principal do servidor.
- **routes/**: Contém as rotas de cada recurso (autenticação, produtos, pedidos, etc.).
- **models/**: Modelos Mongoose para interação com o MongoDB.
- **controllers/**: Contém a lógica de negócios para cada rota.
- **middlewares/**: Middleware para tratamento de erros e outras funcionalidades.

## Rodando Testes

Para rodar os testes, use o comando abaixo:
```sh
npm test
```

## Contribuições

Sinta-se à vontade para contribuir! Basta fazer um fork deste repositório e enviar um pull request com suas melhorias.

## Licença

Este projeto é licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

