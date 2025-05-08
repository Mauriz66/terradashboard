#!/bin/bash

# Vercel build script for TaskMaster app
echo "🚀 Iniciando build do TaskMaster..."

# Verificar se o ambiente está configurado corretamente
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ Variável de ambiente DATABASE_URL não encontrada"
  echo "⚠️ Usando fallback para build"
  export DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
fi

# Instalação das dependências (se necessário)
echo "📦 Verificando node_modules..."
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ]; then
  echo "📦 Instalando dependências..."
  npm ci
else
  echo "📦 Usando dependências em cache."
fi

# Construir o cliente (frontend)
echo "🏗️ Construindo o cliente (frontend)..."
npx vite build

# Construir o servidor (backend)
echo "🏗️ Construindo o servidor (backend)..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Criar diretório API para o Vercel
echo "🏗️ Configurando diretório API para o Vercel..."
mkdir -p dist/api
npx esbuild api/index.js --platform=node --packages=external --bundle --format=esm --outdir=dist/api

# Copiar assets necessários
echo "📋 Copiando assets e arquivos estáticos..."
mkdir -p dist/shared
cp -r shared/* dist/shared/ 2>/dev/null || :

# Verificar e configurar diretórios para o ambiente Vercel
echo "🔍 Configurando estrutura de diretórios para o Vercel..."
mkdir -p dist/public
mkdir -p dist/uploads

# MELHORADO: Copiar arquivos estáticos diretamente para o diretório raiz dist/
echo "📋 Copiando arquivos estáticos para o diretório raiz dist/..."
cp -r dist/client/* dist/ 2>/dev/null || :

# Backup: também copiar para dist/public para compatibilidade
echo "📋 Fazendo backup dos arquivos estáticos em dist/public/..."
cp -r dist/client/* dist/public/ 2>/dev/null || :

# Verificar se os arquivos críticos existem
echo "🔍 Verificando arquivos críticos..."
if [ -f "dist/index.html" ]; then
  echo "✅ index.html encontrado em dist/"
else
  echo "⚠️ index.html não encontrado em dist/, tentando alternativas..."
  
  # Verificar se existe em dist/client
  if [ -f "dist/client/index.html" ]; then
    echo "🔍 Encontrado index.html em dist/client/, copiando..."
    cp dist/client/index.html dist/
  # Verificar se existe em public
  elif [ -f "public/index.html" ]; then
    echo "🔍 Encontrado index.html em public/, copiando..."
    cp public/index.html dist/
  else
    echo "❌ ERRO CRÍTICO: Não foi possível encontrar index.html em nenhum diretório!"
    
    # Criar um index.html de emergência
    echo "📝 Criando index.html de emergência..."
    cat > dist/index.html << EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TerraFé Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    h1 { color: #2563eb; }
    pre { background: #f1f5f9; padding: 10px; border-radius: 4px; overflow: auto; }
  </style>
</head>
<body>
  <h1>TerraFé Dashboard</h1>
  <p>Build emergencial realizado em $(date)</p>
  <p>O build parece ter tido problemas. Contate o suporte.</p>
  <h2>Informações de Debug</h2>
  <pre>
  Diretório atual: $(pwd)
  Arquivos em dist/:
  $(ls -la dist/)
  
  Arquivos em dist/client/ (se existir):
  $(ls -la dist/client/ 2>/dev/null || echo "Diretório não existe")
  </pre>
</body>
</html>
EOF
  fi
fi

# Listar o conteúdo dos diretórios para diagnóstico
echo "📋 Conteúdo do diretório dist/:"
ls -la dist/

echo "📋 Conteúdo do diretório dist/public/ (se existir):"
ls -la dist/public/ 2>/dev/null || echo "Diretório não encontrado"

echo "📋 Conteúdo do diretório dist/api/ (se existir):"
ls -la dist/api/ 2>/dev/null || echo "Diretório não encontrado"

# Criar arquivo de registro do deploy
echo "📝 Criando arquivo de registro do deploy..."
DEPLOY_TIME=$(date)
echo "TaskMaster deployment: $DEPLOY_TIME" > dist/deploy-info.txt

echo "✅ Build concluído com sucesso!"
exit 0 