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
mkdir -p dist/assets

# Criar arquivo index.html no diretório raiz dist/
echo "📄 Criando arquivo index.html no diretório raiz..."
cat > dist/index.html << EOF
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzI1NjNlYiIgZD0iTTEyIDJDNi40NzcgMiAyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMnptLTEuMTc2IDEwLjg4MmMtLjE1My4yNDMtLjM1Mi40NDEtLjU5NC41OTQtLjI0My4xNTMtLjUxNi4yMy0uODIuMjNzLS41NzctLjA3Ni0uODItLjIzYy0uMjQzLS4xNTMtLjQ0MS0uMzUxLS41OTQtLjU5NC0uMTUzLS4yNDItLjIzLS41MTYtLjIzLS44MnMuMDc2LS41NzguMjMtLjgyYy4xNTMtLjI0My4zNTEtLjQ0MS41OTQtLjU5NC4yNDMtLjE1My41MTYtLjIzLjgyLS4yM3MuNTc3LjA3Ni44Mi4yM2MuMjQzLjE1My40NDEuMzUxLjU5NC41OTQuMTUzLjI0Mi4yMy41MTYuMjMuODJzLS4wNzYuNTc4LS4yMy44MnptNC4yMzUgMGMtLjE1My4yNDMtLjM1Mi40NDEtLjU5NC41OTQtLjI0My4xNTMtLjUxNi4yMy0uODIuMjNzLS41NzctLjA3Ni0uODItLjIzYy0uMjQzLS4xNTMtLjQ0MS0uMzUxLS41OTQtLjU5NC0uMTUzLS4yNDItLjIzLS41MTYtLjIzLS44MnMuMDc2LS41NzguMjMtLjgyYy4xNTMtLjI0My4zNTEtLjQ0MS41OTQtLjU5NC4yNDMtLjE1My41MTYtLjIzLjgyLS4yM3MuNTc3LjA3Ni44Mi4yM2MuMjQzLjE1My40NDEuMzUxLjU5NC41OTQuMTUzLjI0Mi4yMy41MTYuMjMuODJzLS4wNzYuNTc4LS4yMy44MnptNC4yMzUgMGMtLjE1My4yNDMtLjM1Mi40NDEtLjU5NC41OTQtLjI0My4xNTMtLjUxNi4yMy0uODIuMjNzLS41NzctLjA3Ni0uODItLjIzYy0uMjQzLS4xNTMtLjQ0MS0uMzUxLS41OTQtLjU5NC0uMTUzLS4yNDItLjIzLS41MTYtLjIzLS44MnMuMDc2LS41NzguMjMtLjgyYy4xNTMtLjI0My4zNTEtLjQ0MS41OTQtLjU5NC4yNDMtLjE1My41MTYtLjIzLjgyLS4yM3MuNTc3LjA3Ni44Mi4yM2MuMjQzLjE1My40NDEuMzUxLjU5NC41OTQuMTUzLjI0Mi4yMy41MTYuMjMuODJzLS4wNzYuNTc4LS4yMy44MnoiLz48L3N2Zz4=" />
  <title>TerraFé Dashboard</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    :root {
      --primary: #2563eb;
      --primary-dark: #1e40af;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
      --info: #6366f1;
      --background: #f8fafc;
      --text: #334155;
      --text-light: #64748b;
      --surface: #ffffff;
      --border: #e2e8f0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: var(--background);
      color: var(--text);
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
      background-color: var(--background);
      padding: 2rem;
    }
    
    .loader {
      width: 48px;
      height: 48px;
      border: 5px solid var(--primary);
      border-bottom-color: transparent;
      border-radius: 50%;
      animation: rotation 1s linear infinite;
      margin-bottom: 1.5rem;
    }
    
    .title {
      font-size: 2rem;
      font-weight: 600;
      color: var(--primary-dark);
      margin-bottom: 0.75rem;
      text-align: center;
    }
    
    .subtitle {
      font-size: 1.125rem;
      color: var(--text-light);
      margin-bottom: 2rem;
      text-align: center;
    }
    
    .buttons-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
      margin-bottom: 2rem;
    }
    
    .action-button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.375rem;
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .action-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .status-info {
      background-color: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 1rem;
      width: 100%;
      max-width: 400px;
      margin-top: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .status-info p {
      margin-bottom: 0.5rem;
      display: flex;
      justify-content: space-between;
    }
    
    .status-info p:last-child {
      margin-bottom: 0;
    }
    
    .success {
      color: var(--success);
      font-weight: 500;
    }
    
    .warning {
      color: var(--warning);
      font-weight: 500;
    }
    
    .error {
      color: var(--error);
      font-weight: 500;
    }
    
    .info {
      color: var(--info);
      font-weight: 500;
    }
    
    @keyframes rotation {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    
    @media (max-width: 768px) {
      .title {
        font-size: 1.5rem;
      }
      .subtitle {
        font-size: 1rem;
      }
      .status-info {
        max-width: 100%;
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
  <script>
    // Script inline para evitar problemas de carregamento
    window.addEventListener('DOMContentLoaded', function() {
      // Verificar se o script principal foi carregado
      setTimeout(function() {
        // Se após 3 segundos o script principal não foi carregado,
        // cria um script manualmente e o adiciona ao documento
        if (!window.appInitialized) {
          console.warn('Script principal não detectado, carregando manualmente...');
          const script = document.createElement('script');
          script.src = '/assets/index.js';
          document.body.appendChild(script);
        }
      }, 3000);
    });
  </script>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>
EOF

# Criar arquivo de script em dist/assets
echo "📝 Criando arquivo assets/index.js..."
mkdir -p dist/assets

cat > dist/assets/index.js << EOF
// Sinalizar que o script foi inicializado
window.appInitialized = true;

// Script inicial para a página de carregamento
document.addEventListener('DOMContentLoaded', function() {
  console.log('TerraFé Dashboard - Inicializando...');
  
  // Elementos da UI
  const subtitleElement = document.querySelector('.subtitle');
  const loadingContainer = document.querySelector('.loading');
  
  // Função para adicionar botão
  function addButton(text, color, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'action-button';
    button.style.backgroundColor = color;
    button.addEventListener('click', onClick);
    return button;
  }
  
  // Função para adicionar container de botões
  function createButtonContainer() {
    const container = document.createElement('div');
    container.className = 'buttons-container';
    loadingContainer.appendChild(container);
    return container;
  }
  
  // Verificar se a API está respondendo
  fetch('/api/health')
    .then(response => {
      if (!response.ok) {
        throw new Error('Resposta da API não é OK: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log('API Health Check:', data);
      
      // Mostrar status da API
      subtitleElement.textContent = 'API conectada! Versão inicial pronta para uso.';
      
      // Criar container para botões
      const buttonsContainer = createButtonContainer();
      
      // Adicionar botões de navegação
      buttonsContainer.appendChild(
        addButton('Verificar API', '#0ea5e9', () => {
          window.location.href = '/api/health';
        })
      );
      
      buttonsContainer.appendChild(
        addButton('Diagnóstico', '#6366f1', () => {
          window.location.href = '/api/_diagnostics';
        })
      );
      
      // Adicionar informações de status
      const statusInfo = document.createElement('div');
      statusInfo.className = 'status-info';
      statusInfo.innerHTML = \`
        <p>Status: <span class="success">Online</span></p>
        <p>Versão: <span class="info">Prévia</span></p>
        <p>Timestamp: <span class="info">\${new Date().toLocaleString()}</span></p>
      \`;
      loadingContainer.appendChild(statusInfo);
      
      // Parar a animação do loader
      const loader = document.querySelector('.loader');
      loader.style.animationPlayState = 'paused';
      loader.style.borderColor = '#10b981';
      loader.style.borderBottomColor = 'transparent';
    })
    .catch(error => {
      console.error('Erro ao verificar API:', error);
      
      // Atualizar mensagem
      subtitleElement.textContent = 'Erro ao conectar com a API';
      
      // Parar e mudar a cor do loader para indicar erro
      const loader = document.querySelector('.loader');
      loader.style.animationPlayState = 'paused';
      loader.style.borderColor = '#ef4444';
      loader.style.borderBottomColor = 'transparent';
      
      // Adicionar botão de diagnóstico
      const buttonsContainer = createButtonContainer();
      buttonsContainer.appendChild(
        addButton('Tentar Novamente', '#ef4444', () => {
          window.location.reload();
        })
      );
    });
});
EOF

# MELHORADO: Copiar arquivos estáticos diretamente para o diretório raiz dist/
echo "📋 Copiando arquivos estáticos para o diretório raiz dist/..."
if [ -d "dist/client/assets" ]; then
  echo "✅ Encontrado diretório assets, copiando..."
  cp -r dist/client/assets/* dist/assets/ 2>/dev/null || :
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
cp -r dist/assets dist/public/ 2>/dev/null || :

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