// Dados mockados para demonstração
const mockCampaigns = [
  {
    "Início dos relatórios": "2023-04-01",
    "Término dos relatórios": "2023-04-15",
    "Nome da campanha": "Campanha Páscoa 2023",
    "Alcance": 45000,
    "Impressões": 72000,
    "CPM (custo por 1.000 impressões) (BRL)": "12,50",
    "Cliques no link": 3800,
    "CPC (custo por clique no link) (BRL)": "2,35",
    "Visualizações da página de destino": 3200,
    "Custo por visualização da página de destino (BRL)": "2,78",
    "Adições ao carrinho": 950,
    "Custo por adição ao carrinho (BRL)": "9,37",
    "Valor de conversão de adições ao carrinho": "42500,00",
    "Valor usado (BRL)": "8900,00"
  },
  {
    "Início dos relatórios": "2023-04-01",
    "Término dos relatórios": "2023-04-15",
    "Nome da campanha": "Campanha Aromaterapia",
    "Alcance": 38000,
    "Impressões": 62000,
    "CPM (custo por 1.000 impressões) (BRL)": "10,80",
    "Cliques no link": 3200,
    "CPC (custo por clique no link) (BRL)": "2,10",
    "Visualizações da página de destino": 2800,
    "Custo por visualização da página de destino (BRL)": "2,40",
    "Adições ao carrinho": 780,
    "Custo por adição ao carrinho (BRL)": "8,65",
    "Valor de conversão de adições ao carrinho": "35800,00",
    "Valor usado (BRL)": "6750,00"
  },
  {
    "Início dos relatórios": "2023-04-01",
    "Término dos relatórios": "2023-04-15",
    "Nome da campanha": "Campanha Instituto",
    "Alcance": 25000,
    "Impressões": 42000,
    "CPM (custo por 1.000 impressões) (BRL)": "9,50",
    "Cliques no link": 2100,
    "CPC (custo por clique no link) (BRL)": "1,90",
    "Visualizações da página de destino": 1800,
    "Custo por visualização da página de destino (BRL)": "2,20",
    "Adições ao carrinho": 420,
    "Custo por adição ao carrinho (BRL)": "9,50",
    "Valor de conversão de adições ao carrinho": "18900,00",
    "Valor usado (BRL)": "4000,00"
  }
];

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

  try {
    // Em vez de buscar do sistema de arquivos, retornar dados mockados
    res.status(200).json(mockCampaigns);
  } catch (error) {
    console.error("Erro ao processar campanhas:", error);
    res.status(500).json({ error: "Falha ao processar campanhas", message: error.message });
  }
} 