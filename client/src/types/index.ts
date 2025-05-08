// Order/Sales Data Types
export interface OrderData {
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

// Ad Campaign Data Types
export interface CampaignData {
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

// Filter Context Types
export interface DateRangeType {
  from: Date;
  to: Date;
}

export interface FilterState {
  dateRange: DateRangeType;
  category: string;
  product: string;
  state: string;
  orderStatus: string;
  campaign: string;
  source: string;
}

// Dashboard Context Types
export interface KPIData {
  totalSales: number;
  totalOrders: number;
  roi: number;
  cac: number;
  conversionRate: number;
  institutePercentage: number;
  ecommercePercentage: number;
  instituteSales: number;
  ecommerceSales: number;
}

export interface DataFile {
  id: number;
  filename: string;
  type: "orders" | "ads";
  date: string;
  period: {
    month: string;
    year: string;
  };
  status: "pending" | "processed" | "error";
}

export interface UploadFileResponse {
  success: boolean;
  message: string;
  file?: DataFile;
}
