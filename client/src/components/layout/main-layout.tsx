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

              {/* Campaign Filter */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-sidebar-foreground mb-1">
                  Campanha
                </label>
                <Select 
                  value={filters.campaign}
                  onValueChange={(value) => 
                    updateFilters({
                      ...filters,
                      campaign: value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as campanhas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as campanhas</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source Filter */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-sidebar-foreground mb-1">
                  Fonte
                </label>
                <Select 
                  value={filters.source}
                  onValueChange={(value) => 
                    updateFilters({
                      ...filters,
                      source: value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as fontes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as fontes</SelectItem>
                    <SelectItem value="direct">Direto</SelectItem>
                    <SelectItem value="organic">Orgânico</SelectItem>
                    <SelectItem value="referral">Referência</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Apply Filters Button */}
              <Button className="w-full mt-4" size="sm">
                Aplicar Filtros
              </Button>
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center border-b bg-background">
          <div className="flex-1 flex justify-between items-center px-4 md:px-6">
            {/* Mobile Menu Button */}
            <Button
              id="mobile-menu-button"
              variant="ghost"
              size="icon"
              onClick={toggleMobileSidebar}
              className="lg:hidden"
            >
              <Icons.menu className="h-5 w-5" />
            </Button>

            {/* Page Title */}
            <h1 className="text-lg font-semibold hidden sm:block">
              {getPageTitle()}
            </h1>

            {/* Search */}
            <div className="hidden md:flex w-full max-w-sm mx-4">
              <Input
                type="search"
                placeholder="Pesquisar..."
                className="max-w-[260px]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Icons.notifications className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Icons.settings className="h-5 w-5" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="icon" className="rounded-full">
                <img
                  src="https://github.com/shadcn.png"
                  alt="Avatar"
                  className="h-8 w-8 rounded-full"
                />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Search */}
        <div className="md:hidden p-4 border-b">
          <Input type="search" placeholder="Pesquisar..." />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}