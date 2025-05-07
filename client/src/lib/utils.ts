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

export function formatROI(value: number): string {
  const formattedValue = value.toFixed(1);
  return formattedValue + "x";
}

export function calculateROI(investment: number, revenue: number): number {
  if (investment === 0) return 0;
  return revenue / investment; // Return multiplicative ROI instead of percentage
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

// Function to export dashboard data as PDF
export function exportDashboardAsPDF(title: string, data: any) {
  // Import necessary libraries dynamically
  import('jspdf').then(jsPDFModule => {
    import('jspdf-autotable').then(autoTableModule => {
      import('html2canvas').then(html2canvasModule => {
        const jsPDF = jsPDFModule.default;
        const html2canvas = html2canvasModule.default;
        
        // Create new document
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Add header with logo and title
        doc.setFontSize(20);
        doc.setTextColor(33, 33, 33);
        doc.text(`Relatório TerraFé - ${title}`, 14, 20);
        
        // Add current date
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 27);
        
        // Add KPIs summary
        doc.setFontSize(12);
        doc.setTextColor(33, 33, 33);
        doc.text('Resumo:', 14, 35);
        
        const kpiData = [
          ['Total de Vendas', formatCurrency(data.kpis.totalSales)],
          ['Quantidade de Pedidos', data.kpis.totalOrders.toString()],
          ['ROI Médio', formatROI(data.kpis.roi)],
          ['Custo de Aquisição', formatCurrency(data.kpis.cac)],
          ['Taxa de Conversão', formatPercentage(data.kpis.conversionRate)]
        ];
        
        (doc as any).autoTable({
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
        
        (doc as any).autoTable({
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [['Categoria', 'Percentual', 'Valor Total']],
          body: categoryData,
          theme: 'grid',
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          margin: { top: 10, right: 14, bottom: 20, left: 14 },
        });
        
        // Add footer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text('TerraFé Analytics Dashboard', 14, pageHeight - 10);
          doc.text(`Página ${i} de ${totalPages}`, pageWidth - 25, pageHeight - 10);
        }
        
        // Save PDF
        doc.save(`terrafe-relatorio-${title.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
      });
    });
  });
}

export const getLogoPath = (isDark: boolean) => {
  return isDark ? "/logo-terrafe-black.png" : "/logo-terrafe.png";
};
