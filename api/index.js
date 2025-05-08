// Serverless API Handler para o Vercel
import '../dist/index.js';

// Exportando aplicativo Express para o Vercel
export default function handler(req, res) {
  // Este arquivo serve apenas como wrapper para o Vercel
  // A verdadeira lógica está no index.js importado acima
  res.status(404).json({
    error: 'Esta rota deve ser chamada diretamente pelo Express',
    message: 'Se você está vendo esta mensagem, o roteamento está incorreto.'
  });
} 