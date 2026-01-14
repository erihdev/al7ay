import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface AdvancedStatsData {
  todayOrders: number;
  todayRevenue: number;
  weeklyOrders: number;
  weeklyRevenue: number;
  monthlyOrders: number;
  monthlyRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  customersCount: number;
  providersCount: number;
  productsCount: number;
  deliveryOrders: number;
  pickupOrders: number;
  statusBreakdown: {
    pending: number;
    preparing: number;
    ready: number;
    out_for_delivery: number;
    completed: number;
    cancelled: number;
  };
  last7Days: { date: string; orders: number; revenue: number }[];
  categoryBreakdown: Record<string, number>;
}

export function exportAdvancedStatsToPDF(stats: AdvancedStatsData) {
  const doc = new jsPDF();
  
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Advanced Analytics Report', 105, yPos, { align: 'center' });
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 105, yPos, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  // Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Revenue Summary', 14, yPos);
  yPos += 10;

  doc.autoTable({
    startY: yPos,
    head: [['Period', 'Orders', 'Revenue (SAR)']],
    body: [
      ['Today', stats.todayOrders.toString(), stats.todayRevenue.toFixed(2)],
      ['This Week', stats.weeklyOrders.toString(), stats.weeklyRevenue.toFixed(2)],
      ['This Month', stats.monthlyOrders.toString(), stats.monthlyRevenue.toFixed(2)],
      ['All Time', stats.totalOrders.toString(), '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [124, 58, 237] },
    styles: { halign: 'center' },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Key Metrics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Metrics', 14, yPos);
  yPos += 10;

  doc.autoTable({
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Average Order Value', `${stats.avgOrderValue.toFixed(2)} SAR`],
      ['Total Customers', stats.customersCount.toString()],
      ['Active Providers', stats.providersCount.toString()],
      ['Available Products', stats.productsCount.toString()],
      ['Delivery Orders', stats.deliveryOrders.toString()],
      ['Pickup Orders', stats.pickupOrders.toString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Order Status Breakdown
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Status Breakdown', 14, yPos);
  yPos += 10;

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    out_for_delivery: 'Out for Delivery',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  doc.autoTable({
    startY: yPos,
    head: [['Status', 'Count']],
    body: Object.entries(stats.statusBreakdown).map(([key, value]) => [
      statusLabels[key] || key,
      value.toString(),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  // Last 7 Days Performance
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Last 7 Days Performance', 14, yPos);
  yPos += 10;

  doc.autoTable({
    startY: yPos,
    head: [['Day', 'Orders', 'Revenue (SAR)']],
    body: stats.last7Days.map(day => [
      day.date,
      day.orders.toString(),
      day.revenue.toFixed(2),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] },
    styles: { halign: 'center' },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Category Breakdown
  if (Object.keys(stats.categoryBreakdown).length > 0) {
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    const categoryLabels: Record<string, string> = {
      coffee: 'Coffee',
      sweets: 'Sweets',
      cold_drinks: 'Cold Drinks',
      other: 'Other',
    };

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Revenue by Category', 14, yPos);
    yPos += 10;

    doc.autoTable({
      startY: yPos,
      head: [['Category', 'Revenue (SAR)']],
      body: Object.entries(stats.categoryBreakdown).map(([key, value]) => [
        categoryLabels[key] || key,
        value.toFixed(2),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [236, 72, 153] },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | Al-Hay Platform - Version 1.0.0`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `Analytics_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
