import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
}

export function parseDate(dateStr: string): Date {
  // Handle Brazilian date format (DD/MM/YYYY)
  if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Handle ISO format (YYYY-MM-DD)
  return new Date(dateStr);
}

export function formatDate(date: Date, formatStr: string = "dd/MM/yyyy"): string {
  return format(date, formatStr, { locale: ptBR });
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function calculateROI(investment: number, revenue: number): number {
  if (investment === 0) return 0;
  return ((revenue - investment) / investment) * 100;
}

export function parseNumberBR(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(".", "").replace(",", "."));
}

export function identifyCategory(name: string): "instituto" | "ecommerce" {
  return name.toLowerCase().includes("instituto") ? "instituto" : "ecommerce";
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function downloadCSV(data: any[], filename: string) {
  const csvContent = "data:text/csv;charset=utf-8," + data.map(row => Object.values(row).join(";")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const getLogoPath = (isDark: boolean) => {
  return isDark ? "/logo-terrafe-black.png" : "/logo-terrafe.png";
};
