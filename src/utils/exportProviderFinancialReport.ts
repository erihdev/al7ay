import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ProviderFinancialData {
  businessName: string;
  email: string;
  commissionRate: number;
  periodStart: string;
  periodEnd: string;
  totalRevenue: number;
  platformCommission: number;
  netEarnings: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
  dailyBreakdown: { date: string; orders: number; revenue: number }[];
  payoutHistory: {
    date: string;
    amount: number;
    commission: number;
    netAmount: number;
    reference: string | null;
  }[];
}

export function exportProviderFinancialReportToPDF(data: ProviderFinancialData) {
  const doc = new jsPDF();

  let yPos = 20;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Report', 105, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(27, 67, 50); // Primary green
  doc.text(data.businessName, 105, yPos, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Report Period: ${format(new Date(data.periodStart), 'yyyy-MM-dd')} to ${format(new Date(data.periodEnd), 'yyyy-MM-dd')}`, 105, yPos, { align: 'center' });
  doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 105, yPos + 5, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 18;

  // Summary Box
  doc.setFillColor(236, 253, 245); // Light green background
  doc.roundedRect(14, yPos, 182, 50, 3, 3, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', 105, yPos + 10, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Left column
  doc.text(`Total Revenue: ${data.totalRevenue.toFixed(2)} SAR`, 24, yPos + 22);
  doc.text(`Platform Commission (${data.commissionRate}%): ${data.platformCommission.toFixed(2)} SAR`, 24, yPos + 30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`Net Earnings: ${data.netEarnings.toFixed(2)} SAR`, 24, yPos + 40);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Right column
  doc.text(`Total Orders: ${data.totalOrders}`, 120, yPos + 22);
  doc.text(`Completed: ${data.completedOrders}`, 120, yPos + 30);
  doc.text(`Avg Order Value: ${data.avgOrderValue.toFixed(2)} SAR`, 120, yPos + 40);
  
  yPos += 60;

  // Order Statistics Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Statistics', 14, yPos);
  yPos += 8;

  doc.autoTable({
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Total Orders', data.totalOrders.toString()],
      ['Completed Orders', data.completedOrders.toString()],
      ['Cancelled Orders', data.cancelledOrders.toString()],
      ['Completion Rate', `${((data.completedOrders / data.totalOrders) * 100 || 0).toFixed(1)}%`],
      ['Average Order Value', `${data.avgOrderValue.toFixed(2)} SAR`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [27, 67, 50] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Daily Breakdown
  if (data.dailyBreakdown.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Breakdown', 14, yPos);
    yPos += 8;

    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Orders', 'Revenue (SAR)']],
      body: data.dailyBreakdown.map(day => [
        day.date,
        day.orders.toString(),
        day.revenue.toFixed(2),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [45, 106, 79] },
      styles: { halign: 'center' },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Payout History
  if (data.payoutHistory.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Payout History', 14, yPos);
    yPos += 8;

    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Gross Amount', 'Commission', 'Net Payout', 'Reference']],
      body: data.payoutHistory.map(payout => [
        payout.date,
        `${payout.amount.toFixed(2)} SAR`,
        `${payout.commission.toFixed(2)} SAR`,
        `${payout.netAmount.toFixed(2)} SAR`,
        payout.reference || '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [64, 145, 108] },
      styles: { halign: 'center' },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | Al-Hay Platform - Financial Report`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `Financial_Report_${data.businessName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
