import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ScreenshotExportOptions {
  filename: string;
  title: string;
  tenant: string;
  tenantColor: string;
  format: 'png' | 'pdf' | 'html';
}

export async function captureAndExport(
  element: HTMLElement,
  options: ScreenshotExportOptions
): Promise<void> {
  const { filename, title, tenant, tenantColor, format } = options;

  const isDarkMode = document.documentElement.classList.contains('dark');
  const backgroundColor = isDarkMode ? '#0a0a0a' : '#ffffff';
  
  try {
    const canvas = await html2canvas(element, {
      backgroundColor,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    if (format === 'png') {
      downloadImage(canvas, `${filename}.png`);
    } else if (format === 'pdf') {
      downloadPDF(canvas, `${filename}.pdf`, title, tenant);
    } else if (format === 'html') {
      downloadHTMLWithImage(canvas, `${filename}.html`, title, tenant, tenantColor);
    }
  } catch (err) {
    console.error('Error capturing element:', err);
    throw err;
  }
}

function downloadImage(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function downloadPDF(
  canvas: HTMLCanvasElement,
  filename: string,
  title: string,
  tenant: string
): void {
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  const pdfWidth = 297;
  const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfWidth, pdfHeight + 20],
  });

  pdf.setFontSize(12);
  pdf.setTextColor(100);
  pdf.text(`${title} - ${tenant}`, 10, 10);
  pdf.text(
    `Gerado em ${new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    10,
    16
  );

  pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
  pdf.save(filename);
}

function downloadHTMLWithImage(
  canvas: HTMLCanvasElement,
  filename: string,
  _title: string,
  _tenant: string,
  _tenantColor: string
): void {
  const imgData = canvas.toDataURL('image/png');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Exportado</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #f8fafc; }
    body { display: flex; justify-content: center; align-items: flex-start; padding: 0; }
    img { max-width: 100%; height: auto; display: block; }
    @media print {
      body { padding: 0; }
      img { width: 100%; }
    }
  </style>
</head>
<body>
  <img src="${imgData}" alt="Relatório" />
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function captureElementAsImage(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });
  return canvas.toDataURL('image/png');
}
