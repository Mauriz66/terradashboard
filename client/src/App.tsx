import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { MainLayout } from "@/components/layout/main-layout";
import DashboardPage from "@/pages/dashboard";
import InstitutoPage from "@/pages/instituto";
import ECommercePage from "@/pages/e-commerce";
import TablesPage from "@/pages/tables";
import UploadPage from "@/pages/upload";
import { FilterProvider } from "@/context/filter-context";
import { DashboardProvider } from "@/context/dashboard-context";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/instituto" component={InstitutoPage} />
        <Route path="/ecommerce" component={ECommercePage} />
        <Route path="/tables" component={TablesPage} />
        <Route path="/upload" component={UploadPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FilterProvider>
          <DashboardProvider>
            <Toaster />
            <Router />
          </DashboardProvider>
        </FilterProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
