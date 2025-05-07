import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, parse } from "date-fns";
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
  if (!dateStr) {
    console.warn("Data vazia recebida para parseDate");
    return new Date(); // Retorna data atual como fallback
  }
  
  // Limpar a string de data
  const cleanedDate = dateStr.trim();
  
  // Tentativa 1: Formato brasileiro DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanedDate)) {
    const [day, month, year] = cleanedDate.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Verificar se a data é válida (ex: 31/02/2022 seria inválida)
    if (isValid(date) && date.getDate() === day && date.getMonth() === month - 1) {
      return date;
    }
    console.warn(`Data em formato DD/MM/YYYY inválida: ${cleanedDate}`);
  }
  
  // Tentativa 2: Formato ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanedDate)) {
    const date = parse(cleanedDate, 'yyyy-MM-dd', new Date());
    if (isValid(date)) {
      return date;
    }
    console.warn(`Data em formato YYYY-MM-DD inválida: ${cleanedDate}`);
  }
  
  // Tentativa 3: Formato ISO com timestamp YYYY-MM-DDTHH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(cleanedDate)) {
    const date = new Date(cleanedDate);
    if (isValid(date)) {
      return date;
    }
    console.warn(`Data em formato ISO com timestamp inválida: ${cleanedDate}`);
  }
  
  // Tentativa 4: Analisar com Date.parse como último recurso
  const timestamp = Date.parse(cleanedDate);
  if (!isNaN(timestamp)) {
    return new Date(timestamp);
  }
  
  // Fallback para data atual com aviso no console
  console.warn(`Não foi possível analisar a data: ${cleanedDate}, usando data atual como fallback`);
  return new Date();
}

export function formatDate(date: Date, formatStr: string = "dd/MM/yyyy"): string {
  if (!date || !isValid(date)) {
    console.warn("Data inválida para formatação", date);
    return "Data inválida";
  }
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
  
  // Sanitizar o valor antes de converter
  const sanitized = String(value).trim();
  if (sanitized === '' || sanitized === '-') return 0;
  
  try {
    // Handle Brazilian number format: Replace comma with dot
    return parseFloat(sanitized.replace(".", "").replace(",", "."));
  } catch (error) {
    console.warn(`Erro ao analisar número: ${value}`, error);
    return 0;
  }
}

export function identifyCategory(name: string): "instituto" | "ecommerce" {
  if (!name) return "ecommerce";
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
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
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