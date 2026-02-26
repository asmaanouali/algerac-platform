/**
 * Utility functions for exporting data to CSV and XLSX formats
 */

/**
 * Export data to CSV format
 */
export function exportToCsv(headers: string[], rows: string[][], filename: string): void {
  const csvContent = "\uFEFF" + [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to XLSX format (using simple XML spreadsheet format)
 * This creates a proper .xlsx-compatible XML file without external dependencies
 */
export function exportToXlsx(headers: string[], rows: string[][], filename: string): void {
  const escapeXml = (str: string) => 
    String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Styles>\n';
  xml += '<Style ss:ID="header"><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#D9E1F2" ss:Pattern="Solid"/></Style>\n';
  xml += '<Style ss:ID="default"><Font ss:Size="10"/></Style>\n';
  xml += '</Styles>\n';
  xml += '<Worksheet ss:Name="Export">\n';
  xml += '<Table>\n';

  // Header row
  xml += '<Row>\n';
  for (const h of headers) {
    xml += `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\n`;
  }
  xml += '</Row>\n';

  // Data rows
  for (const row of rows) {
    xml += '<Row>\n';
    for (const cell of row) {
      xml += `<Cell ss:StyleID="default"><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>\n`;
    }
    xml += '</Row>\n';
  }

  xml += '</Table>\n';
  xml += '</Worksheet>\n';
  xml += '</Workbook>';

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  downloadBlob(blob, `${filename}.xlsx`);
}

/**
 * Helper to trigger a file download from a Blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
