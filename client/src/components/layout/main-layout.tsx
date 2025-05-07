import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
        const menuButton = document.getElementById("mobile-menu-button");
        
        // Don't close if clicking on sidebar or hamburger button
        if (
          sidebar && 
          !sidebar.contains(e.target as Node) && 
          menuButton && 
          !menuButton.contains(e.target as Node)
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
          "fixed inset-y-0 left-0 z-20 bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out lg:relative",
          sidebarOpen ? "w-64" : "w-16",
          !isDesktop && !mobileOpen && "-translate-x-full",
          !isDesktop && mobileOpen && "translate-x-0 shadow-xl"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center">
            <span 
              className={cn(
                "text-2xl transition-all duration-300",
                sidebarOpen ? "mr-2" : "mr-0"
              )}
            >
              ☕
            </span>
            {sidebarOpen && <span className="text-xl font-semibold">TerraFé</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex"
          >
            {sidebarOpen ? (
              <Icons.sidebarClose className="h-5 w-5" />
            ) : (
              <Icons.sidebarOpen className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden"
          >
            <Icons.close className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Content */}
        <ScrollArea className="flex-1">
          {/* Navigation */}
          <nav className="px-2 py-4">
            {navItems.map((item) => (
              <TooltipProvider key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mb-1">
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
                    updateFilters({
                      ...filters,
                      category: value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="instituto">Instituto</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Product Filter */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-sidebar-foreground mb-1">
                  Produto
                </label>
                <Input
                  placeholder="Filtrar por produto"
                  value={filters.product}
                  onChange={(e) => 
                    updateFilters({
                      ...filters,
                      product: e.target.value
                    })
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
                    updateFilters({
                      ...filters,
                      state: value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    <SelectItem value="SP">São Paulo</SelectItem>
                    <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                    <SelectItem value="MG">Minas Gerais</SelectItem>
                    <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                    <SelectItem value="PR">Paraná</SelectItem>
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
                    updateFilters({
                      ...filters,
                      orderStatus: value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => {
                const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
                document.documentElement.classList.toggle('dark');
              }}
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              <Icons.sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Icons.moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Alternar tema</span>
            </Button>
            {sidebarOpen && (
              <Button variant="ghost" size="sm" className="text-sidebar-foreground text-xs" asChild>
                <Link href="/upload">Atualizar Dados</Link>
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4">
          <div className="flex items-center">
            {!isDesktop && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileSidebar}
                className="mr-2"
              >
                <Icons.sidebarOpen className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex space-x-2">
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
                <Button
                  onClick={() => {
                    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
                    document.documentElement.classList.toggle('dark');
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                >
                  <Icons.sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Icons.moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Alternar tema</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background pb-16 md:pb-6">
          {children}
        </main>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden fixed bottom-5 right-5 z-50">
          <Button
            id="mobile-menu-button"
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg"
            onClick={toggleMobileSidebar}
          >
            {mobileOpen ? <Icons.close className="h-6 w-6" /> : <Icons.sidebarOpen className="h-6 w-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
}