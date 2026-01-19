import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface JobPosition {
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  duties: string[];
}

interface EmployeeContract {
  contract_number: string;
  start_date: string;
  end_date: string | null;
  salary: number;
  contract_type: string;
  duties: string[];
  terms_ar: string | null;
  employee_signature: string | null;
  employee_signed_at: string | null;
  admin_signature: string | null;
  admin_signed_at: string | null;
  status: string;
  job_positions?: JobPosition;
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time - دوام كامل',
  part_time: 'Part Time - دوام جزئي',
  contract: 'Contract - عقد مؤقت',
};

export const exportContractToPDF = async (
  contract: EmployeeContract,
  employeeName: string
) => {
  const doc = new jsPDF();
  
  // Set font for Arabic support (using default for now)
  doc.setFont('helvetica');
  
  let y = 20;
  const marginLeft = 20;
  const marginRight = 190;
  const lineHeight = 8;
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Employment Contract', marginRight, y, { align: 'right' });
  y += lineHeight;
  doc.setFontSize(16);
  doc.text('عقد عمل', marginRight, y, { align: 'right' });
  y += lineHeight * 2;
  
  // Contract Number
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contract Number: ${contract.contract_number}`, marginLeft, y);
  y += lineHeight;
  doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, marginLeft, y);
  y += lineHeight * 2;
  
  // Horizontal line
  doc.setDrawColor(200);
  doc.line(marginLeft, y, marginRight, y);
  y += lineHeight;
  
  // Employee Details
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Details / بيانات الموظف', marginLeft, y);
  y += lineHeight;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${employeeName}`, marginLeft, y);
  y += lineHeight;
  doc.text(`Position: ${contract.job_positions?.title_ar || 'N/A'}`, marginLeft, y);
  if (contract.job_positions?.title_en) {
    y += lineHeight;
    doc.text(`Position (EN): ${contract.job_positions.title_en}`, marginLeft, y);
  }
  y += lineHeight * 2;
  
  // Contract Details
  doc.setFont('helvetica', 'bold');
  doc.text('Contract Details / تفاصيل العقد', marginLeft, y);
  y += lineHeight;
  doc.setFont('helvetica', 'normal');
  doc.text(`Contract Type: ${CONTRACT_TYPE_LABELS[contract.contract_type] || contract.contract_type}`, marginLeft, y);
  y += lineHeight;
  doc.text(`Start Date: ${format(new Date(contract.start_date), 'dd MMMM yyyy')}`, marginLeft, y);
  y += lineHeight;
  if (contract.end_date) {
    doc.text(`End Date: ${format(new Date(contract.end_date), 'dd MMMM yyyy')}`, marginLeft, y);
    y += lineHeight;
  }
  doc.text(`Monthly Salary: ${contract.salary.toLocaleString()} SAR`, marginLeft, y);
  y += lineHeight * 2;
  
  // Job Description
  if (contract.job_positions?.description_ar) {
    doc.setFont('helvetica', 'bold');
    doc.text('Job Description / الوصف الوظيفي', marginLeft, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    
    const descLines = doc.splitTextToSize(contract.job_positions.description_ar, 170);
    descLines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, marginLeft, y);
      y += lineHeight;
    });
    y += lineHeight;
  }
  
  // Duties
  if (contract.duties && contract.duties.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Duties & Responsibilities / المهام والمسؤوليات', marginLeft, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    
    contract.duties.forEach((duty, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const dutyLines = doc.splitTextToSize(`${index + 1}. ${duty}`, 170);
      dutyLines.forEach((line: string) => {
        doc.text(line, marginLeft, y);
        y += lineHeight;
      });
    });
    y += lineHeight;
  }
  
  // Additional Terms
  if (contract.terms_ar) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Terms / شروط إضافية', marginLeft, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    
    const termsLines = doc.splitTextToSize(contract.terms_ar, 170);
    termsLines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, marginLeft, y);
      y += lineHeight;
    });
    y += lineHeight;
  }
  
  // Signatures Section
  if (y > 180) {
    doc.addPage();
    y = 20;
  }
  
  y += lineHeight;
  doc.setDrawColor(200);
  doc.line(marginLeft, y, marginRight, y);
  y += lineHeight * 2;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Signatures / التوقيعات', marginLeft, y);
  y += lineHeight * 2;
  
  // Two columns for signatures
  const col1X = marginLeft;
  const col2X = 110;
  const sigStartY = y;
  
  // Admin Signature
  doc.setFont('helvetica', 'bold');
  doc.text('Management / الإدارة', col1X, y);
  y += lineHeight;
  doc.setFont('helvetica', 'normal');
  
  if (contract.admin_signature) {
    try {
      // Add signature image
      doc.addImage(contract.admin_signature, 'PNG', col1X, y, 50, 25);
      y += 30;
      doc.text(`Signed: ${format(new Date(contract.admin_signed_at!), 'dd/MM/yyyy HH:mm')}`, col1X, y);
    } catch (e) {
      doc.text('[Signature on file]', col1X, y);
      y += lineHeight;
      doc.text(`Signed: ${format(new Date(contract.admin_signed_at!), 'dd/MM/yyyy HH:mm')}`, col1X, y);
    }
  } else {
    doc.setDrawColor(150);
    doc.rect(col1X, y, 60, 25);
    y += 30;
    doc.text('Pending signature', col1X, y);
  }
  
  // Employee Signature
  y = sigStartY;
  doc.setFont('helvetica', 'bold');
  doc.text('Employee / الموظف', col2X, y);
  y += lineHeight;
  doc.setFont('helvetica', 'normal');
  
  if (contract.employee_signature) {
    try {
      doc.addImage(contract.employee_signature, 'PNG', col2X, y, 50, 25);
      y += 30;
      doc.text(`Signed: ${format(new Date(contract.employee_signed_at!), 'dd/MM/yyyy HH:mm')}`, col2X, y);
    } catch (e) {
      doc.text('[Signature on file]', col2X, y);
      y += lineHeight;
      doc.text(`Signed: ${format(new Date(contract.employee_signed_at!), 'dd/MM/yyyy HH:mm')}`, col2X, y);
    }
  } else {
    doc.setDrawColor(150);
    doc.rect(col2X, y, 60, 25);
    y += 30;
    doc.text('Pending signature', col2X, y);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    doc.text(`Contract: ${contract.contract_number}`, 105, 290, { align: 'center' });
  }
  
  // Save the PDF
  doc.save(`Contract_${contract.contract_number}.pdf`);
};
