# Generate-ProjectTree.ps1
# Script PowerShell para gerar uma árvore de diretórios ignorando pastas específicas

# Define os diretórios a serem ignorados
$ignoredFolders = @("node_modules", "mongo-data", "mongo-data1", "mongo-data2", "mongo-data3")

# Função recursiva para gerar a árvore de diretórios
function Get-DirectoryTree {
    param (
        [string]$Path,
        [int]$Level = 0,
        [string]$Prefix = ""
    )

    # Verifica se o diretório atual está na lista de ignorados
    if ($ignoredFolders -contains (Split-Path $Path -Leaf)) {
        return
    }

    # Obter todos os itens no diretório atual, excluindo os ignorados
    $items = Get-ChildItem -Path $Path -Force | Where-Object {
        $_.Name -notin $ignoredFolders
    } | Sort-Object -Property PSIsContainer, Name

    $count = $items.Count
    $index = 0

    foreach ($item in $items) {
        $index++
        $isLast = ($index -eq $count)
        $connector = $isLast ? "└─ " : "├─ "

        Write-Host "$Prefix$connector$item.Name"

        if ($item.PSIsContainer) {
            $newPrefix = $Prefix + ($isLast ? "   " : "│  ")
            Get-DirectoryTree -Path $item.FullName -Level ($Level + 1) -Prefix $newPrefix
        }
    }
}

# Caminho raiz do projeto (pode ser ajustado conforme necessário)
# Por padrão, utiliza o diretório atual
$rootPath = $PSScriptRoot

# Exibir a árvore no console
Write-Host "$rootPath"
Get-DirectoryTree -Path $rootPath

# Opcional: Salvar a árvore em um arquivo de texto
# Descomente as linhas abaixo se desejar salvar a saída

# $outputFile = "$rootPath\ProjectTree.txt"
# $output = & {
#     Get-ChildItem -Path $rootPath -Force | Where-Object { $_.Name -notin $ignoredFolders } | Sort-Object -Property PSIsContainer, Name
#     # Aqui você pode implementar uma lógica semelhante para capturar a saída
# }
# Get-DirectoryTree -Path $rootPath | Out-File -FilePath $outputFile -Encoding utf8
# Write-Host "Árvore de diretórios salva em $outputFile"
