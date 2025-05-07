import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded-md shadow-md">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value instanceof Date 
              ? formatDate(entry.value)
              : typeof entry.value === 'number' && entry.name?.includes('R$')
                ? formatCurrency(entry.value)
                : typeof entry.value === 'number' && entry.name?.includes('ROI')
                  ? formatROI(entry.value)
                  : entry.value
            }`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

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
    if (ordersData && campaignsData) {
      setIsLoading(false);
      setSalesData(ordersData);
      setAdsData(campaignsData);
      
      // Calculate KPIs
      const totalSales = ordersData.reduce((sum: number, order: any) => 
        sum + parseNumberBR(order.produto_valor_total), 0);
      
      const totalOrders = new Set(ordersData.map((order: any) => order.pedido_id)).size;
      
      const totalInvestment = campaignsData.reduce((sum: number, campaign: any) => 
        sum + parseNumberBR(campaign["Valor usado (BRL)"]), 0);
        
      const totalRevenue = totalSales;
      
      const roi = calculateROI(totalInvestment, totalRevenue);
      
      const cac = totalInvestment / totalOrders;
      
      const addToCart = campaignsData.reduce((sum: number, campaign: any) => 
        sum + campaign["Adições ao carrinho"], 0);
        
      const pageViews = campaignsData.reduce((sum: number, campaign: any) => 
        sum + campaign["Visualizações da página de destino"], 0);
        
      const conversionRate = (addToCart / pageViews) * 100;
      
      // Calculate Instituto vs E-commerce split
      const instituteOrders = ordersData.filter((order: any) => 
        order.produto_nome.includes('Curso') || 
        order.produto_nome.includes('Oficina')
      );
      
      const ecommerceOrders = ordersData.filter((order: any) => 
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
  const filteredSalesData = salesData.filter((order: any) => {
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
  const campaignPerformance = adsData.map((campaign: any) => {
    const investment = parseNumberBR(campaign["Valor usado (BRL)"]);
    const revenue = parseNumberBR(campaign["Valor de conversão de adições ao carrinho"]);
    const roi = calculateROI(investment, revenue);
    
    return {
      name: campaign["Nome da campanha"],
      investment,
      revenue,
      roi
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
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Sales Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Total de Vendas</h3>
              <span className="flex items-center text-green-500 text-xs">
                <Icons.arrowUp className="mr-1 h-3 w-3" />
                12%
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(kpis.totalSales)}</p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Abril 2025</span>
              <div className="flex items-center">
                <Icons.ecommerce className="mr-1 h-3 w-3" />
                <span>{kpis.totalOrders} pedidos</span>
              </div>
            </div>
            {!isLoading && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span>O produto mais vendido foi <b>{topProductName}</b></span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ROI Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">ROI Médio</h3>
              <span className="flex items-center text-green-500 text-xs">
                <Icons.arrowUp className="mr-1 h-3 w-3" />
                8.2%
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">{formatROI(kpis.roi)}</p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Abril 2025</span>
              <div className="flex items-center">
                <Icons.chart className="mr-1 h-3 w-3" />
                <span>{adsData.length} campanhas</span>
              </div>
            </div>
            {!isLoading && campaignPerformance.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span>Melhor campanha: <b>{campaignPerformance[0].name}</b> com ROI de {formatROI(campaignPerformance[0].roi)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CAC Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Custo de Aquisição</h3>
              <span className="flex items-center text-red-500 text-xs">
                <Icons.arrowUp className="mr-1 h-3 w-3" />
                3%
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(kpis.cac)}</p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Abril 2025</span>
              <div className="flex items-center">
                <Icons.money className="mr-1 h-3 w-3" />
                <span>R$ 2.444,00 investidos</span>
              </div>
            </div>
            {!isLoading && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span>Para cada {formatCurrency(kpis.cac)} investidos, 1 cliente adquirido</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best Selling Time Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Melhor Momento de Vendas</h3>
              <span className="flex items-center text-blue-500 text-xs">
                <Icons.clock className="mr-1 h-3 w-3" />
                Análise
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">
                {bestDay ? bestDay.name : "N/A"}
                <span className="text-lg ml-2 font-medium text-muted-foreground">
                  {bestHour ? `${bestHour.hour}h` : ""}
                </span>
              </p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Abril 2025</span>
              <div className="flex items-center">
                <Icons.calendar className="mr-1 h-3 w-3" />
                <span>{kpis.totalOrders} pedidos analisados</span>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <h3 className="text-base font-medium">Correlação Vendas e Campanhas</h3>
            <div className="flex items-center mt-2 sm:mt-0">
              <Tabs 
                defaultValue="daily" 
                value="daily"
              >
                <TabsList className="mr-2">
                  <TabsTrigger value="daily">Diário</TabsTrigger>
                </TabsList>
              </Tabs>
              <button 
                className="text-xs bg-muted px-2 py-1 rounded flex items-center hover:bg-muted/80"
                onClick={() => exportDashboardAsPDF("Visão Geral", {
                  kpis,
                  timeFrame: activeTimeFrame
                })}
              >
                <Icons.download className="mr-1 h-3 w-3" />
                Exportar PDF
              </button>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={salesTrendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--foreground))" 
                    tickFormatter={(value) => {
                      const date = parseDate(value);
                      return formatDate(date, "dd/MM");
                    }}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground))"
                    tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Vendas (R$)"
                    stroke={COLORS[0]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: COLORS[0] }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {!isLoading && (
            <div className="mt-4 p-3 bg-muted/30 rounded-md border border-border">
              <p className="text-xs text-foreground">
                No período analisado, os dias com maior volume de vendas foram concentrados no 
                {bestDay ? ` ${bestDay.name}` : ''} e as campanhas de marketing 
                obtiveram um ROI médio de {formatROI(kpis.roi)}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Distribution */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-base font-medium mb-4">Distribuição por Categoria</h3>
            
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 relative">
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
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-lg font-bold">{kpis.totalOrders}</div>
                  <div className="text-xs text-muted-foreground">Pedidos</div>
                </div>
              </div>
            )}
            
            {!isLoading && (
              <div className="mt-4 p-3 bg-muted/30 rounded-md border border-border">
                <p className="text-xs text-foreground">
                  {kpis.institutePercentage > kpis.ecommercePercentage
                    ? `O segmento Instituto representa ${formatPercentage(kpis.institutePercentage)} das vendas (${formatCurrency(kpis.instituteSales)}), superando E-commerce.`
                    : `O segmento E-commerce representa ${formatPercentage(kpis.ecommercePercentage)} das vendas (${formatCurrency(kpis.ecommerceSales)}), superando Instituto.`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Performance Chart */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-base font-medium mb-4">Performance das Campanhas</h3>
            
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={campaignPerformance}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      stroke="hsl(var(--foreground))"
                      domain={[0, 'dataMax']}
                      tickFormatter={(value) => `${value.toFixed(1)}x`}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="hsl(var(--foreground))"
                      width={150}
                      tickFormatter={(value) => value.substring(0, 15) + (value.length > 15 ? '...' : '')}
                    />
                    <RechartsTooltip 
                      content={<CustomTooltip />} 
                      formatter={(value: any) => [`${value.toFixed(1)}x`, 'ROI']}
                    />
                    <Bar 
                      dataKey="roi" 
                      name="ROI" 
                      fill={COLORS[1]} 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {!isLoading && campaignPerformance.length > 0 && (
              <div className="mt-4 p-3 bg-muted/30 rounded-md border border-border">
                <p className="text-xs text-foreground">
                  A campanha <b>{campaignPerformance[0].name}</b> tem o melhor ROI de {formatROI(campaignPerformance[0].roi)}, 
                  gerando {formatCurrency(campaignPerformance[0].revenue)} em receita a partir de um investimento de {formatCurrency(campaignPerformance[0].investment)}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


    </div>
  );
}