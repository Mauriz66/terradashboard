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

      /* Estilos para o dashboard integrado */
      .card-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 2rem;
      }
      
      .card {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .card:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .card-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #166534;
      }
      
      .card-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 1rem;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(22, 101, 52, 0.2);
        border-top-color: #166534;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .dashboard-container {
        max-width: 900px;
        margin: 0 auto;
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 2rem;
      }

      .dashboard-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        text-align: center;
        color: #166534;
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
            <button class="btn" id="view-dashboard-btn">Visualizar Dashboard</button>
          </p>
          <p style="margin-top: 15px">
            <small>Ou visite o <a href="https://github.com/Mauriz66/terradashboard" target="_blank">GitHub do Projeto</a></small>
          </p>
        `;
        messageEl.classList.add('success-message');
        
        // Adicionar evento para exibir o dashboard
        const dashboardBtn = document.getElementById('view-dashboard-btn');
        if (dashboardBtn) {
          dashboardBtn.addEventListener('click', loadFullDashboard);
        }
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

  // Função para carregar o dashboard completo diretamente na página atual
  async function loadFullDashboard() {
    const main = document.querySelector('.dashboard-content');
    if (!main) return;
    
    // Limpar o conteúdo atual
    main.innerHTML = `
      <div class="dashboard-container">
        <div class="dashboard-title">Dashboard TerraFé</div>
        <div id="dashboard-loading" style="text-align: center; padding: 2rem;">
          <div class="spinner"></div>
          <p>Carregando dados do dashboard...</p>
        </div>
      </div>
    `;
    
    try {
      // Carregar dados de pedidos
      const ordersResponse = await fetch('/api/orders');
      const orders = await ordersResponse.json();
      
      // Carregar dados de campanhas
      const campaignsResponse = await fetch('/api/campaigns');
      const campaigns = await campaignsResponse.json();
      
      // Calcular KPIs
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum, order) => 
        sum + parseFloat(order.produto_valor_total.replace(',', '.')), 0);
      
      const totalAds = campaigns.reduce((sum, campaign) => 
        sum + parseFloat(campaign['Valor usado (BRL)'].replace('.', '').replace(',', '.')), 0);
      
      const totalConversions = campaigns.reduce((sum, campaign) => 
        sum + parseFloat(campaign['Valor de conversão de adições ao carrinho'].replace('.', '').replace(',', '.')), 0);
      
      const roi = (totalConversions - totalAds) / totalAds;
      
      // Formatar valores
      const formatCurrency = (value) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      
      const formatPercent = (value) => 
        new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 }).format(value);
      
      // Renderizar dashboard
      const dashboardContainer = document.querySelector('.dashboard-container');
      dashboardContainer.innerHTML = `
        <div class="dashboard-title">Dashboard TerraFé</div>
        <div class="card-container">
          <div class="card">
            <div class="card-title">Total de Pedidos</div>
            <div class="card-value">${totalOrders}</div>
            <p>Pedidos processados</p>
          </div>
          
          <div class="card">
            <div class="card-title">Total de Vendas</div>
            <div class="card-value">${formatCurrency(totalSales)}</div>
            <p>Receita gerada</p>
          </div>
          
          <div class="card">
            <div class="card-title">Investimento em Ads</div>
            <div class="card-value">${formatCurrency(totalAds)}</div>
            <p>Valor investido em campanhas</p>
          </div>
          
          <div class="card">
            <div class="card-title">ROI</div>
            <div class="card-value">${formatPercent(roi)}</div>
            <p>Retorno sobre investimento</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 2rem;">
          <button class="btn" id="back-btn">Voltar</button>
          <a href="https://github.com/Mauriz66/terradashboard" target="_blank" style="margin-left: 1rem;">
            <button class="btn">Acessar GitHub</button>
          </a>
        </div>
      `;
      
      // Adicionar evento para voltar
      const backBtn = document.getElementById('back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', renderDashboard);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      const dashboardContainer = document.querySelector('.dashboard-container');
      if (dashboardContainer) {
        dashboardContainer.innerHTML = `
          <div class="dashboard-title">Dashboard TerraFé</div>
          <div style="text-align: center; padding: 2rem;" class="error-message">
            <h2>Erro ao carregar dados</h2>
            <p>Não foi possível conectar com a API. Tente novamente mais tarde.</p>
            <button class="btn" id="retry-dashboard-btn">Tentar Novamente</button>
            <button class="btn" id="back-btn" style="margin-left: 1rem;">Voltar</button>
          </div>
        `;
        
        // Adicionar eventos aos botões
        const retryBtn = document.getElementById('retry-dashboard-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', loadFullDashboard);
        }
        
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
          backBtn.addEventListener('click', renderDashboard);
        }
      }
    }
  }

  // Iniciar o aplicativo quando a página estiver carregada
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderDashboard, 1000); // Pequeno atraso para mostrar a animação de carregamento
  });
})(); 