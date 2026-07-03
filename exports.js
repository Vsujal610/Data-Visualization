// ============================================================
// Export Utilities Module
// Handles file compilation and downloading for CSV, JSON, Excel, PDF
// ============================================================

const exportsUtil = {
  /** Helper to trigger standard browser file download */
  triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /** Natively exports filtered sales data to CSV format */
  exportToCSV(data, filename = 'sales-report') {
    const headers = ['ID', 'Date', 'Region', 'Product', 'Category', 'Sales ($)', 'Quantity', 'Profit ($)'];
    const rows = data.map((r) => [
      r.id,
      r.date,
      r.region,
      r.product,
      r.category,
      r.sales.toFixed(2),
      r.quantity,
      r.profit.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.triggerDownload(blob, `${filename}.csv`);
  },

  /** Natively exports filtered sales data to JSON format */
  exportToJSON(data, filename = 'sales-report') {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    this.triggerDownload(blob, `${filename}.json`);
  },

  /** Exports to Excel format using sheetjs/xlsx (loaded via CDN) */
  exportToExcel(data, filename = 'sales-report') {
    if (typeof XLSX === 'undefined') {
      throw new Error('XLSX library is not loaded.');
    }

    const worksheetData = [
      ['ID', 'Date', 'Region', 'Product', 'Category', 'Sales ($)', 'Quantity', 'Profit ($)'],
      ...data.map((r) => [r.id, r.date, r.region, r.product, r.category, r.sales, r.quantity, r.profit]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },  // ID
      { wch: 12 }, // Date
      { wch: 10 }, // Region
      { wch: 18 }, // Product
      { wch: 16 }, // Category
      { wch: 12 }, // Sales ($)
      { wch: 10 }, // Quantity
      { wch: 12 }, // Profit ($)
    ];

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  },

  /** Exports to PDF using jsPDF + AutoTable (loaded via CDN) */
  exportToPDF(data, kpis, filename = 'sales-report') {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('jsPDF library is not loaded.');
    }

    const { jsPDF } = window.jspdf;
    // landscape, mm units, A4 page size
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // ---- Title Banner ----
    doc.setFillColor(8, 15, 30); // Dark background matching topbar
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Sales Performance Report', 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`, 230, 18);

    // ---- KPI Summary Table ----
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Performance Indicators', 14, 40);

    const kpiData = [
      ['Total Sales', `$${kpis.totalSales.toLocaleString()}`],
      ['Total Profit', `$${kpis.totalProfit.toLocaleString()}`],
      ['Total Orders', kpis.totalOrders.toLocaleString()],
      ['Avg Order Value', `$${kpis.avgOrderValue.toFixed(2)}`],
    ];

    doc.autoTable({
      startY: 44,
      head: [['Metric', 'Value']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14 },
      tableWidth: 100,
    });

    // ---- Data Table ----
    const startY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`Data Records (${data.length} rows)`, 14, startY);

    // Chunk large data to avoid massive PDFs
    const displayData = data.slice(0, 500);
    doc.autoTable({
      startY: startY + 4,
      head: [['Date', 'Region', 'Product', 'Category', 'Sales ($)', 'Qty', 'Profit ($)']],
      body: displayData.map((r) => [
        r.date,
        r.region,
        r.product,
        r.category,
        r.sales.toFixed(2),
        r.quantity,
        r.profit.toFixed(2),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14 },
    });

    doc.save(`${filename}.pdf`);
  }
};

window.exportsUtil = exportsUtil;
