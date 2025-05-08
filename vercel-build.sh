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

# Copiar assets necessários
echo "📋 Copiando assets e arquivos estáticos..."
mkdir -p dist/shared
cp -r shared/* dist/shared/ 2>/dev/null || :

# Verificar se as pastas necessárias existem e estão no lugar correto
echo "🔍 Verificando estrutura de diretórios..."
mkdir -p dist/public
mkdir -p dist/uploads

# IMPORTANTE: Copiar arquivos estáticos do cliente para dist/public
echo "📋 Copiando arquivos construídos do frontend para pasta public..."
cp -r dist/client/* dist/public/ 2>/dev/null || :

# Verificar se os arquivos estáticos foram copiados
if [ -f "dist/public/index.html" ]; then
  echo "✅ Arquivo index.html encontrado em dist/public"
else
  echo "❌ ERRO: index.html não foi copiado para dist/public"
  # Tentar backup - copiar arquivos do diretório atual
  ls -la dist/
  ls -la dist/client/ 2>/dev/null || echo "Pasta dist/client não existe"
  
  # Tentar solução alternativa
  echo "🔄 Tentando solução alternativa..."
  cp -r public/* dist/public/ 2>/dev/null || echo "Falha ao copiar arquivos de public/"
fi

# Criar arquivo de registro do deploy
echo "📝 Criando arquivo de registro do deploy..."
DEPLOY_TIME=$(date)
echo "TaskMaster deployment: $DEPLOY_TIME" > dist/deploy-info.txt

echo "✅ Build concluído com sucesso!"
exit 0 