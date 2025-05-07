// Arquivo de inicialização do TerraFé Dashboard
(function() {
  console.log('TerraFé Dashboard carregando...');

  // Função para criar um elemento
  function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Adicionar atributos
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    // Adicionar filhos
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    
    return element;
  }

  // Função para renderizar o conteúdo da página
  function renderDashboard() {
    const root = document.getElementById('root');
    root.innerHTML = '';
    
    // Criar cabeçalho
    const header = createElement('header', { class: 'dashboard-header' }, [
      createElement('h1', {}, ['TerraFé Dashboard']),
      createElement('p', {}, ['Versão de demonstração'])
    ]);
    
    // Criar conteúdo principal
    const main = createElement('main', { class: 'dashboard-content' }, [
      createElement('div', { class: 'loading-message' }, [
        'Estabelecendo conexão com a API...'
      ])
    ]);
    
    // Criar rodapé
    const footer = createElement('footer', { class: 'dashboard-footer' }, [
      createElement('p', {}, ['© 2025 TerraFé']),
      createElement('a', { href: 'https://github.com/Mauriz66/terradashboard', target: '_blank' }, ['GitHub'])
    ]);
    
    // Adicionar elementos à página
    root.appendChild(header);
    root.appendChild(main);
    root.appendChild(footer);
    
    // Aplicar estilos
    document.head.appendChild(createElement('style', {}, [`
      .dashboard-header {
        background-color: #166534;
        color: white;
        padding: 1rem;
        text-align: center;
      }
      
      .dashboard-content {
        padding: 2rem;
        flex: 1;
      }
      
      .dashboard-footer {
        background-color: #f1f5f9;
        padding: 1rem;
        text-align: center;
        display: flex;
        justify-content: center;
        gap: 1rem;
      }
      
      .loading-message {
        background-color: #e5e7eb;
        padding: 2rem;
        border-radius: 0.5rem;
        text-align: center;
        margin: 2rem auto;
        max-width: 600px;
      }

      .success-message {
        background-color: #ecfdf5;
        border: 1px solid #10b981;
      }

      .error-message {
        background-color: #fef2f2;
        border: 1px solid #ef4444;
      }

      .btn {
        display: inline-block;
        background-color: #166534;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        text-decoration: none;
        margin-top: 1rem;
        cursor: pointer;
      }

      .btn:hover {
        background-color: #115329;
      }
    `]));
    
    // Verificar a API
    checkApi();
  }

  // Função para verificar a disponibilidade da API
  async function checkApi() {
    const messageEl = document.querySelector('.loading-message');
    
    try {
      // Tentar acessar a API
      const response = await fetch('/api/orders');
      
      if (response.ok) {
        const data = await response.json();
        messageEl.innerHTML = `
          <h2>Conexão estabelecida!</h2>
          <p>Total de pedidos carregados: ${data.length}</p>
          <p>Por favor, acesse a aplicação completa em:</p>
          <p>
            <a href="/dashboard" class="btn">Acessar Dashboard Completo</a>
          </p>
          <p style="margin-top: 15px">
            <small>Ou visite o <a href="https://github.com/Mauriz66/terradashboard" target="_blank">GitHub do Projeto</a></small>
          </p>
        `;
        messageEl.classList.add('success-message');
        
        // Adicionar botão para carregar dashboard diretamente
        const dashboardBtn = messageEl.querySelector('.btn');
        dashboardBtn.addEventListener('click', function(e) {
          e.preventDefault();
          loadFullDashboard();
        });
      } else {
        throw new Error('Erro ao carregar dados');
      }
    } catch (error) {
      console.error('Erro ao acessar a API:', error);
      messageEl.innerHTML = `
        <h2>Erro ao conectar com a API</h2>
        <p>Não foi possível estabelecer conexão com o backend.</p>
        <p>Este é um ambiente de demonstração. Para executar o aplicativo completo, siga as instruções no:</p>
        <p><a href="https://github.com/Mauriz66/terradashboard" target="_blank">GitHub do Projeto</a></p>
        <p><button class="btn" id="retry-btn">Tentar Novamente</button></p>
      `;
      messageEl.classList.add('error-message');
      
      // Adicionar evento para tentar novamente
      const retryBtn = document.getElementById('retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', checkApi);
      }
    }
  }

  // Função para carregar o dashboard completo
  function loadFullDashboard() {
    const root = document.getElementById('root');
    root.innerHTML = '';
    
    // Criar elemento de carregamento
    const loadingEl = createElement('div', { class: 'loading-container' }, [
      createElement('h1', { class: 'loading-title' }, ['TerraFé Dashboard']),
      createElement('div', { class: 'loading-spinner' }, []),
      createElement('p', {}, ['Carregando dashboard completo...'])
    ]);
    
    root.appendChild(loadingEl);
    
    // Simular carregamento do app completo (em produção, carregaria os scripts/css do app real)
    setTimeout(() => {
      // Redirecionar para o endpoint que carregaria o app real se estivesse disponível
      window.location.href = '/api/dashboard';
    }, 1500);
  }

  // Iniciar o aplicativo quando a página estiver carregada
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderDashboard, 1000); // Pequeno atraso para mostrar a animação de carregamento
  });
})(); 