export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Simular processamento do upload
    // Em um ambiente real, aqui processaríamos o arquivo recebido
    
    // Responder com sucesso (simulado)
    res.status(200).json({
      success: true,
      message: "Arquivo processado com sucesso (simulado)",
      file: {
        id: Date.now(),
        filename: req.body?.filename || "arquivo_exemplo.csv",
        type: req.body?.type || "orders",
        date: (new Date()).toISOString(),
        period: { 
          month: req.body?.month || "04", 
          year: req.body?.year || "2023" 
        },
        status: "processed"
      }
    });
  } catch (error) {
    console.error("Erro no processamento:", error);
    res.status(500).json({ 
      error: "Falha ao processar a solicitação", 
      message: error.message || "Erro interno do servidor" 
    });
  }
} 