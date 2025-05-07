import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import { formatCurrency, formatPercentage, parseNumberBR } from "@/lib/utils";
import { useDashboardContext } from "@/context/dashboard-context";
import { useFilterContext } from "@/context/filter-context";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  TooltipProps,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded-md shadow-md">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${
              typeof entry.value === "number" && entry.name?.includes("R$")
                ? formatCurrency(entry.value)
                : entry.value
            }`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export default function ECommercePage() {
  const { filters } = useFilterContext();
  const { salesData, isLoading } = useDashboardContext();
  const [ecommerceData, setEcommerceData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [stateDistribution, setStateDistribution] = useState<any[]>([]);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [totalEcommerceRevenue, setTotalEcommerceRevenue] = useState(0);

  useEffect(() => {
    if (salesData.length > 0) {
      // Filter for ecommerce products (not courses or workshops)
      const filteredData = salesData.filter(
        (order: any) =>
          !order.produto_nome.includes("Curso") &&
          !order.produto_nome.includes("Oficina")
      );

      setEcommerceData(filteredData);

      // Calculate top products
      const productSales = filteredData.reduce((acc: any, order: any) => {
        const productName = order.produto_nome;
        if (!acc[productName]) {
          acc[productName] = {
            name: productName,
            quantity: 0,
            revenue: 0,
          };
        }
        acc[productName].quantity += parseInt(order.produto_quantidade);
        acc[productName].revenue += parseNumberBR(order.produto_valor_total);
        return acc;
      }, {});

      const topProductsArray = Object.values(productSales)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(topProductsArray);

      // Calculate state distribution
      const states = filteredData.reduce((acc: any, order: any) => {
        const state = order.envio_estado;
        if (!acc[state]) {
          acc[state] = {
            state,
            orders: 0,
            revenue: 0,
          };
        }
        acc[state].orders += 1;
        acc[state].revenue += parseNumberBR(order.produto_valor_total);
        return acc;
      }, {});

      const stateDistributionArray = Object.values(states).sort(
        (a: any, b: any) => b.revenue - a.revenue
      );

      setStateDistribution(stateDistributionArray);

      // Calculate average order value
      const orderValues = filteredData.reduce((acc: any, order: any) => {
        const orderId = order.pedido_id;
        if (!acc[orderId]) {
          acc[orderId] = 0;
        }
        acc[orderId] += parseNumberBR(order.produto_valor_total);
        return acc;
      }, {});

      const totalOrders = Object.keys(orderValues).length;
      const totalRevenue = Object.values(orderValues).reduce(
        (sum: any, value: any) => sum + value,
        0
      );

      setAverageOrderValue(totalOrders > 0 ? totalRevenue / totalOrders : 0);
      setTotalEcommerceRevenue(totalRevenue);
    }
  }, [salesData]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">E-commerce</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {/* Total Sales Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Vendas E-commerce
              </h3>
              <span className="flex items-center text-green-500 text-xs">
                <Icons.arrowUp className="mr-1 h-3 w-3" />
                10%
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCurrency(totalEcommerceRevenue)}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Abril 2025</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Valor Médio do Pedido
              </h3>
              <span className="flex items-center text-green-500 text-xs">
                <Icons.arrowUp className="mr-1 h-3 w-3" />
                5%
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCurrency(averageOrderValue)}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Abril 2025</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total de Produtos
              </h3>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">
                {ecommerceData.reduce(
                  (sum: number, order: any) =>
                    sum + parseInt(order.produto_quantidade),
                  0
                )}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Abril 2025</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Produtos Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--foreground))"
                      tickFormatter={(value) =>
                        formatCurrency(value).replace("R$", "")
                      }
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="hsl(var(--foreground))"
                      width={150}
                      tickFormatter={(value) =>
                        value.substring(0, 15) +
                        (value.length > 15 ? "..." : "")
                      }
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="revenue"
                      name="Receita (R$)"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stateDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="revenue"
                      nameKey="state"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {stateDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categorias de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { category: "Café Especial", value: 65 },
                    { category: "Acessórios", value: 15 },
                    { category: "Kits & Presentes", value: 12 },
                    { category: "Doces", value: 8 },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="category" stroke="hsl(var(--foreground))" />
                  <YAxis
                    stroke="hsl(var(--foreground))"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    name="Percentual (%)"
                    fill="hsl(var(--secondary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
