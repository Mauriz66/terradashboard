import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { cn, getLogoPath } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMounted } from "@/hooks/use-mounted";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useFilterContext } from "@/context/filter-context";
import { DatePickerWithRange } from "@/components/ui/date-picker";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { theme } = useTheme();
  const [location] = useLocation();
  const mounted = useMounted();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { filters, updateFilters } = useFilterContext();

  // Update sidebar state based on screen size
  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isDesktop && mobileOpen) {
        const sidebar = document.getElementById("sidebar");
        const mobileToggle = document.getElementById("mobile-sidebar-toggle");
        
        if (
          sidebar &&
          !sidebar.contains(e.target as Node) &&
          mobileToggle &&
          !mobileToggle.contains(e.target as Node)
        ) {
          setMobileOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDesktop, mobileOpen]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const toggleMobileSidebar = () => {
    setMobileOpen((prev) => !prev);
  };

  const navItems = [
    {
      title: "Visão Geral",
      href: "/",
      icon: <Icons.dashboard className="h-5 w-5" />,
    },
    {
      title: "Instituto",
      href: "/instituto",
      icon: <Icons.institute className="h-5 w-5" />,
    },
    {
      title: "E-commerce",
      href: "/ecommerce",
      icon: <Icons.ecommerce className="h-5 w-5" />,
    },
    {
      title: "Tabelas",
      href: "/tables",
      icon: <Icons.tables className="h-5 w-5" />,
    },
    {
      title: "Upload de Dados",
      href: "/upload",
      icon: <Icons.upload className="h-5 w-5" />,
    },
  ];

  // Get page title from current path
  const getPageTitle = () => {
    if (location === "/") return "Visão Geral";
    if (location === "/instituto") return "Instituto";
    if (location === "/ecommerce") return "E-commerce";
    if (location === "/tables") return "Tabelas";
    if (location === "/upload") return "Upload de Dados";
    return "Dashboard";
  };

  if (!mounted) return null;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside
        id="sidebar"
        className={cn(
          "flex flex-col bg-sidebar border-r border-sidebar-border h-screen z-30 overflow-hidden transition-all duration-300 ease-in-out",
          !isDesktop && "fixed inset-y-0 left-0",
          !isDesktop && !mobileOpen && "-translate-x-full",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex justify-between items-center border-b border-sidebar-border">
          <div className="flex items-center overflow-hidden">
            <img
              src={getLogoPath(theme === "dark")}
              alt="TerraFé Logo"
              className="h-8 mr-2"
            />
            {sidebarOpen && (
              <span className="text-lg font-semibold text-sidebar-foreground">
                TerraFé
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {sidebarOpen ? (
              <Icons.sidebarClose className="h-5 w-5" />
            ) : (
              <Icons.sidebarOpen className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground">
              <Icons.user className="h-4 w-4" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  Administrador
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  admin@terrafe.com
                </p>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-sidebar-foreground/60">Tema</span>
              <ThemeToggle />
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="px-2 py-4 space-y-1">
            {sidebarOpen && (
              <span className="px-3 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                Navegação
              </span>
            )}

            {navItems.map((item) => (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Link href={item.href}>
                        <button
                          className={cn(
                            "flex items-center px-3 py-2 rounded-md transition-colors w-full text-left",
                            location === item.href
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground",
                            !sidebarOpen && "justify-center"
                          )}
                        >
                          {item.icon}
                          {sidebarOpen && (
                            <span className="ml-3 text-sm">{item.title}</span>
                          )}
                        </button>
                      </Link>
                    </div>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </nav>

          {/* Filters */}
          {sidebarOpen && (
            <div className="p-4 border-t border-sidebar-border">
              <span className="px-3 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                Filtros
              </span>

              {/* Date Range Picker */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-sidebar-foreground mb-1">
                  Período
                </label>
                <DatePickerWithRange
                  date={{
                    from: filters.dateRange.from,
                    to: filters.dateRange.to,
                  }}
                  onSelect={(range) => 
                    updateFilters({
                      ...filters,
                      dateRange: {
                        from: range?.from || new Date('2025-04-01'),
                        to: range?.to || new Date('2025-04-30')
                      }
                    })
                  }
                />
              </div>

              {/* Category Filter */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-sidebar-foreground mb-1">
                  Categoria
                </label>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    updateFilters({ ...filters, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="instituto">Instituto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Product Search */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-sidebar-foreground mb-1">
                  Produto
                </label>
                <Input
                  type="text"
                  placeholder="Buscar produto"
                  value={filters.product}
                  onChange={(e) =>
                    updateFilters({ ...filters, product: e.target.value })
                  }
                />
              </div>

              {/* State Filter */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-sidebar-foreground mb-1">
                  Estado
                </label>
                <Select
                  value={filters.state}
                  onValueChange={(value) =>
                    updateFilters({ ...filters, state: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="SP">São Paulo</SelectItem>
                    <SelectItem value="ES">Espírito Santo</SelectItem>
                    <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                    <SelectItem value="MG">Minas Gerais</SelectItem>
                    <SelectItem value="SC">Santa Catarina</SelectItem>
                    <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                    <SelectItem value="GO">Goiás</SelectItem>
                    <SelectItem value="DF">Distrito Federal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Order Status Filter */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-sidebar-foreground mb-1">
                  Status do Pedido
                </label>
                <Select
                  value={filters.orderStatus}
                  onValueChange={(value) =>
                    updateFilters({ ...filters, orderStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Pedido Entregue">Pedido Entregue</SelectItem>
                    <SelectItem value="Pedido Pago">Pedido Pago</SelectItem>
                    <SelectItem value="Pedido Enviado">Pedido Enviado</SelectItem>
                    <SelectItem value="Pedido em separação">Pedido em separação</SelectItem>
                    <SelectItem value="Pedido pronto para retirada">Pedido pronto para retirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Apply Filters Button */}
              <Button
                className="mt-4 w-full"
                onClick={() => updateFilters(filters)}
              >
                <Icons.filter className="mr-2 h-4 w-4" />
                Aplicar Filtros
              </Button>
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* Mobile Sidebar Toggle */}
      {!isDesktop && (
        <Button
          id="mobile-sidebar-toggle"
          variant="default"
          size="sm"
          className="fixed top-4 left-4 z-50 shadow-md flex items-center"
          onClick={toggleMobileSidebar}
        >
          <Icons.sidebarOpen className="h-4 w-4 mr-1" />
          Menu
        </Button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b z-10 py-3 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
              <p className="text-sm text-muted-foreground">Abril de 2025</p>
            </div>
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Icons.download className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar dados</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Icons.refresh className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Atualizar dados</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {!sidebarOpen && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ThemeToggle />
                    </TooltipTrigger>
                    <TooltipContent>Alternar tema</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
