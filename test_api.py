import requests
import json
from datetime import datetime

# Configurações iniciais
BASE_URL = "http://localhost:8000/api"  # Atualize se necessário
USER_EMAIL = "agb_junior@live.com"
USER_PASSWORD = "mzgxdyj8"

# Headers padrão (serão atualizados após a autenticação)
headers = {
    "Content-Type": "application/json",
}

# Função para realizar login e obter o token JWT
def login(email, password):
    url = f"{BASE_URL}/auth/login"
    payload = {
        "email": email,
        "senha": password
    }
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        print(f"Login: POST {url}")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            if token:
                headers["Authorization"] = f"Bearer {token}"
                print("Login bem-sucedido. Token obtido.\n")
                return True
            else:
                print("Token não encontrado na resposta.\n")
                return False
        else:
            print(f"Erro no login: {response.text}\n")
            return False
    except Exception as e:
        print(f"Erro ao realizar login: {e}\n")
        return False

# Função genérica para testar endpoints
def test_endpoint(method, endpoint, data=None, params=None):
    url = f"{BASE_URL}{endpoint}"
    try:
        if method.lower() == 'get':
            response = requests.get(url, headers=headers, params=params)
        elif method.lower() == 'post':
            response = requests.post(url, headers=headers, data=json.dumps(data))
        elif method.lower() == 'put':
            response = requests.put(url, headers=headers, data=json.dumps(data))
        elif method.lower() == 'delete':
            response = requests.delete(url, headers=headers)
        else:
            print(f"Método HTTP '{method}' não suportado.\n")
            return None

        print(f"Teste: {method.upper()} {url}")
        print(f"Status Code: {response.status_code}")
        try:
            response_data = response.json()
            print(f"Resposta: {json.dumps(response_data, indent=2)}\n")
        except json.JSONDecodeError:
            print(f"Resposta (Texto): {response.text}\n")
        return response
    except Exception as e:
        print(f"Erro ao testar endpoint {url}: {e}\n")
        return None

# Função para obter IDs necessários para os testes
def get_existing_ids():
    ids = {
        "clientes": [],
        "mesas": [],
        "ambientes": [],
        "receitas": [],
        "produtos": [],
        "users_agents": [],
        "categories": []
    }

    # Obter clientes
    response = test_endpoint('get', '/customers')
    if response and response.status_code == 200:
        clientes = response.json()
        ids["clientes"] = [cliente["_id"] for cliente in clientes]
    else:
        print("Nenhum cliente encontrado. Criando um cliente para testes.\n")
        # Criar um cliente
        novo_cliente = {
            "nome": "Teste Cliente",
            "cpf": "000.000.000-00",
            "telefone": "11999999999",
            "email": "teste_cliente@example.com"
        }
        response = test_endpoint('post', '/customers', data=novo_cliente)
        if response and response.status_code == 201:
            cliente = response.json()["customer"]
            ids["clientes"].append(cliente["_id"])
        else:
            print("Falha ao criar cliente de teste. Alguns testes poderão falhar.\n")

    # Obter mesas
    response = test_endpoint('get', '/tables')
    if response and response.status_code == 200:
        mesas = response.json()
        ids["mesas"] = [mesa["_id"] for mesa in mesas]
    else:
        print("Nenhuma mesa encontrada. Criando uma mesa para testes.\n")
        # Criar uma mesa
        novo_ambiente_id = criar_ambiente_teste()
        if novo_ambiente_id:
            nova_mesa = {
                "numeroMesa": 999,
                "ambienteId": novo_ambiente_id,
                "position": {"x": 0, "y": 0},
                "numeroAssentos": 4,
                "capacidade": 4  # Adicionando o campo 'capacidade' conforme o erro
            }
            response = test_endpoint('post', '/tables', data=nova_mesa)
            if response and response.status_code == 201:
                mesa = response.json()["table"]
                ids["mesas"].append(mesa["_id"])
            else:
                print("Falha ao criar mesa de teste. Alguns testes poderão falhar.\n")

    # Obter ambientes
    response = test_endpoint('get', '/ambientes')
    if response and response.status_code == 200:
        ambientes = response.json()
        ids["ambientes"] = [ambiente["_id"] for ambiente in ambientes]
    else:
        print("Nenhum ambiente encontrado. Criando um ambiente para testes.\n")
        # Criar um ambiente
        novo_ambiente = {
            "nome": "Ambiente Teste",
            "limitePessoas": 50
        }
        response = test_endpoint('post', '/ambientes', data=novo_ambiente)
        if response and response.status_code == 201:
            ambiente = response.json()["ambiente"]
            ids["ambientes"].append(ambiente["_id"])
        else:
            print("Falha ao criar ambiente de teste. Alguns testes poderão falhar.\n")

    # Obter receitas
    response = test_endpoint('get', '/recipes')
    if response and response.status_code == 200:
        receitas = response.json()
        ids["receitas"] = [receita["_id"] for receita in receitas]
    else:
        print("Nenhuma receita encontrada. Criando uma receita para testes.\n")
        # Criar uma receita
        if not ids["ingredientes"]:
            print("Nenhum ingrediente disponível para criar receita.\n")
        else:
            nova_receita = {
                "nome": "Receita Teste",
                "categoria": "Pratos Principais",
                "ingredientes": [
                    {"ingrediente": ids["ingredientes"][0], "quantidade": 1}
                ],
                "precoVenda": 50.0,
                "descricao": "Descrição da receita teste."
            }
            response = test_endpoint('post', '/recipes', data=nova_receita)
            if response and response.status_code == 201:
                receita = response.json()["recipe"]
                ids["receitas"].append(receita["_id"])
            else:
                print("Falha ao criar receita de teste. Alguns testes poderão falhar.\n")

    # Obter produtos
    response = test_endpoint('get', '/products')
    if response and response.status_code == 200:
        produtos = response.json()
        ids["produtos"] = [produto["_id"] for produto in produtos]
    else:
        print("Nenhum produto encontrado. Criando um produto para testes.\n")
        # Criar um produto
        if not ids["categories"]:
            print("Nenhuma categoria disponível para criar produto.\n")
        else:
            novo_produto = {
                "nome": "Produto Teste",
                "categoria": ids["categories"][0],
                "preco": 100.0,
                "descricao": "Descrição do produto teste.",
                "disponivel": True,
                "quantidadeEstoque": 10
            }
            response = test_endpoint('post', '/products', data=novo_produto)
            if response and response.status_code == 201:
                produto = response.json()["product"]
                ids["produtos"].append(produto["_id"])
            else:
                print("Falha ao criar produto de teste. Alguns testes poderão falhar.\n")

    # Obter categorias
    response = test_endpoint('get', '/categories')
    if response and response.status_code == 200:
        categories = response.json()
        ids["categories"] = [category["_id"] for category in categories]
    else:
        print("Nenhuma categoria encontrada. Criando uma categoria para testes.\n")
        # Criar uma categoria
        nova_categoria = {
            "categoria": "Categoria Teste",
            "descricao": "Descrição da categoria teste."
        }
        response = test_endpoint('post', '/categories', data=nova_categoria)
        if response and response.status_code == 201:
            categoria = response.json()["category"]
            ids["categories"].append(categoria["_id"])
        else:
            print("Falha ao criar categoria de teste. Alguns testes poderão falhar.\n")

    # Criar um usuário com role 'agent' para metas de vendas
    def create_user_agent():
        print("Criando usuário com role 'agent' para metas de vendas...\n")
        novo_user = {
            "nome": "Agent Teste",
            "email": "agent_teste@example.com",
            "senha": "senha123",
            "role": "agent",
            "permissions": ["viewDashboard", "createOrder"]
        }
        response = test_endpoint('post', '/auth/register', data=novo_user)
        if response and response.status_code == 201:
            user = response.json()["user"]
            print(f"Usuário 'agent' criado: {user['_id']}\n")
            return user["_id"]
        else:
            print("Falha ao criar usuário 'agent'.\n")
            return None

    # Função para criar um ambiente de teste (usada se não houver ambientes)
    def criar_ambiente_teste():
        novo_ambiente = {
            "nome": "Ambiente Teste",
            "limitePessoas": 50
        }
        response = test_endpoint('post', '/ambientes', data=novo_ambiente)
        if response and response.status_code == 201:
            ambiente = response.json()["ambiente"]
            print(f"Ambiente de teste criado: {ambiente['_id']}\n")
            return ambiente["_id"]
        else:
            print("Falha ao criar ambiente de teste.\n")
            return None

    # Função principal para executar os testes
    def main():
        print("Iniciando testes do backend...\n")

        # Realizar login
        if not login(USER_EMAIL, USER_PASSWORD):
            print("Falha na autenticação. Encerrando testes.\n")
            return

        # Obter IDs necessários
        ids = get_existing_ids()

        # Criar usuário 'agent' para metas de vendas
        agent_user_id = create_user_agent()
        if agent_user_id:
            ids["users_agents"].append(agent_user_id)

        # Testar Reservas (Reservations)
        print("=== Testando Endpoints de Reservas ===\n")
        # Listar todas as reservas
        test_endpoint('get', '/reservations')

        # Criar uma nova reserva
        if ids["clientes"] and ids["mesas"]:
            nova_reserva = {
                "clienteId": ids["clientes"][0],
                "mesaId": ids["mesas"][0],
                "dataReserva": "2024-12-01T20:00:00Z",
                "numeroPessoas": 2
            }
            test_endpoint('post', '/reservations', data=nova_reserva)
        else:
            print("IDs de cliente ou mesa não disponíveis para criar uma reserva.\n")

        # Testar Mesas (Tables)
        print("=== Testando Endpoints de Mesas ===\n")
        # Listar todas as mesas
        test_endpoint('get', '/tables')

        # Criar uma nova mesa
        if ids["ambientes"]:
            nova_mesa = {
                "numeroMesa": 1000,  # Certifique-se de que este número não está em uso
                "ambienteId": ids["ambientes"][0],
                "position": {"x": 50, "y": 50},
                "numeroAssentos": 4,
                "capacidade": 4  # Adicionando o campo 'capacidade' conforme o erro
            }
            test_endpoint('post', '/tables', data=nova_mesa)
        else:
            print("ID de ambiente não disponível para criar uma mesa.\n")

        # Testar Pedidos (Orders)
        print("=== Testando Endpoints de Pedidos ===\n")
        # Listar todos os pedidos
        test_endpoint('get', '/orders')

        # Criar um novo pedido
        if ids["mesas"] and ids["receitas"] and ids["clientes"] and ids["employees"]:
            novo_pedido = {
                "mesaId": ids["mesas"][0],
                "itens": [
                    {"receita": ids["receitas"][0], "quantidade": 2}
                ],
                "clienteId": ids["clientes"][0],
                "garcomId": ids["employees"][0],
                "tipoPedido": "local"
            }
            test_endpoint('post', '/orders', data=novo_pedido)
        else:
            print("IDs necessários não disponíveis para criar um pedido.\n")

        # Testar Ingredientes (Ingredients)
        print("=== Testando Endpoints de Ingredientes ===\n")
        # Listar todos os ingredientes
        test_endpoint('get', '/ingredients')

        # Criar um novo ingrediente
        novo_ingrediente = {
            "nome": "Ingrediente Teste Python",
            "unidadeMedida": "kg",
            "quantidadeEstoque": 50,
            "precoCusto": 5.0
        }
        test_endpoint('post', '/ingredients', data=novo_ingrediente)

        # Testar Autenticação com iFood (Ifood Authentication)
        print("=== Testando Endpoints de Autenticação com iFood ===\n")
        # Iniciar autenticação
        test_endpoint('post', '/ifood/auth/start')

        # Completar autenticação (necessita de um código válido)
        # Substitua 'SOME_AUTH_CODE' pelo código real recebido durante o processo de autenticação
        # novo_auth_code = "SOME_AUTH_CODE"
        # test_endpoint('post', '/ifood/auth/complete', data={"authorizationCode": novo_auth_code})

        # Testar Produtos (Products)
        print("=== Testando Endpoints de Produtos ===\n")
        # Listar todos os produtos
        test_endpoint('get', '/products')

        # Criar um novo produto
        if ids["categories"]:
            novo_produto = {
                "nome": "Produto Teste Python",
                "categoria": ids["categories"][0],
                "preco": 150.0,
                "descricao": "Descrição do produto teste criado pelo script Python.",
                "disponivel": True,
                "quantidadeEstoque": 20
            }
            test_endpoint('post', '/products', data=novo_produto)
        else:
            print("ID de categoria não disponível para criar um produto.\n")

        # Testar Relatórios (Reports)
        print("=== Testando Endpoints de Relatórios ===\n")
        # Obter estatísticas
        test_endpoint('get', '/report/statistics')  # Certifique-se de que o caminho está correto

        # Testar Pagamentos (Payments)
        print("=== Testando Endpoints de Pagamentos ===\n")
        # Listar pedidos para escolher um para pagamento
        response = test_endpoint('get', '/orders')
        if response and response.status_code == 200:
            pedidos = response.json()
            if pedidos:
                pedido_para_pagamento = pedidos[0]["_id"]
                novo_pagamento = {
                    "pedidoId": pedido_para_pagamento,
                    "metodoPagamento": "Cartão",
                    "valorPago": 1000  # Ajuste conforme o total do pedido
                }
                test_endpoint('post', '/payments', data=novo_pagamento)
            else:
                print("Nenhum pedido disponível para processar pagamento.\n")
        else:
            print("Falha ao obter pedidos para processar pagamento.\n")

        # Testar Metas de Vendas (Sales Goals)
        print("=== Testando Endpoints de Metas de Vendas ===\n")
        # Listar metas de vendas
        test_endpoint('get', '/sales-goals')

        # Criar uma nova meta de vendas
        if ids["users_agents"]:
            nova_meta = {
                "employeeId": ids["users_agents"][0],
                "goalName": "Meta Teste Python",
                "goalAmount": 1000.0,
                "startDate": "2024-12-01",
                "endDate": "2024-12-31"
            }
            test_endpoint('post', '/sales-goals', data=nova_meta)
        else:
            print("ID de usuário 'agent' não disponível para criar uma meta de vendas.\n")

        # Testar Estoque (Stock)
        print("=== Testando Endpoints de Estoque ===\n")
        # Obter informações de estoque
        test_endpoint('get', '/stock')

        # Atualizar estoque de um produto
        if ids["produtos"]:
            produto_para_atualizar = ids["produtos"][0]
            atualizacao_estoque = {
                "quantidadeEstoque": 80
            }
            test_endpoint('put', f"/stock/{produto_para_atualizar}", data=atualizacao_estoque)
        else:
            print("ID de produto não disponível para atualizar estoque.\n")

        # Testar Categorias (Categories)
        print("=== Testando Endpoints de Categorias ===\n")
        # Listar categorias
        test_endpoint('get', '/categories')

        # Criar uma nova categoria
        nova_categoria = {
            "categoria": "Categoria Teste Python",
            "descricao": "Descrição da categoria criada pelo script Python."
        }
        test_endpoint('post', '/categories', data=nova_categoria)

        print("=== Testes concluídos ===\n")

if __name__ == "__main__":
    main()
