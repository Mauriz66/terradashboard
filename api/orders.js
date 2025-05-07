// Dados mockados para demonstração
const mockOrders = [
  {
    "pedido_id": "PED12345",
    "pedido_data": "2023-04-15",
    "pedido_hora": "14:30",
    "pedido_status": "Entregue",
    "envio_estado": "SP",
    "produto_nome": "Óleo Essencial de Lavanda",
    "produto_valor_unitario": "89,90",
    "produto_quantidade": "1",
    "produto_valor_total": "89,90"
  },
  {
    "pedido_id": "PED12346",
    "pedido_data": "2023-04-16",
    "pedido_hora": "09:15",
    "pedido_status": "Em Processamento",
    "envio_estado": "MG",
    "produto_nome": "Kit Aromaterapia",
    "produto_valor_unitario": "149,90",
    "produto_quantidade": "1",
    "produto_valor_total": "149,90"
  },
  {
    "pedido_id": "PED12347",
    "pedido_data": "2023-04-17",
    "pedido_hora": "16:45",
    "pedido_status": "Enviado",
    "envio_estado": "RJ",
    "produto_nome": "Difusor Ultrassônico",
    "produto_valor_unitario": "199,90",
    "produto_quantidade": "1",
    "produto_valor_total": "199,90"
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
    res.status(200).json(mockOrders);
  } catch (error) {
    console.error("Erro ao processar pedidos:", error);
    res.status(500).json({ error: "Falha ao processar pedidos", message: error.message });
  }
} 