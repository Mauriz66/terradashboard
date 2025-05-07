import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import { ModeToggle } from "@/components/mode-toggle";

interface MainLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { name: "Dashboard", path: "/" },
  { name: "Instituto", path: "/instituto" },
  { name: "E-commerce", path: "/ecommerce" },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">TerraFé</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              {NAV_ITEMS.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === item.path ? "text-primary font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden py-2 border-b bg-background">
        <div className="container flex justify-between overflow-x-auto px-4">
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`whitespace-nowrap px-3 py-1 text-sm font-medium rounded-md ${
                location === item.path 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1">
        <div className="container py-6 px-4 md:px-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 bg-background">
        <div className="container px-4 md:px-6">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} TerraFé - Dashboard de Análise
          </p>
        </div>
      </footer>
    </div>
  );
}