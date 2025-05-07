import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 px-4">
        {children}
      </div>
    </div>
  );
}