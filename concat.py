import os
import fnmatch

def concatenar_js(diretorio_base, arquivo_saida, excluir_pastas=['node_modules']):
    """
    Percorre recursivamente o diretório_base, lê todos os arquivos .js excluindo
    as pastas especificadas e concatena seu conteúdo em arquivo_saida.

    :param diretorio_base: Diretório a partir do qual iniciar a busca.
    :param arquivo_saida: Caminho do arquivo onde o conteúdo será salvo.
    :param excluir_pastas: Lista de pastas a serem excluídas da busca.
    """
    with open(arquivo_saida, 'w', encoding='utf-8') as saida:
        for raiz, dirs, arquivos in os.walk(diretorio_base):
            # Remover as pastas a serem excluídas da lista de diretórios a percorrer
            dirs[:] = [d for d in dirs if d not in excluir_pastas]
            
            for arquivo in arquivos:
                if fnmatch.fnmatch(arquivo, '*.js'):
                    caminho_arquivo = os.path.join(raiz, arquivo)
                    try:
                        with open(caminho_arquivo, 'r', encoding='utf-8') as f:
                            conteudo = f.read()
                            saida.write(f'// Conteúdo de: {caminho_arquivo}\n')
                            saida.write(conteudo)
                            saida.write('\n\n')  # Adiciona duas quebras de linha entre arquivos
                    except Exception as e:
                        print(f'Erro ao ler {caminho_arquivo}: {e}')

if __name__ == "__main__":
    # Define o diretório base (pode ser ajustado conforme necessário)
    diretorio_base = '.'  # Diretório atual

    # Define o nome do arquivo de saída
    arquivo_saida = 'todos_os_scripts.js'

    concatenar_js(diretorio_base, arquivo_saida)
    print(f'Todos os arquivos .js foram concatenados em {arquivo_saida}')
