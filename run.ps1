# Nome do arquivo: delete_directory.ps1

# Caminho do diretório a ser deletado
$directoryPath = ".\out"

# Verifica se o diretório existe
if (Test-Path $directoryPath) {
    # Remove o diretório e todo o seu conteúdo
    Remove-Item -Path $directoryPath -Recurse -Force
    Write-Host "recompilado arquivo"
    npx tsc -p ./
    Copy-Item .\teste\teste.vcpk .\out\teste.vcpk
    Copy-Item .\teste\teste_erro_sintaxe.vcpk .\out\teste_erro_sintaxe.vcpk
} else {
    Write-Host "compilando arquivo"
    npx tsc -p ./
    Copy-Item .\teste\teste.vcpk .\out\teste.vcpk
    Copy-Item .\teste\teste_erro_sintaxe.vcpk .\out\teste_erro_sintaxe.vcpk
}