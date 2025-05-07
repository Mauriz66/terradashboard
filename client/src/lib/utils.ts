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
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return new Date(dateStr);
}

export function formatDate(date: Date, formatStr: string = "dd/MM/yyyy"): string {
  return format(date, formatStr, { locale: ptBR });
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatROI(value: number): string {
  return `${value.toFixed(1)}x`;
}

export function calculateROI(investment: number, revenue: number): number {
  if (investment === 0) return 0;
  return revenue / investment;
}

export function parseNumberBR(value: string): number {
  if (!value) return 0;
  
  // Handle Brazilian number format: Replace comma with dot
  return parseFloat(value.replace(".", "").replace(",", "."));
}

export function identifyCategory(name: string): "instituto" | "ecommerce" {
  return name.includes('Curso') || name.includes('Oficina') ? "instituto" : "ecommerce";
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

// Download data as CSV file
export function downloadCSV(data: any[], filename: string) {
  if (!data || !data.length) return;
  
  // Get headers
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to export dashboard data as PDF
export function exportDashboardAsPDF(title: string, data: any) {
  try {
    const jsPDF = require('jspdf');
    const autoTable = require('jspdf-autotable');
    
    // Create new document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Add header with title
    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.text(`Relatório TerraFé - ${title}`, 14, 20);
    
    // Add current date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${formatDate(new Date())}`, 14, 27);
    
    // Add KPIs summary
    doc.setFontSize(12);
    doc.setTextColor(33, 33, 33);
    doc.text('Resumo:', 14, 35);
    
    const kpiData = [
      ['Total de Vendas', formatCurrency(data.kpis.totalSales)],
      ['Quantidade de Pedidos', data.kpis.totalOrders.toString()],
      ['ROI Médio', formatROI(data.kpis.roi)],
      ['Custo de Aquisição', formatCurrency(data.kpis.cac)]
    ];
    
    autoTable(doc, {
      startY: 40,
      head: [['Indicador', 'Valor']],
      body: kpiData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      margin: { top: 40, right: 14, bottom: 20, left: 14 },
    });
    
    // Add categories breakdown 
    const categoryData = [
      ['Instituto', formatPercentage(data.kpis.institutePercentage), formatCurrency(data.kpis.instituteSales)],
      ['E-commerce', formatPercentage(data.kpis.ecommercePercentage), formatCurrency(data.kpis.ecommerceSales)]
    ];
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Categoria', 'Percentual', 'Valor Total']],
      body: categoryData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      margin: { top: 10, right: 14, bottom: 20, left: 14 },
    });
    
    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('TerraFé Analytics Dashboard', 14, pageHeight - 10);
    doc.text(`Página 1 de 1`, pageWidth - 25, pageHeight - 10);
    
    // Save PDF
    doc.save(`terrafe-relatorio-${title.toLowerCase()}-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar o PDF:", error);
  }
}

export const getLogoPath = (isDark: boolean) => {
  return isDark ? "/attached_assets/logo-terrafe-black.png" : "/attached_assets/logo-terrafe.png";
};