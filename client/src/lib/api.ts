/**
 * API client para comunicação com o backend
 */

const API_BASE_URL = '/api';

// Tipos para pedidos e campanhas
export interface Order {
  pedido_id: string;
  pedido_data: string;
  pedido_hora: string;
  pedido_status: string;
  envio_estado: string;
  produto_nome: string;
  produto_valor_unitario: string;
  produto_quantidade: string;
  produto_valor_total: string;
}

export interface Campaign {
  "Início dos relatórios": string;
  "Término dos relatórios": string;
  "Nome da campanha": string;
  "Alcance": number;
  "Impressões": number;
  "CPM (custo por 1.000 impressões) (BRL)": string;
  "Cliques no link": number;
  "CPC (custo por clique no link) (BRL)": string;
  "Visualizações da página de destino": number;
  "Custo por visualização da página de destino (BRL)": string;
  "Adições ao carrinho": number;
  "Custo por adição ao carrinho (BRL)": string;
  "Valor de conversão de adições ao carrinho": string;
  "Valor usado (BRL)": string;
}

// Função para fazer requisições à API
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || 'Erro na requisição');
  }
  
  return response.json();
}

// API para pedidos
export const ordersApi = {
  getAll: (): Promise<Order[]> => apiRequest<Order[]>('/orders')
};

// API para campanhas
export const campaignsApi = {
  getAll: (): Promise<Campaign[]> => apiRequest<Campaign[]>('/campaigns')
};

// API para upload de arquivos
export const uploadApi = {
  uploadFile: (file: File, type: 'orders' | 'ads', month: string, year: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('month', month);
    formData.append('year', year);
    
    return apiRequest('/upload', {
      method: 'POST',
      headers: {
        // Não incluir Content-Type aqui, o navegador vai definir automaticamente para multipart/form-data
      },
      body: formData
    });
  }
}; 