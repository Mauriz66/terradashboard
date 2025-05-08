import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "@/components/theme-provider";
import { FilterProvider } from "@/context/filter-context";
import { DashboardProvider } from "@/context/dashboard-context";
import { MainLayout } from "@/components/layout/main-layout";
import NotFound from "@/pages/not-found";

// Componente básico para dashboard
const Dashboard = () => (
  <div className="space-y-6">
    <div className="border-b pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard TerraFé</h1>
      <p className="text-muted-foreground text-sm">
        Visão geral das vendas e campanhas de marketing da TerraFé.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI Cards Simplificados */}
      {['Vendas Totais', 'ROI Médio', 'Custo de Aquisição', 'Melhor Dia'].map((title, index) => (
        <div key={index} className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
          <p className="text-2xl font-bold">{index === 0 ? 'R$ 25.432,50' : index === 1 ? '3.5x' : index === 2 ? 'R$ 42,75' : 'Terça'}</p>
        </div>
      ))}
    </div>
    
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h3 className="text-base font-medium mb-4">Gráfico de Vendas</h3>
      <div className="h-[300px] flex items-center justify-center border border-dashed border-gray-300 rounded-md bg-gray-50">
        <p className="text-gray-500">Dados do gráfico serão carregados em breve</p>
      </div>
    </div>
  </div>
);

// Componente para Instituto
const Instituto = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Instituto TerraFé</h1>
    <p>Dados sobre cursos e workshops serão exibidos aqui.</p>
  </div>
);

// Componente para E-commerce
const Ecommerce = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">E-commerce TerraFé</h1>
    <p>Dados sobre vendas de produtos serão exibidos aqui.</p>
  </div>
);

// Página inicial simplificada
const HomePage = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 text-center">
    <h1 className="text-4xl font-bold tracking-tight">Bem-vindo ao TerraFé Dashboard</h1>
    <p className="text-xl text-muted-foreground max-w-2xl">
      Explore dados de vendas, métricas de marketing e insights do seu negócio em um único lugar.
    </p>
    <div className="flex flex-wrap gap-4 justify-center">
      <a href="/dashboard" className="inline-flex items-center justify-center rounded-md bg-primary text-white px-4 py-2 text-sm font-medium shadow hover:bg-primary/90">
        Acessar Dashboard
      </a>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="terrafe-theme">
        <FilterProvider>
          <DashboardProvider>
            <MainLayout>
              <Switch>
                <Route path="/" component={HomePage} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/instituto" component={Instituto} />
                <Route path="/ecommerce" component={Ecommerce} />
                <Route component={NotFound} />
              </Switch>
            </MainLayout>
          </DashboardProvider>
        </FilterProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
