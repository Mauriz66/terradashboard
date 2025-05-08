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
cp api/health.js dist/api/
npx esbuild api/index.js --platform=node --packages=external --bundle --format=esm --outdir=dist/api

# Copiar assets necessários
echo "📋 Copiando assets e arquivos estáticos..."
mkdir -p dist/shared
cp -r shared/* dist/shared/ 2>/dev/null || :

# Verificar e configurar diretórios para o ambiente Vercel
echo "🔍 Configurando estrutura de diretórios para o Vercel..."
mkdir -p dist/public
mkdir -p dist/uploads

# Criar arquivo index.html no diretório raiz dist/
echo "📄 Criando arquivo index.html no diretório raiz..."
cat > dist/index.html << EOF
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <title>TerraFé Dashboard</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #f8fafc;
      color: #334155;
      line-height: 1.5;
    }
    
    #root {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      width: 100%;
      background-color: #f8fafc;
    }
    
    .loader {
      width: 48px;
      height: 48px;
      border: 5px solid #2563eb;
      border-bottom-color: transparent;
      border-radius: 50%;
      animation: rotation 1s linear infinite;
      margin-bottom: 1rem;
    }
    
    .title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 0.5rem;
    }
    
    .subtitle {
      font-size: 1rem;
      color: #64748b;
    }
    
    @keyframes rotation {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="loader"></div>
      <h1 class="title">TerraFé Dashboard</h1>
      <p class="subtitle">Carregando aplicação...</p>
    </div>
  </div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>
EOF

# MELHORADO: Copiar arquivos estáticos diretamente para o diretório raiz dist/
echo "📋 Copiando arquivos estáticos para o diretório raiz dist/..."
if [ -d "dist/client/assets" ]; then
  echo "✅ Encontrado diretório assets, copiando..."
  cp -r dist/client/assets dist/
fi

# Verifique se existem outros arquivos estáticos importantes
for ext in js css ico svg png jpg webp; do
  if ls dist/client/*.${ext} 1>/dev/null 2>&1; then
    echo "📋 Copiando arquivos .${ext} para dist/..."
    cp dist/client/*.${ext} dist/ 2>/dev/null || :
  fi
done

# Backup: também copiar para dist/public para compatibilidade
echo "📋 Fazendo backup dos arquivos estáticos em dist/public/..."
cp dist/index.html dist/public/ 2>/dev/null || :
if [ -d "dist/client" ]; then
  cp -r dist/client/* dist/public/ 2>/dev/null || :
fi

# Listar o conteúdo dos diretórios para diagnóstico
echo "📋 Conteúdo do diretório dist/:"
ls -la dist/

echo "📋 Conteúdo do diretório dist/assets/ (se existir):"
ls -la dist/assets/ 2>/dev/null || echo "Diretório não encontrado"

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