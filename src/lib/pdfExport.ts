import jsPDF from 'jspdf';

export interface PDFExportOptions {
  title: string;
  dateRange?: string;
  data: any[];
  columns: { header: string; key: string; width?: number }[];
  chartImages?: { title: string; dataUrl: string }[];
}

export const exportToPDF = async (options: PDFExportOptions) => {
  const { title, dateRange, data, columns, chartImages = [] } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  if (dateRange) {
    doc.setFontSize(10);
    doc.setTextColor(108, 117, 125);
    doc.text(dateRange, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
  } else {
    yPosition += 10;
  }

  // Add charts
  for (const chart of chartImages) {
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.text(chart.title, 20, yPosition);
    yPosition += 10;

    try {
      const imgWidth = pageWidth - 40;
      const imgHeight = 80;
      doc.addImage(chart.dataUrl, 'PNG', 20, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 15;
    } catch (error) {
      console.error('Failed to add chart image:', error);
    }
  }

  // Add data table
  if (data.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text('Data Summary', 20, yPosition);
    yPosition += 10;

    // Table header
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(13, 110, 253);
    
    const colWidths = columns.map(col => col.width || pageWidth / columns.length - 5);
    let xPosition = 20;
    
    columns.forEach((col, index) => {
      doc.rect(xPosition, yPosition - 5, colWidths[index], 8, 'F');
      doc.text(col.header, xPosition + 2, yPosition);
      xPosition += colWidths[index];
    });
    
    yPosition += 8;

    // Table rows
    doc.setTextColor(33, 37, 41);
    const maxRows = Math.min(data.length, 30); // Limit rows to fit page
    
    for (let i = 0; i < maxRows; i++) {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      xPosition = 20;
      const row = data[i];
      
      // Alternating row colors
      if (i % 2 === 1) {
        doc.setFillColor(248, 249, 250);
        doc.rect(20, yPosition - 5, pageWidth - 40, 7, 'F');
      }

      columns.forEach((col, index) => {
        const value = row[col.key];
        const text = value !== null && value !== undefined ? String(value) : '';
        const truncated = text.length > 20 ? text.substring(0, 17) + '...' : text;
        doc.text(truncated, xPosition + 2, yPosition);
        xPosition += colWidths[index];
      });
      
      yPosition += 7;
    }

    if (data.length > maxRows) {
      yPosition += 5;
      doc.setFontSize(8);
      doc.setTextColor(108, 117, 125);
      doc.text(`Showing ${maxRows} of ${data.length} records`, 20, yPosition);
    }
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  doc.setFontSize(8);
  doc.setTextColor(108, 117, 125);
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount} | Generated ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save
  const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
  doc.save(filename);
};

export const captureChartImage = async (chartId: string): Promise<string | null> => {
  const chartElement = document.getElementById(chartId);
  if (!chartElement) return null;

  try {
    // Wait for chart to fully render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const svgElement = chartElement.querySelector('svg');
    if (!svgElement) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = svgElement.clientWidth;
        canvas.height = svgElement.clientHeight;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  } catch (error) {
    console.error('Failed to capture chart:', error);
    return null;
  }
};