import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface DailySalesData {
  date: string;
  total_orders: number;
  total_revenue: number;
  total_items: number;
}

export interface MonthlySalesData {
  stats: {
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
    total_items_sold: number;
    total_points_earned: number;
    total_points_redeemed: number;
    total_discounts: number;
  };
  categoryBreakdown: { category: string; total_revenue: number; total_items: number }[];
  monthName: string;
}

export interface StatusData {
  status: string;
  count: number;
}

export function exportToExcel(
  dailyData: DailySalesData[],
  monthlyData: MonthlySalesData | undefined,
  statusData: StatusData[]
) {
  const workbook = XLSX.utils.book_new();

  // Daily Sales Sheet
  const dailySheetData = [
    ['التاريخ', 'عدد الطلبات', 'إجمالي المبيعات', 'المنتجات المباعة'],
    ...dailyData.map(d => [d.date, d.total_orders, d.total_revenue, d.total_items])
  ];
  const dailySheet = XLSX.utils.aoa_to_sheet(dailySheetData);
  XLSX.utils.book_append_sheet(workbook, dailySheet, 'المبيعات اليومية');

  // Monthly Stats Sheet
  if (monthlyData) {
    const monthlySheetData = [
      ['الإحصائية', 'القيمة'],
      ['إجمالي الطلبات', monthlyData.stats.total_orders],
      ['إجمالي المبيعات', `${monthlyData.stats.total_revenue.toFixed(2)} ر.س`],
      ['متوسط قيمة الطلب', `${monthlyData.stats.average_order_value.toFixed(2)} ر.س`],
      ['المنتجات المباعة', monthlyData.stats.total_items_sold],
      ['النقاط الممنوحة', monthlyData.stats.total_points_earned],
      ['النقاط المستبدلة', monthlyData.stats.total_points_redeemed],
      ['إجمالي الخصومات', `${monthlyData.stats.total_discounts.toFixed(2)} ر.س`],
    ];
    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlySheetData);
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'إحصائيات الشهر');

    // Category Breakdown Sheet
    const categorySheetData = [
      ['الفئة', 'إجمالي المبيعات', 'المنتجات المباعة'],
      ...monthlyData.categoryBreakdown.map(c => [c.category, `${c.total_revenue.toFixed(2)} ر.س`, c.total_items])
    ];
    const categorySheet = XLSX.utils.aoa_to_sheet(categorySheetData);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'المبيعات حسب الفئة');
  }

  // Order Status Sheet
  const statusSheetData = [
    ['الحالة', 'العدد'],
    ...statusData.map(s => [s.status, s.count])
  ];
  const statusSheet = XLSX.utils.aoa_to_sheet(statusSheetData);
  XLSX.utils.book_append_sheet(workbook, statusSheet, 'حالة الطلبات');

  // Download
  const fileName = `تقرير_المبيعات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportToPDF(
  dailyData: DailySalesData[],
  monthlyData: MonthlySalesData | undefined,
  statusData: StatusData[]
) {
  const doc = new jsPDF();
  
  // Add Arabic font support workaround - use simple text
  doc.setFont('helvetica');
  
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.text('Sales Report - ' + format(new Date(), 'yyyy-MM-dd'), 105, yPos, { align: 'center' });
  yPos += 15;

  // Monthly Stats
  if (monthlyData) {
    doc.setFontSize(14);
    doc.text('Monthly Statistics', 14, yPos);
    yPos += 10;

    doc.autoTable({
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Total Orders', monthlyData.stats.total_orders.toString()],
        ['Total Revenue', `${monthlyData.stats.total_revenue.toFixed(2)} SAR`],
        ['Average Order Value', `${monthlyData.stats.average_order_value.toFixed(2)} SAR`],
        ['Items Sold', monthlyData.stats.total_items_sold.toString()],
        ['Points Earned', monthlyData.stats.total_points_earned.toString()],
        ['Points Redeemed', monthlyData.stats.total_points_redeemed.toString()],
        ['Total Discounts', `${monthlyData.stats.total_discounts.toFixed(2)} SAR`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Daily Sales
  doc.setFontSize(14);
  doc.text('Daily Sales (Last 7 Days)', 14, yPos);
  yPos += 10;

  doc.autoTable({
    startY: yPos,
    head: [['Date', 'Orders', 'Revenue (SAR)', 'Items']],
    body: dailyData.map(d => [
      d.date,
      d.total_orders.toString(),
      d.total_revenue.toFixed(2),
      d.total_items.toString()
    ]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Category Breakdown
  if (monthlyData && monthlyData.categoryBreakdown.length > 0) {
    doc.setFontSize(14);
    doc.text('Sales by Category', 14, yPos);
    yPos += 10;

    doc.autoTable({
      startY: yPos,
      head: [['Category', 'Revenue (SAR)', 'Items']],
      body: monthlyData.categoryBreakdown.map(c => [
        c.category,
        c.total_revenue.toFixed(2),
        c.total_items.toString()
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Order Status
  doc.setFontSize(14);
  doc.text('Order Status Breakdown', 14, yPos);
  yPos += 10;

  doc.autoTable({
    startY: yPos,
    head: [['Status', 'Count']],
    body: statusData.map(s => [s.status, s.count.toString()]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Download
  const fileName = `Sales_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
