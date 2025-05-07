import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import { 
  formatCurrency, 
  formatPercentage, 
  formatROI,
  calculateROI, 
  exportDashboardAsPDF
} from "@/lib/utils";
import { useDashboardContext } from "@/context/dashboard-context";
import { useFilterContext } from "@/context/filter-context";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  TooltipProps,
} from "recharts";
import { getQueryFn } from "@/lib/queryClient";
import { 
  formatDate, 
  parseDate, 
  parseNumberBR,
  calculatePercentage
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FileUp,
  Download,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCSV } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Cores com melhor contraste
const COLORS = [
  "hsl(215, 90%, 50%)",  // Azul vibrante
  "hsl(160, 70%, 45%)",  // Verde vibrante
  "hsl(25, 90%, 55%)",   // Laranja vibrante
  "hsl(275, 80%, 60%)",  // Roxo vibrante
  "hsl(340, 80%, 55%)",  // Rosa vibrante
  "hsl(190, 90%, 50%)",  // Azul turquesa vibrante
  "hsl(55, 90%, 50%)",   // Amarelo vibrante
  "hsl(0, 85%, 60%)",    // Vermelho vibrante
];

// CustomTooltip aprimorado para gráficos
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 p-4 border rounded-lg shadow-lg">
        <div className="font-medium mb-2 border-b pb-2">{`${label}`}</div>
        <div className="space-y-1">
          {payload.map((entry, index) => {
            // Determinar o tipo de valor para usar o formatador adequado
            let formattedValue;
            if (entry.value instanceof Date) {
              formattedValue = formatDate(entry.value);
            } else if (typeof entry.value === 'number') {
              if (entry.name?.includes('R$') || entry.name?.includes('Vendas')) {
                formattedValue = formatCurrency(entry.value);
              } else if (entry.name?.includes('ROI')) {
                formattedValue = formatROI(entry.value);
              } else if (entry.name?.includes('%')) {
                formattedValue = formatPercentage(entry.value);
              } else {
                formattedValue = entry.value.toLocaleString();
              }
            } else {
              formattedValue = entry.value;
            }
            
            // Ícone baseado no tipo de dado
            let icon = null;
            if (entry.name?.includes('Vendas')) {
              icon = <Icons.shoppingCart className="h-4 w-4 mr-2" />;
            } else if (entry.name?.includes('ROI')) {
              icon = <Icons.trendingUp className="h-4 w-4 mr-2" />;
            } else if (entry.name?.includes('Clique')) {
              icon = <Icons.mousePointer className="h-4 w-4 mr-2" />;
            } else if (entry.name?.includes('Campanha')) {
              icon = <Icons.zap className="h-4 w-4 mr-2" />;
            }
            
            return (
              <div 
                key={`item-${index}`} 
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center font-medium" style={{ color: entry.color }}>
                  {icon}
                  {entry.name}:
                </div>
                <div className="ml-3 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  {formattedValue}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

// Função para preparar os dados para exportação em CSV
function prepareMetricsForExport(salesData: any[], adsData: any[], kpis: any) {
  // Resumo geral
  const summary = [
    {
      categoria: 'Resumo Geral',
      metrica: 'Total de Vendas',
      valor: formatCurrency(kpis.totalSales),
      valorNumerico: kpis.totalSales
    },
    {
      categoria: 'Resumo Geral',
      metrica: 'Quantidade de Pedidos',
      valor: kpis.totalOrders.toString(),
      valorNumerico: kpis.totalOrders
    },
    {
      categoria: 'Resumo Geral',
      metrica: 'ROI',
      valor: formatROI(kpis.roi),
      valorNumerico: kpis.roi
    },
    {
      categoria: 'Resumo Geral',
      metrica: 'CAC',
      valor: formatCurrency(kpis.cac),
      valorNumerico: kpis.cac
    },
    {
      categoria: 'Divisão por Categoria',
      metrica: 'Instituto',
      valor: formatPercentage(kpis.institutePercentage),
      valorNumerico: kpis.instituteSales
    },
    {
      categoria: 'Divisão por Categoria',
      metrica: 'E-commerce',
      valor: formatPercentage(kpis.ecommercePercentage),
      valorNumerico: kpis.ecommerceSales
    }
  ];
  
  // Detalhamento de produtos mais vendidos
  const productSales = salesData.reduce((acc: any, order: any) => {
    const product = order.produto_nome;
    const value = parseNumberBR(order.produto_valor_total);
    const quantity = parseInt(order.produto_quantidade);
    
    if (acc[product]) {
      acc[product].quantidade += quantity;
      acc[product].valor += value;
    } else {
      acc[product] = {
        quantidade: quantity,
        valor: value
      };
    }
    
    return acc;
  }, {});
  
  const productSummary = Object.entries(productSales)
    .sort((a: any, b: any) => b[1].valor - a[1].valor)
    .map(([product, data]: [string, any]) => ({
      categoria: 'Produtos',
      metrica: product,
      valor: `${data.quantidade}x (${formatCurrency(data.valor)})`,
      valorNumerico: data.valor
    }));
  
  // Detalhamento por estados
  const stateSales = salesData.reduce((acc: any, order: any) => {
    const state = order.envio_estado;
    const value = parseNumberBR(order.produto_valor_total);
    
    if (acc[state]) {
      acc[state] += value;
    } else {
      acc[state] = value;
    }
    
    return acc;
  }, {});
  
  const stateSummary = Object.entries(stateSales)
    .sort((a: any, b: any) => b[1] - a[1])
    .map(([state, value]: [string, any]) => ({
      categoria: 'Estados',
      metrica: state,
      valor: formatCurrency(value),
      valorNumerico: value
    }));
  
  // Detalhamento de campanhas
  const campaignSummary = adsData.map((campaign: any) => ({
    categoria: 'Campanhas',
    metrica: campaign['Nome da campanha'],
    valor: formatCurrency(parseNumberBR(campaign['Valor usado (BRL)'])),
    valorNumerico: parseNumberBR(campaign['Valor usado (BRL)'])
  }));
  
  return [...summary, ...productSummary, ...stateSummary, ...campaignSummary];
}

// Componente aprimorado para exportação de dados
function ExportDataButton({ salesData, adsData, kpis }: { salesData: any[], adsData: any[], kpis: any }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<"csv" | "pdf" | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  const handleExportCSV = () => {
    setExportLoading(true);
    setTimeout(() => {
      const data = prepareMetricsForExport(salesData, adsData, kpis);
      downloadCSV(data, `terrafe-relatorio-metricas-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
      setExportLoading(false);
      setDialogOpen(false);
    }, 1000);
  };
  
  const handleExportPDF = () => {
    setExportLoading(true);
    setTimeout(() => {
      exportDashboardAsPDF('Dashboard', { kpis });
      setExportLoading(false);
      setDialogOpen(false);
    }, 1000);
  };
  
  const startExport = () => {
    if (exportType === "csv") {
      handleExportCSV();
    } else if (exportType === "pdf") {
      handleExportPDF();
    }
  };
  
  return (
    <div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Exportar
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DialogTrigger asChild onClick={() => setExportType("csv")}>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                Exportar como CSV
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogTrigger asChild onClick={() => setExportType("pdf")}>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                Exportar como PDF
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {exportType === "csv" ? "Exportar dados como CSV" : "Exportar relatório como PDF"}
            </DialogTitle>
            <DialogDescription>
              {exportType === "csv" 
                ? "Exporte todos os dados brutos em formato CSV para análise em Excel ou outras ferramentas."
                : "Exporte um relatório formatado em PDF com as principais métricas e gráficos."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-2 flex items-center">
                <Icons.fileText className="mr-2 h-4 w-4" />
                O relatório incluirá:
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <Icons.check className="mr-2 h-4 w-4 text-green-500" />
                  KPIs principais (Vendas Totais, ROI, CAC)
                </li>
                <li className="flex items-center">
                  <Icons.check className="mr-2 h-4 w-4 text-green-500" />
                  Distribuição por categoria (Instituto vs E-commerce)
                </li>
                {exportType === "csv" && (
                  <>
                    <li className="flex items-center">
                      <Icons.check className="mr-2 h-4 w-4 text-green-500" />
                      Análise detalhada de cada produto
                    </li>
                    <li className="flex items-center">
                      <Icons.check className="mr-2 h-4 w-4 text-green-500" />
                      Performance por campanha e estado
                    </li>
                  </>
                )}
                {exportType === "pdf" && (
                  <>
                    <li className="flex items-center">
                      <Icons.check className="mr-2 h-4 w-4 text-green-500" />
                      Gráficos e visualizações de dados
                    </li>
                    <li className="flex items-center">
                      <Icons.check className="mr-2 h-4 w-4 text-green-500" />
                      Resumo executivo formatado
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={startExport} 
              className={exportType === "csv" ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Icons.download className="mr-2 h-4 w-4" />
                  {exportType === "csv" ? "Baixar CSV" : "Baixar PDF"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DashboardPage() {
  const { filters } = useFilterContext();
  const { 
    salesData, 
    adsData, 
    kpis,
    setSalesData, 
    setAdsData, 
    setKpis,
    isLoading,
    setIsLoading
  } = useDashboardContext();
  const [activeTimeFrame, setActiveTimeFrame] = useState<"daily" | "weekly">("daily");

  // Fetch orders data
  const { 
    data: ordersData,
    isLoading: isOrdersLoading 
  } = useQuery({ 
    queryKey: ['/api/orders'],
    queryFn: getQueryFn({ on401: "throw" })
  });

  // Fetch ads data
  const { 
    data: campaignsData,
    isLoading: isCampaignsLoading 
  } = useQuery({ 
    queryKey: ['/api/campaigns'],
    queryFn: getQueryFn({ on401: "throw" })
  });

  useEffect(() => {
    // Ensure we have arrays for both data sources
    const orders = Array.isArray(ordersData) ? ordersData : [];
    const campaigns = Array.isArray(campaignsData) ? campaignsData : [];

    if (orders.length > 0 && campaigns.length > 0) {
      setIsLoading(false);
      setSalesData(orders);
      setAdsData(campaigns);
      
      // Calculate KPIs
      const totalSales = orders.reduce((sum: number, order: any) => 
        sum + parseNumberBR(order.produto_valor_total), 0);
      
      const totalOrders = new Set(orders.map((order: any) => order.pedido_id)).size;
      
      const totalInvestment = campaigns.reduce((sum: number, campaign: any) => 
        sum + parseNumberBR(campaign["Valor usado (BRL)"]), 0);
        
      const totalRevenue = totalSales;
      
      const roi = calculateROI(totalInvestment, totalRevenue);
      
      const cac = totalInvestment / totalOrders;
      
      const addToCart = campaigns.reduce((sum: number, campaign: any) => 
        sum + campaign["Adições ao carrinho"], 0);
        
      const pageViews = campaigns.reduce((sum: number, campaign: any) => 
        sum + campaign["Visualizações da página de destino"], 0);
        
      const conversionRate = (addToCart / pageViews) * 100;
      
      // Calculate Instituto vs E-commerce split
      const instituteOrders = orders.filter((order: any) => 
        order.produto_nome.includes('Curso') || 
        order.produto_nome.includes('Oficina')
      );
      
      const ecommerceOrders = orders.filter((order: any) => 
        !order.produto_nome.includes('Curso') && 
        !order.produto_nome.includes('Oficina')
      );
      
      const instituteSales = instituteOrders.reduce((sum: number, order: any) => 
        sum + parseNumberBR(order.produto_valor_total), 0);
        
      const ecommerceSales = ecommerceOrders.reduce((sum: number, order: any) => 
        sum + parseNumberBR(order.produto_valor_total), 0);
        
      // Set KPIs
      setKpis({
        totalSales,
        totalOrders,
        roi,
        cac,
        conversionRate,
        institutePercentage: calculatePercentage(instituteSales, totalSales),
        ecommercePercentage: calculatePercentage(ecommerceSales, totalSales),
        instituteSales,
        ecommerceSales
      });
    }
  }, [ordersData, campaignsData, setIsLoading, setSalesData, setAdsData, setKpis]);

  // Apply filters to data
  // Ensure salesData is always an array
  const safeOrdersData = Array.isArray(salesData) ? salesData : [];
  
  const filteredSalesData = safeOrdersData.filter((order: any) => {
    if (filters.dateRange.from && filters.dateRange.to) {
      const orderDate = parseDate(order.pedido_data);
      if (orderDate < filters.dateRange.from || orderDate > filters.dateRange.to) {
        return false;
      }
    }
    
    if (filters.category !== 'all') {
      const isInstitute = order.produto_nome.includes('Curso') || order.produto_nome.includes('Oficina');
      if (filters.category === 'instituto' && !isInstitute) return false;
      if (filters.category === 'ecommerce' && isInstitute) return false;
    }
    
    if (filters.product && !order.produto_nome.toLowerCase().includes(filters.product.toLowerCase())) {
      return false;
    }
    
    if (filters.state !== 'all' && order.envio_estado !== filters.state) {
      return false;
    }
    
    if (filters.orderStatus !== 'all' && order.pedido_status !== filters.orderStatus) {
      return false;
    }
    
    return true;
  });

  // Prepare data for charts
  const salesByDate = filteredSalesData.reduce((acc: any, order: any) => {
    const date = order.pedido_data;
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += parseNumberBR(order.produto_valor_total);
    return acc;
  }, {});

  const salesTrendData = Object.keys(salesByDate).map(date => ({
    date,
    sales: salesByDate[date]
  })).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

  // Prepare data for pie chart
  const categoryData = [
    { name: 'E-commerce', value: kpis.ecommercePercentage },
    { name: 'Instituto', value: kpis.institutePercentage }
  ];

  // Prepare campaign performance data
  // Ensure adsData is always an array
  const safeAdsData = Array.isArray(adsData) ? adsData : [];
  
  // Separar as campanhas por tipo (ECOM e INSTITUTO)
  const ecomCampaigns = safeAdsData.filter((campaign: any) => 
    campaign["Nome da campanha"].includes("[ECOM]")
  );
  
  const institutoCampaigns = safeAdsData.filter((campaign: any) => 
    campaign["Nome da campanha"].includes("[INSTITUTO]")
  );
  
  // Processar todas as campanhas
  const campaignPerformance = safeAdsData.map((campaign: any) => {
    const investment = parseNumberBR(campaign["Valor usado (BRL)"]);
    const revenue = parseNumberBR(campaign["Valor de conversão de adições ao carrinho"]);
    const roi = calculateROI(investment, revenue);
    const type = campaign["Nome da campanha"].includes("[ECOM]") ? "E-commerce" : 
                 campaign["Nome da campanha"].includes("[INSTITUTO]") ? "Instituto" : "Outro";
    
    return {
      name: campaign["Nome da campanha"],
      investment,
      revenue,
      roi,
      type
    };
  }).sort((a: any, b: any) => b.roi - a.roi);

  // Calculate product stats
  const productSales = filteredSalesData.reduce((acc: any, order: any) => {
    const productName = order.produto_nome;
    if (!acc[productName]) {
      acc[productName] = {
        name: productName,
        total: 0,
        count: 0,
      };
    }
    acc[productName].total += parseNumberBR(order.produto_valor_total);
    acc[productName].count += parseInt(order.produto_quantidade, 10) || 1;
    return acc;
  }, {});

  const topProducts = Object.values(productSales)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);

  // Get most active day and hour
  const salesByDay = filteredSalesData.reduce((acc: any, order: any) => {
    const date = parseDate(order.pedido_data);
    const day = date.getDay();
    const dayName = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][day];
    
    if (!acc[dayName]) {
      acc[dayName] = {
        name: dayName,
        sales: 0,
        count: 0,
      };
    }
    
    acc[dayName].sales += parseNumberBR(order.produto_valor_total);
    acc[dayName].count += 1;
    
    return acc;
  }, {});

  const bestDay = Object.values(salesByDay)
    .sort((a: any, b: any) => b.count - a.count)[0];
  
  const salesByHour = filteredSalesData.reduce((acc: any, order: any) => {
    const hour = order.pedido_hora.split(':')[0];
    
    if (!acc[hour]) {
      acc[hour] = {
        hour,
        sales: 0,
        count: 0,
      };
    }
    
    acc[hour].sales += parseNumberBR(order.produto_valor_total);
    acc[hour].count += 1;
    
    return acc;
  }, {});

  const bestHour = Object.values(salesByHour)
    .sort((a: any, b: any) => b.count - a.count)[0];
    
  const topProductName = topProducts.length > 0 ? topProducts[0].name : 'N/A';

  return (
    <div className="space-y-6">
      {/* Header aprimorado */}
      <div className="border-b pb-4">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <span>TerraFé</span>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="font-medium text-foreground">Dashboard</span>
        </div>
        
        {/* Título e Descrição */}
        <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard de Desempenho</h1>
            <p className="text-muted-foreground text-sm">
              Visão geral das vendas e campanhas de marketing da TerraFé em Abril de 2025.
            </p>
          </div>
          
          {/* Componente de exportação reposicionado */}
          <ExportDataButton salesData={filteredSalesData} adsData={adsData} kpis={kpis} />
        </div>
      </div>

      {/* KPI Cards com design aprimorado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Card */}
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <CardContent className="p-6 pt-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total de Vendas</h3>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-2xl font-bold">{formatCurrency(kpis.totalSales)}</p>
                )}
              </div>
              <div className="rounded-full p-2 bg-blue-50 dark:bg-blue-900/20">
                <Icons.ecommerce className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="text-muted-foreground">Abril 2025</div>
              {!isLoading && (
                <div className="flex items-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                  <Icons.trendingUp className="mr-1 h-3 w-3" />
                  <span>{kpis.totalOrders} pedidos</span>
                </div>
              )}
            </div>
            
            {!isLoading && (
              <div className="mt-2 text-xs text-muted-foreground border-t pt-2 mt-3">
                <span>Produto destaque: <b>{topProductName}</b></span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ROI Card */}
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <CardContent className="p-6 pt-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">ROI Médio</h3>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-2xl font-bold">{formatROI(kpis.roi)}</p>
                )}
              </div>
              <div className="rounded-full p-2 bg-green-50 dark:bg-green-900/20">
                <Icons.chart className="h-5 w-5 text-green-500" />
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="text-muted-foreground">Abril 2025</div>
              {!isLoading && (
                <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                  <Icons.zap className="mr-1 h-3 w-3" />
                  <span>{adsData.length} campanhas</span>
                </div>
              )}
            </div>
            
            {!isLoading && campaignPerformance.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground border-t pt-2 mt-3">
                <span>Melhor: <b>{campaignPerformance[0].name}</b> ({formatROI(campaignPerformance[0].roi)})</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CAC Card */}
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <CardContent className="p-6 pt-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Custo de Aquisição</h3>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-2xl font-bold">{formatCurrency(kpis.cac)}</p>
                )}
              </div>
              <div className="rounded-full p-2 bg-amber-50 dark:bg-amber-900/20">
                <Icons.money className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="text-muted-foreground">Abril 2025</div>
              {!isLoading && (
                <div className="flex items-center bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full">
                  <Icons.dollarSign className="mr-1 h-3 w-3" />
                  <span>R$ 2.444,00 investidos</span>
                </div>
              )}
            </div>
            
            {!isLoading && (
              <div className="mt-2 text-xs text-muted-foreground border-t pt-2 mt-3">
                <span>Para cada {formatCurrency(kpis.cac)} ⟶ 1 cliente adquirido</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best Selling Time Card */}
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <CardContent className="p-6 pt-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Melhor Momento</h3>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-2xl font-bold flex items-center">
                    {bestDay ? bestDay.name : "N/A"}
                    {bestHour && (
                      <span className="ml-2 text-muted-foreground px-2 py-0.5 rounded bg-muted text-sm font-medium">
                        {bestHour.hour}h
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="rounded-full p-2 bg-purple-50 dark:bg-purple-900/20">
                <Icons.calendar className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="text-muted-foreground">Abril 2025</div>
              {!isLoading && (
                <div className="flex items-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                  <Icons.barChart className="mr-1 h-3 w-3" />
                  <span>{kpis.totalOrders} pedidos analisados</span>
                </div>
              )}
            </div>
            
            {!isLoading && bestDay && (
              <div className="mt-2 text-xs text-muted-foreground border-t pt-2 mt-3">
                <span>Concentração de vendas <b>{bestDay.count}x</b> maior que a média</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Chart com design aprimorado */}
      <Card className="border-none shadow-md mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-medium mb-1">Correlação Vendas e Campanhas</h3>
              <p className="text-sm text-muted-foreground">Acompanhe a relação entre campanhas de marketing e volume de vendas</p>
            </div>
            <div className="flex items-center mt-4 sm:mt-0 space-x-2">
              <Tabs 
                defaultValue="daily" 
                value="daily"
                className="w-[200px]"
              >
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="daily" className="flex items-center gap-2">
                    <Icons.calendar className="h-4 w-4" />
                    <span>Diário</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => exportDashboardAsPDF("Visão Geral", {
                  kpis,
                  timeFrame: activeTimeFrame
                })}
              >
                <Icons.download className="h-4 w-4" />
                <span>PDF</span>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-lg overflow-hidden">
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : (
            <div className="h-[300px] rounded-lg overflow-hidden border p-4 bg-background/50">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={salesTrendData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--foreground))" 
                    tickFormatter={(value) => {
                      const date = parseDate(value);
                      return formatDate(date, "dd/MM");
                    }}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground))"
                    tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                    width={60}
                  />
                  <RechartsTooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, opacity: 0.5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Vendas (R$)"
                    stroke={COLORS[0]}
                    strokeWidth={3}
                    dot={{ r: 4, fill: COLORS[0], strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: COLORS[0], strokeWidth: 2, fill: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {!isLoading && (
            <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full p-1.5 bg-blue-500/20">
                  <Icons.lightbulb className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-medium">Insight:</span> No período analisado, os dias com maior volume de vendas foram concentrados no
                  {bestDay ? ` ${bestDay.name}` : ''} e as campanhas de marketing 
                  obtiveram um ROI médio de {formatROI(kpis.roi)}.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Secondary Charts com design aprimorado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Distribution */}
        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-medium mb-1">Distribuição por Categoria</h3>
                <p className="text-sm text-muted-foreground">Análise de vendas por segmento de negócio</p>
              </div>
              <div className="rounded-full p-2 bg-indigo-50 dark:bg-indigo-900/20">
                <Icons.pieChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            
            {isLoading ? (
              <Skeleton className="h-[250px] w-full rounded-lg" />
            ) : (
              <div className="h-[250px] relative bg-background/50 rounded-lg border p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      paddingAngle={4}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend 
                      iconType="circle"
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-background/80 dark:bg-background/50 backdrop-blur-sm rounded-full p-2 px-4 shadow-sm">
                  <div className="text-2xl font-bold">{kpis.totalOrders}</div>
                  <div className="text-xs text-muted-foreground">Pedidos</div>
                </div>
              </div>
            )}
            
            {!isLoading && (
              <div className="mt-4 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/30">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full p-1.5 bg-indigo-500/20">
                    <Icons.trendingUp className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm text-indigo-800 dark:text-indigo-300">
                    {kpis.institutePercentage > kpis.ecommercePercentage
                      ? `O segmento <strong>Instituto</strong> representa ${formatPercentage(kpis.institutePercentage)} das vendas (${formatCurrency(kpis.instituteSales)}), superando E-commerce.`
                      : `O segmento <strong>E-commerce</strong> representa ${formatPercentage(kpis.ecommercePercentage)} das vendas (${formatCurrency(kpis.ecommerceSales)}), superando Instituto.`
                    }
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Performance Chart */}
        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-medium mb-1">Performance das Campanhas</h3>
                <p className="text-sm text-muted-foreground">Análise de ROI e efetividade de marketing</p>
              </div>
              <div className="rounded-full p-2 bg-green-50 dark:bg-green-900/20">
                <Icons.barChart className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            {isLoading ? (
              <Skeleton className="h-[250px] w-full rounded-lg" />
            ) : (
              <div className="bg-background/50 rounded-lg border">
                <Tabs defaultValue="all" className="w-full">
                  <div className="px-4 pt-4">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="all">Todas</TabsTrigger>
                      <TabsTrigger value="ecom">E-commerce</TabsTrigger>
                      <TabsTrigger value="instituto">Instituto</TabsTrigger>
                    </TabsList>
                  </div>
                
                  <TabsContent value="all" className="m-0 p-4">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={campaignPerformance.slice(0, 5)} // Mostrar apenas as 5 campanhas de maior desempenho
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis 
                            type="number" 
                            stroke="hsl(var(--foreground))"
                            domain={[0, 'dataMax']}
                            tickFormatter={(value) => `${value.toFixed(1)}x`}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                          />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="hsl(var(--foreground))"
                            width={150}
                            tickFormatter={(value) => value.substring(0, 15) + (value.length > 15 ? '...' : '')}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                          />
                          <RechartsTooltip 
                            content={<CustomTooltip />} 
                            formatter={(value: any) => [`${value.toFixed(1)}x`, 'ROI']}
                            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                          />
                          <Bar 
                            dataKey="roi" 
                            name="ROI" 
                            fill={COLORS[1]} 
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                          >
                            {campaignPerformance.slice(0, 5).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.type === 'E-commerce' ? COLORS[0] : entry.type === 'Instituto' ? COLORS[2] : COLORS[1]} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ecom" className="m-0 p-4">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={campaignPerformance.filter(c => c.type === "E-commerce").slice(0, 5)}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis 
                            type="number" 
                            stroke="hsl(var(--foreground))"
                            domain={[0, 'dataMax']}
                            tickFormatter={(value) => `${value.toFixed(1)}x`}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                          />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="hsl(var(--foreground))"
                            width={150}
                            tickFormatter={(value) => value.substring(0, 15) + (value.length > 15 ? '...' : '')}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                          />
                          <RechartsTooltip 
                            content={<CustomTooltip />} 
                            formatter={(value: any) => [`${value.toFixed(1)}x`, 'ROI']}
                            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                          />
                          <Bar 
                            dataKey="roi" 
                            name="ROI" 
                            fill={COLORS[0]} 
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="instituto" className="m-0 p-4">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={campaignPerformance.filter(c => c.type === "Instituto").slice(0, 5)}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis 
                            type="number" 
                            stroke="hsl(var(--foreground))"
                            domain={[0, 'dataMax']}
                            tickFormatter={(value) => `${value.toFixed(1)}x`}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                          />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="hsl(var(--foreground))"
                            width={150}
                            tickFormatter={(value) => value.substring(0, 15) + (value.length > 15 ? '...' : '')}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                          />
                          <RechartsTooltip 
                            content={<CustomTooltip />} 
                            formatter={(value: any) => [`${value.toFixed(1)}x`, 'ROI']}
                            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                          />
                          <Bar 
                            dataKey="roi" 
                            name="ROI" 
                            fill={COLORS[2]} 
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            {!isLoading && campaignPerformance.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full p-1.5 bg-green-500/20">
                    <Icons.trophy className="h-4 w-4 text-green-700 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-300">
                    A campanha <strong>{campaignPerformance[0].name}</strong> tem o melhor ROI de {formatROI(campaignPerformance[0].roi)}, 
                    gerando {formatCurrency(campaignPerformance[0].revenue)} em receita a partir de um investimento de {formatCurrency(campaignPerformance[0].investment)}.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Metrics by Sector */}
      <Card className="border-none shadow-md mb-6">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Métricas de Campanhas por Setor</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Análise detalhada de performance por segmento</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <Icons.refresh className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <Icons.moreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <Tabs defaultValue="ecom" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger 
                  value="ecom" 
                  className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-300"
                >
                  <Icons.shoppingBag className="mr-2 h-4 w-4" />
                  E-commerce
                </TabsTrigger>
                <TabsTrigger 
                  value="instituto" 
                  className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-300"
                >
                  <Icons.graduationCap className="mr-2 h-4 w-4" />
                  Instituto
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="ecom" className="m-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-sm border border-blue-200 dark:border-blue-900/30">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                      <Icons.users className="inline-block mr-2 h-4 w-4" />
                      Alcance Total
                    </h4>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                      {ecomCampaigns.reduce((total, campaign) => 
                        total + parseInt(campaign["Alcance"]), 0
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Pessoas únicas</p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-sm border border-blue-200 dark:border-blue-900/30">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                      <Icons.eye className="inline-block mr-2 h-4 w-4" />
                      Impressões
                    </h4>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                      {ecomCampaigns.reduce((total, campaign) => 
                        total + parseInt(campaign["Impressões"]), 0
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Visualizações</p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-sm border border-blue-200 dark:border-blue-900/30">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                      <Icons.mousePointer className="inline-block mr-2 h-4 w-4" />
                      Cliques no Link
                    </h4>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                      {ecomCampaigns.reduce((total, campaign) => 
                        total + parseInt(campaign["Cliques no link"]), 0
                      ).toLocaleString()}
                    </p>
                    <div className="flex items-center text-xs text-blue-700 dark:text-blue-400 mt-1">
                      <span className="font-medium">CTR:</span> 
                      <span className="ml-1 px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-full">
                        {(ecomCampaigns.reduce((total, campaign) => 
                          total + parseInt(campaign["Cliques no link"]), 0) / 
                          ecomCampaigns.reduce((total, campaign) => 
                          total + parseInt(campaign["Impressões"]), 0) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-sm border border-blue-200 dark:border-blue-900/30">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                      <Icons.shoppingCart className="inline-block mr-2 h-4 w-4" />
                      Adições ao Carrinho
                    </h4>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                      {ecomCampaigns.reduce((total, campaign) => 
                        total + parseInt(campaign["Adições ao carrinho"]), 0
                      ).toLocaleString()}
                    </p>
                    <div className="flex items-center text-xs text-blue-700 dark:text-blue-400 mt-1">
                      <span className="font-medium">Conversão:</span> 
                      <span className="ml-1 px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-full">
                        {(ecomCampaigns.reduce((total, campaign) => 
                          total + parseInt(campaign["Adições ao carrinho"]), 0) / 
                          ecomCampaigns.reduce((total, campaign) => 
                          total + parseInt(campaign["Visualizações da página de destino"]), 0) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-black/20 rounded-lg border shadow-sm overflow-hidden">
                  <div className="flex justify-between p-4 border-b bg-muted/30">
                    <span className="font-medium">Campanha</span>
                    <span className="font-medium text-right">Investimento / Receita / ROI</span>
                  </div>
                  
                  <div className="divide-y max-h-[250px] overflow-y-auto scrollbar-thin">
                    {ecomCampaigns.map((campaign, index) => {
                      const investment = parseNumberBR(campaign["Valor usado (BRL)"]);
                      const revenue = parseNumberBR(campaign["Valor de conversão de adições ao carrinho"]);
                      const roi = calculateROI(investment, revenue);
                      
                      return (
                        <div key={index} className="flex justify-between p-3 hover:bg-muted/50 transition-colors">
                          <span className="truncate max-w-[50%] flex items-center">
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                            {campaign["Nome da campanha"]}
                          </span>
                          <span className="text-right">
                            <span className="text-muted-foreground">{formatCurrency(investment)}</span>
                            <span className="mx-1 text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{formatCurrency(revenue)}</span>
                            <span className="mx-1 text-muted-foreground">/</span>
                            <span className={roi >= 1 ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                              {formatROI(roi)}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="instituto" className="m-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg shadow-sm border border-amber-200 dark:border-amber-900/30">
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center">
                      <Icons.users className="inline-block mr-2 h-4 w-4" />
                      Alcance Total
                    </h4>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                      {institutoCampaigns.reduce((total, campaign) => 
                        total + parseInt(campaign["Alcance"]), 0
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Pessoas únicas</p>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg shadow-sm border border-amber-200 dark:border-amber-900/30">
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center">
                      <Icons.eye className="inline-block mr-2 h-4 w-4" />
                      Impressões
                    </h4>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                      {institutoCampaigns.reduce((total, campaign) => 
                        total + parseInt(campaign["Impressões"]), 0
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Visualizações</p>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg shadow-sm border border-amber-200 dark:border-amber-900/30">
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center">
                      <Icons.mousePointer className="inline-block mr-2 h-4 w-4" />
                      Cliques no Link
                    </h4>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                      {institutoCampaigns.reduce((total, campaign) => 
                        total + parseInt(campaign["Cliques no link"]), 0
                      ).toLocaleString()}
                    </p>
                    <div className="flex items-center text-xs text-amber-700 dark:text-amber-400 mt-1">
                      <span className="font-medium">CTR:</span> 
                      <span className="ml-1 px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-full">
                        {(institutoCampaigns.reduce((total, campaign) => 
                          total + parseInt(campaign["Cliques no link"]), 0) / 
                          institutoCampaigns.reduce((total, campaign) => 
                          total + parseInt(campaign["Impressões"]), 0) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg shadow-sm border border-amber-200 dark:border-amber-900/30">
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center">
                      <Icons.shoppingCart className="inline-block mr-2 h-4 w-4" />
                      Adições ao Carrinho
                    </h4>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                      {institutoCampaigns.reduce((total, campaign) => 
                        total + parseInt(campaign["Adições ao carrinho"]), 0
                      ).toLocaleString()}
                    </p>
                    <div className="flex items-center text-xs text-amber-700 dark:text-amber-400 mt-1">
                      <span className="font-medium">Conversão:</span> 
                      <span className="ml-1 px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-full">
                        {(institutoCampaigns.reduce((total, campaign) => 
                          total + parseInt(campaign["Adições ao carrinho"]), 0) / 
                          institutoCampaigns.reduce((total, campaign) => 
                          total + parseInt(campaign["Visualizações da página de destino"]), 0) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-black/20 rounded-lg border shadow-sm overflow-hidden">
                  <div className="flex justify-between p-4 border-b bg-muted/30">
                    <span className="font-medium">Campanha</span>
                    <span className="font-medium text-right">Investimento / Receita / ROI</span>
                  </div>
                  
                  <div className="divide-y max-h-[250px] overflow-y-auto scrollbar-thin">
                    {institutoCampaigns.map((campaign, index) => {
                      const investment = parseNumberBR(campaign["Valor usado (BRL)"]);
                      const revenue = parseNumberBR(campaign["Valor de conversão de adições ao carrinho"]);
                      const roi = calculateROI(investment, revenue);
                      
                      return (
                        <div key={index} className="flex justify-between p-3 hover:bg-muted/50 transition-colors">
                          <span className="truncate max-w-[50%] flex items-center">
                            <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                            {campaign["Nome da campanha"]}
                          </span>
                          <span className="text-right">
                            <span className="text-muted-foreground">{formatCurrency(investment)}</span>
                            <span className="mx-1 text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{formatCurrency(revenue)}</span>
                            <span className="mx-1 text-muted-foreground">/</span>
                            <span className={roi >= 1 ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                              {formatROI(roi)}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Componente de Exportação */}
      <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium">Exportar Relatório Completo</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Baixe seu relatório de métricas em formato CSV ou PDF para análise detalhada
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="bg-white dark:bg-black/20 gap-2"
              onClick={() => {
                const data = prepareMetricsForExport(filteredSalesData, adsData, kpis);
                downloadCSV(data, `terrafe-relatorio-metricas-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
              }}
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV Detalhado
            </Button>
            <Button 
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => exportDashboardAsPDF('Dashboard', { kpis })}
            >
              <FileText className="h-4 w-4" />
              Relatório PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}