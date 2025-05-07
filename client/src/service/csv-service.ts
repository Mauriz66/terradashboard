import { OrderData, CampaignData } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { parseNumberBR, parseDate } from "@/lib/utils";

// Service for handling CSV data processing and API calls

// Sample order data based on the actual CSV structure
const sampleOrderData: OrderData[] = [
  // This data is empty by default and will be populated from the API
];

// Sample campaign data based on the actual CSV structure
const sampleCampaignData: CampaignData[] = [
  // This data is empty by default and will be populated from the API
];

export const fetchOrdersData = async (): Promise<OrderData[]> => {
  try {
    const response = await apiRequest("GET", "/api/orders", undefined);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching orders data:", error);
    return [];
  }
};

export const fetchCampaignsData = async (): Promise<CampaignData[]> => {
  try {
    const response = await apiRequest("GET", "/api/campaigns", undefined);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching campaigns data:", error);
    return [];
  }
};

export const uploadCSVFile = async (
  file: File,
  type: "orders" | "ads",
  month: string,
  year: string
): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  formData.append("month", month);
  formData.append("year", year);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Process and normalize orders data
export const processOrdersData = (data: OrderData[]): OrderData[] => {
  return data.map((order) => ({
    ...order,
    // Convert Brazilian date format to standard Date object if needed
    pedido_data: order.pedido_data,
    // Convert Brazilian number format (comma as decimal separator)
    produto_valor_unitario: order.produto_valor_unitario,
    produto_valor_total: order.produto_valor_total,
  }));
};

// Process and normalize campaign data
export const processCampaignsData = (data: CampaignData[]): CampaignData[] => {
  return data.map((campaign) => ({
    ...campaign,
    // Convert Brazilian number format for monetary values
    "CPM (custo por 1.000 impressões) (BRL)": campaign["CPM (custo por 1.000 impressões) (BRL)"],
    "CPC (custo por clique no link) (BRL)": campaign["CPC (custo por clique no link) (BRL)"],
    "Custo por visualização da página de destino (BRL)": campaign["Custo por visualização da página de destino (BRL)"],
    "Custo por adição ao carrinho (BRL)": campaign["Custo por adição ao carrinho (BRL)"],
    "Valor de conversão de adições ao carrinho": campaign["Valor de conversão de adições ao carrinho"],
    "Valor usado (BRL)": campaign["Valor usado (BRL)"],
  }));
};

export const calculateTotalSales = (orders: OrderData[]): number => {
  return orders.reduce(
    (total, order) => total + parseNumberBR(order.produto_valor_total),
    0
  );
};

export const calculateTotalOrdersCount = (orders: OrderData[]): number => {
  const uniqueOrderIds = new Set(orders.map((order) => order.pedido_id));
  return uniqueOrderIds.size;
};

export const calculateInstitutoVsEcommerce = (orders: OrderData[]): {
  institute: number;
  ecommerce: number;
} => {
  const result = orders.reduce(
    (acc, order) => {
      const isInstitute =
        order.produto_nome.includes("Curso") ||
        order.produto_nome.includes("Oficina");
      const amount = parseNumberBR(order.produto_valor_total);

      if (isInstitute) {
        acc.institute += amount;
      } else {
        acc.ecommerce += amount;
      }

      return acc;
    },
    { institute: 0, ecommerce: 0 }
  );

  return result;
};

export const calculateROI = (
  campaigns: CampaignData[],
  sales: number
): number => {
  const totalInvestment = campaigns.reduce(
    (total, campaign) => total + parseNumberBR(campaign["Valor usado (BRL)"]),
    0
  );

  if (totalInvestment === 0) return 0;
  return ((sales - totalInvestment) / totalInvestment) * 100;
};

export const calculateCAC = (
  campaigns: CampaignData[],
  orderCount: number
): number => {
  const totalInvestment = campaigns.reduce(
    (total, campaign) => total + parseNumberBR(campaign["Valor usado (BRL)"]),
    0
  );

  if (orderCount === 0) return 0;
  return totalInvestment / orderCount;
};
