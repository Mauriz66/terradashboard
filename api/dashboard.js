export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Retornar um HTML simples que carrega a aplicação completa
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>TerraFé Dashboard</title>
        <meta name="description" content="Dashboard de análise de vendas e campanhas de marketing da TerraFé" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          }
          
          body {
            background-color: #f9fafb;
            color: #111827;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }
          
          .header {
            text-align: center;
            margin-bottom: 2rem;
            padding: 1rem;
            background-color: #166534;
            color: white;
            border-radius: 0.5rem;
          }
          
          .card-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
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
          
          .footer {
            margin-top: 2rem;
            text-align: center;
            color: #6b7280;
          }
          
          .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 200px;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(22, 101, 52, 0.2);
            border-top-color: #166534;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          
          button {
            background-color: #166534;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.25rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          button:hover {
            background-color: #115329;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TerraFé Dashboard</h1>
            <p>Análise de Vendas e Campanhas</p>
          </div>
          
          <div id="dashboard">
            <div class="loading">
              <div class="spinner"></div>
              <p>Carregando dados...</p>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2025 TerraFé</p>
          </div>
        </div>
        
        <script>
          // Função para carregar dados da API
          async function loadData() {
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
              
              // Renderizar dashboard
              renderDashboard({
                totalOrders,
                totalSales,
                totalAds,
                totalConversions,
                roi
              });
            } catch (error) {
              console.error('Erro ao carregar dados:', error);
              document.querySelector('#dashboard').innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                  <h2>Erro ao carregar dados</h2>
                  <p>Não foi possível conectar com a API. Tente novamente mais tarde.</p>
                  <button onclick="loadData()">Tentar Novamente</button>
                </div>
              `;
            }
          }
          
          // Função para renderizar o dashboard
          function renderDashboard(data) {
            const dashboardEl = document.querySelector('#dashboard');
            
            // Formatar valores
            const formatCurrency = (value) => 
              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
            
            const formatPercent = (value) => 
              new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 }).format(value);
            
            // Renderizar conteúdo
            dashboardEl.innerHTML = `
              <div class="card-container">
                <div class="card">
                  <div class="card-title">Total de Pedidos</div>
                  <div class="card-value">${data.totalOrders}</div>
                  <p>Pedidos processados</p>
                </div>
                
                <div class="card">
                  <div class="card-title">Total de Vendas</div>
                  <div class="card-value">${formatCurrency(data.totalSales)}</div>
                  <p>Receita gerada</p>
                </div>
                
                <div class="card">
                  <div class="card-title">Investimento em Ads</div>
                  <div class="card-value">${formatCurrency(data.totalAds)}</div>
                  <p>Valor investido em campanhas</p>
                </div>
                
                <div class="card">
                  <div class="card-title">ROI</div>
                  <div class="card-value">${formatPercent(data.roi)}</div>
                  <p>Retorno sobre investimento</p>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 2rem;">
                <p>Visite o repositório no GitHub para acessar o código-fonte completo:</p>
                <a href="https://github.com/Mauriz66/terradashboard" target="_blank">
                  <button>Acessar GitHub</button>
                </a>
              </div>
            `;
          }
          
          // Carregar dados ao iniciar
          window.addEventListener('DOMContentLoaded', loadData);
        </script>
      </body>
    </html>
  `);
} 