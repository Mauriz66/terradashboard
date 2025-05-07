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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  TooltipProps,
} from "recharts";

// Cores com melhor contraste
const COLORS = [
  "hsl(215, 90%, 50%)",  // Azul vibrante
  "hsl(160, 70%, 45%)",  // Verde vibrante
  "hsl(25, 90%, 55%)",   // Laranja vibrante
  "hsl(275, 80%, 60%)",  // Roxo vibrante
  "hsl(340, 80%, 55%)",  // Rosa vibrante
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

export default function InstitutoPage() {
  const { filters } = useFilterContext();
  const { salesData, isLoading } = useDashboardContext();
  const [institutoData, setInstitutoData] = useState<any[]>([]);
  const [courseTypes, setCourseTypes] = useState<any[]>([]);
  const [hourlyDistribution, setHourlyDistribution] = useState<any[]>([]);
  const [totalInstitutoRevenue, setTotalInstitutoRevenue] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [averageCourseValue, setAverageCourseValue] = useState(0);

  useEffect(() => {
    if (salesData.length > 0) {
      // Filter for instituto products (courses and workshops)
      const filteredData = salesData.filter(
        (order: any) =>
          order.produto_nome.includes("Curso") ||
          order.produto_nome.includes("Oficina")
      );

      setInstitutoData(filteredData);

      // Calculate course types
      const courseTypesMap = filteredData.reduce((acc: any, order: any) => {
        let type = "Outros";
        if (order.produto_nome.includes("Barista")) {
          type = "Barista";
        } else if (order.produto_nome.includes("Métodos")) {
          type = "Métodos de Preparo";
        } else if (order.produto_nome.includes("Introdução")) {
          type = "Introdução ao Café";
        } else if (order.produto_nome.includes("Sensorial") || order.produto_nome.includes("Cupping")) {
          type = "Análise Sensorial";
        }

        if (!acc[type]) {
          acc[type] = {
            name: type,
            value: 0,
            count: 0,
          };
        }
        acc[type].value += parseNumberBR(order.produto_valor_total);
        acc[type].count += parseInt(order.produto_quantidade);
        return acc;
      }, {});

      setCourseTypes(Object.values(courseTypesMap));

      // Calculate hourly distribution
      const hours = filteredData.reduce((acc: any, order: any) => {
        const hour = parseInt(order.pedido_hora.split(":")[0]);
        const hourBucket = `${hour < 10 ? '0' : ''}${hour}:00`;
        
        if (!acc[hourBucket]) {
          acc[hourBucket] = {
            hour: hourBucket,
            count: 0,
            revenue: 0,
          };
        }
        acc[hourBucket].count += 1;
        acc[hourBucket].revenue += parseNumberBR(order.produto_valor_total);
        return acc;
      }, {});

      const hourlyDistributionArray = Object.values(hours).sort(
        (a: any, b: any) => {
          const hourA = parseInt(a.hour.split(":")[0]);
          const hourB = parseInt(b.hour.split(":")[0]);
          return hourA - hourB;
        }
      );

      setHourlyDistribution(hourlyDistributionArray);

      // Calculate totals
      const totalRevenue = filteredData.reduce(
        (sum: number, order: any) =>
          sum + parseNumberBR(order.produto_valor_total),
        0
      );
      
      const totalCoursesCount = filteredData.reduce(
        (sum: number, order: any) => sum + parseInt(order.produto_quantidade),
        0
      );

      setTotalInstitutoRevenue(totalRevenue);
      setTotalCourses(totalCoursesCount);
      setAverageCourseValue(
        totalCoursesCount > 0 ? totalRevenue / totalCoursesCount : 0
      );
    }
  }, [salesData]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Instituto</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {/* Total Revenue Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total de Vendas Instituto
              </h3>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCurrency(totalInstitutoRevenue)}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Abril 2025</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Courses */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total de Cursos Vendidos
              </h3>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">{totalCourses}</p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Abril 2025</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Course Value */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Valor Médio por Curso
              </h3>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCurrency(averageCourseValue)}
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
        {/* Course Types Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendas por Tipo de Curso</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={courseTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {courseTypes.map((entry, index) => (
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

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendas por Hora do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hourlyDistribution}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis dataKey="hour" stroke="hsl(var(--foreground))" />
                    <YAxis
                      stroke="hsl(var(--foreground))"
                      tickFormatter={(value) =>
                        formatCurrency(value).replace("R$", "")
                      }
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="revenue"
                      name="Receita (R$)"
                      fill={COLORS[1]}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Desempenho dos Cursos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { date: "1 Abr", barista: 250, metodos: 0, introducao: 150 },
                    { date: "8 Abr", barista: 0, metodos: 0, introducao: 0 },
                    { date: "12 Abr", barista: 0, metodos: 0, introducao: 150 },
                    { date: "15 Abr", barista: 1300, metodos: 350, introducao: 0 },
                    { date: "29 Abr", barista: 0, metodos: 0, introducao: 500 },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                  <YAxis
                    stroke="hsl(var(--foreground))"
                    tickFormatter={(value) =>
                      formatCurrency(value).replace("R$", "")
                    }
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="barista"
                    name="Barista (R$)"
                    stroke={COLORS[0]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: COLORS[0] }}
                  />
                  <Line
                    type="monotone"
                    dataKey="metodos"
                    name="Métodos (R$)"
                    stroke={COLORS[1]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: COLORS[1] }}
                  />
                  <Line
                    type="monotone"
                    dataKey="introducao"
                    name="Introdução (R$)"
                    stroke={COLORS[2]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: COLORS[2] }}
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      

    </div>
  );
}
