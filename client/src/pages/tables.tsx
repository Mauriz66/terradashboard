import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import { useDashboardContext } from "@/context/dashboard-context";
import { useFilterContext } from "@/context/filter-context";
import { formatCurrency, downloadCSV, parseNumberBR } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function TablesPage() {
  const { salesData, adsData, isLoading } = useDashboardContext();
  const { filters } = useFilterContext();
  const [tab, setTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);

  // Sort function
  const sortData = (data: any[], key: string, direction: string) => {
    return [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];
      
      // Handle number values that might be strings with commas
      if (typeof aValue === 'string' && aValue.includes(',')) {
        aValue = parseNumberBR(aValue);
        bValue = parseNumberBR(bValue as string);
      }
      
      if (aValue < bValue) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  // Request sort
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Apply filters and search to data
  const filteredOrdersData = useMemo(() => {
    let result = [...salesData];

    // Apply filters
    if (filters.dateRange.from && filters.dateRange.to) {
      result = result.filter((order) => {
        const orderDate = new Date(order.pedido_data.split("/").reverse().join("-"));
        return orderDate >= filters.dateRange.from && orderDate <= filters.dateRange.to;
      });
    }

    if (filters.category !== "all") {
      const isInstitute = filters.category === "instituto";
      result = result.filter((order) => {
        const isEducational = order.produto_nome.includes("Curso") || order.produto_nome.includes("Oficina");
        return isInstitute ? isEducational : !isEducational;
      });
    }

    if (filters.product) {
      result = result.filter((order) =>
        order.produto_nome.toLowerCase().includes(filters.product.toLowerCase())
      );
    }

    if (filters.state !== "all") {
      result = result.filter((order) => order.envio_estado === filters.state);
    }

    if (filters.orderStatus !== "all") {
      result = result.filter((order) => order.pedido_status === filters.orderStatus);
    }

    // Apply search
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter((order) =>
        Object.values(order).some(
          (value) =>
            typeof value === "string" &&
            value.toLowerCase().includes(lowercasedSearch)
        )
      );
    }

    // Apply sort
    if (sortConfig) {
      result = sortData(result, sortConfig.key, sortConfig.direction);
    }

    return result;
  }, [salesData, filters, searchTerm, sortConfig]);

  const filteredCampaignsData = useMemo(() => {
    let result = [...adsData];

    // Apply search
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter((campaign) =>
        Object.values(campaign).some(
          (value) =>
            typeof value === "string" &&
            value.toLowerCase().includes(lowercasedSearch)
        )
      );
    }

    // Apply sort
    if (sortConfig) {
      result = sortData(result, sortConfig.key, sortConfig.direction);
    }

    // Apply category filter
    if (filters.category !== "all") {
      result = result.filter((campaign) => {
        const campaignName = campaign["Nome da campanha"].toLowerCase();
        return filters.category === "instituto"
          ? campaignName.includes("instituto")
          : campaignName.includes("ecom");
      });
    }

    return result;
  }, [adsData, filters, searchTerm, sortConfig]);

  const handleExport = () => {
    if (tab === "orders") {
      downloadCSV(filteredOrdersData, "pedidos_filtrados.csv");
    } else {
      downloadCSV(filteredCampaignsData, "campanhas_filtradas.csv");
    }
  };

  // Get sortable header cell with direction indicator
  const getSortableHeaderCell = (key: string, label: string) => {
    const isSorted = sortConfig?.key === key;
    const direction = isSorted ? sortConfig.direction : undefined;
    
    return (
      <div 
        className="flex items-center cursor-pointer hover:text-primary"
        onClick={() => requestSort(key)}
      >
        {label}
        {isSorted && (
          direction === "ascending" ? 
            <Icons.arrowUp className="ml-1 h-4 w-4" /> : 
            <Icons.arrowDown className="ml-1 h-4 w-4" />
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Tabelas Detalhadas</CardTitle>
              <CardDescription>
                Visualize todos os detalhes de pedidos e campanhas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
              >
                <Icons.download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Tabs 
              defaultValue="orders" 
              className="w-full sm:w-auto"
              onValueChange={(value) => {
                setTab(value);
                setSortConfig(null);
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders">Pedidos</TabsTrigger>
                <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-64">
              <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            {tab === "orders" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{getSortableHeaderCell("pedido_id", "ID")}</TableHead>
                      <TableHead>{getSortableHeaderCell("pedido_data", "Data")}</TableHead>
                      <TableHead>{getSortableHeaderCell("pedido_hora", "Hora")}</TableHead>
                      <TableHead>{getSortableHeaderCell("pedido_status", "Status")}</TableHead>
                      <TableHead>{getSortableHeaderCell("envio_estado", "Estado")}</TableHead>
                      <TableHead>{getSortableHeaderCell("produto_nome", "Produto")}</TableHead>
                      <TableHead className="text-right">{getSortableHeaderCell("produto_valor_unitario", "Valor Unit.")}</TableHead>
                      <TableHead className="text-right">{getSortableHeaderCell("produto_quantidade", "Qtd")}</TableHead>
                      <TableHead className="text-right">{getSortableHeaderCell("produto_valor_total", "Total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrdersData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                          Nenhum resultado encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrdersData.map((order, index) => (
                        <TableRow key={`${order.pedido_id}-${index}`}>
                          <TableCell>{order.pedido_id}</TableCell>
                          <TableCell>{order.pedido_data}</TableCell>
                          <TableCell>{order.pedido_hora}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              order.pedido_status.includes("Entregue") 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                : order.pedido_status.includes("Pago")
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                            }`}>
                              {order.pedido_status}
                            </span>
                          </TableCell>
                          <TableCell>{order.envio_estado}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={order.produto_nome}>
                            {order.produto_nome}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(parseNumberBR(order.produto_valor_unitario))}
                          </TableCell>
                          <TableCell className="text-right">{order.produto_quantidade}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(parseNumberBR(order.produto_valor_total))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{getSortableHeaderCell("Nome da campanha", "Campanha")}</TableHead>
                      <TableHead>{getSortableHeaderCell("Início dos relatórios", "Início")}</TableHead>
                      <TableHead>{getSortableHeaderCell("Término dos relatórios", "Término")}</TableHead>
                      <TableHead className="text-right">{getSortableHeaderCell("Impressões", "Impressões")}</TableHead>
                      <TableHead className="text-right">{getSortableHeaderCell("Cliques no link", "Cliques")}</TableHead>
                      <TableHead className="text-right">{getSortableHeaderCell("Adições ao carrinho", "Add Carrinho")}</TableHead>
                      <TableHead className="text-right">{getSortableHeaderCell("Valor usado (BRL)", "Investimento")}</TableHead>
                      <TableHead className="text-right">{getSortableHeaderCell("Valor de conversão de adições ao carrinho", "Conversão")}</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaignsData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                          Nenhum resultado encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCampaignsData.map((campaign, index) => {
                        const investment = parseNumberBR(campaign["Valor usado (BRL)"]);
                        const conversion = parseNumberBR(campaign["Valor de conversão de adições ao carrinho"]);
                        const roi = ((conversion - investment) / investment) * 100;
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{campaign["Nome da campanha"]}</TableCell>
                            <TableCell>{campaign["Início dos relatórios"]}</TableCell>
                            <TableCell>{campaign["Término dos relatórios"]}</TableCell>
                            <TableCell className="text-right">{campaign["Impressões"].toLocaleString()}</TableCell>
                            <TableCell className="text-right">{campaign["Cliques no link"].toLocaleString()}</TableCell>
                            <TableCell className="text-right">{campaign["Adições ao carrinho"].toLocaleString()}</TableCell>
                            <TableCell className="text-right">{formatCurrency(investment)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(conversion)}</TableCell>
                            <TableCell className="text-right font-medium">
                              <span className={roi >= 0 ? "text-green-600" : "text-red-600"}>
                                {roi.toFixed(0)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
