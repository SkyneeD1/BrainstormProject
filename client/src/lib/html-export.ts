export interface ExportSection {
  title: string;
  content: string;
}

export interface ExportOptions {
  title: string;
  subtitle?: string;
  tenant: string;
  tenantColor: string;
  generatedAt: Date;
  sections: ExportSection[];
}

const getBaseStyles = (tenantColor: string) => `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #f8fafc;
    color: #1e293b;
    line-height: 1.5;
    padding: 2rem;
  }
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  .header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: white;
    padding: 2rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header h1 {
    font-size: 1.75rem;
    font-weight: 700;
  }
  .header .subtitle {
    font-size: 0.875rem;
    opacity: 0.8;
    margin-top: 0.25rem;
  }
  .tenant-badge {
    background: ${tenantColor};
    color: ${tenantColor === '#ffd700' ? '#000' : '#fff'};
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
  }
  .meta {
    text-align: right;
    font-size: 0.75rem;
    opacity: 0.7;
    margin-top: 0.5rem;
  }
  .section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid ${tenantColor};
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  th {
    background: #f1f5f9;
    font-weight: 600;
    color: #475569;
  }
  tr:hover {
    background: #f8fafc;
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }
  .card {
    background: #f8fafc;
    border-radius: 8px;
    padding: 1rem;
    border-left: 4px solid ${tenantColor};
  }
  .card-title {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  .card-subtitle {
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.75rem;
  }
  .stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    padding: 0.25rem 0;
  }
  .stat-label {
    color: #64748b;
  }
  .stat-value {
    font-weight: 600;
  }
  .progress-bar {
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 0.5rem;
  }
  .progress-fill {
    height: 100%;
    border-radius: 4px;
  }
  .progress-favoravel { background: #10b981; }
  .progress-desfavoravel { background: #ef4444; }
  .progress-analise { background: #f59e0b; }
  .badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  .badge-favoravel { background: #d1fae5; color: #065f46; }
  .badge-desfavoravel { background: #fee2e2; color: #991b1b; }
  .badge-analise { background: #fef3c7; color: #92400e; }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .kpi-card {
    background: linear-gradient(135deg, ${tenantColor}22 0%, ${tenantColor}11 100%);
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
  }
  .kpi-value {
    font-size: 2rem;
    font-weight: 700;
    color: #0f172a;
  }
  .kpi-label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .footer {
    text-align: center;
    padding: 2rem;
    color: #64748b;
    font-size: 0.75rem;
  }
  @media print {
    body { padding: 0; background: white; }
    .section { box-shadow: none; border: 1px solid #e2e8f0; }
    .header { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
`;

export function generateHTMLExport(options: ExportOptions): string {
  const { title, subtitle, tenant, tenantColor, generatedAt, sections } = options;
  
  const formattedDate = generatedAt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const sectionsHTML = sections.map(section => `
    <div class="section">
      <h2 class="section-title">${section.title}</h2>
      ${section.content}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${tenant}</title>
  <style>${getBaseStyles(tenantColor)}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>${title}</h1>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        <div class="meta">Gerado em ${formattedDate}</div>
      </div>
      <div class="tenant-badge">${tenant}</div>
    </div>
    
    ${sectionsHTML}
    
    <div class="footer">
      Relatório gerado automaticamente pelo sistema Contencioso - Ecossistema de Gestão
    </div>
  </div>
</body>
</html>`;
}

export function downloadHTML(html: string, filename: string) {
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

export function generateKPIHTML(kpis: Array<{ label: string; value: string | number }>): string {
  return `
    <div class="kpi-grid">
      ${kpis.map(kpi => `
        <div class="kpi-card">
          <div class="kpi-value">${kpi.value}</div>
          <div class="kpi-label">${kpi.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}

export function generateTableHTML(
  headers: string[],
  rows: string[][]
): string {
  return `
    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            ${row.map(cell => `<td>${cell}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

export function generateCardGridHTML(
  cards: Array<{
    title: string;
    subtitle?: string;
    stats: Array<{ label: string; value: string }>;
    progressBars?: Array<{ label: string; percent: number; type: 'favoravel' | 'desfavoravel' | 'analise' }>;
  }>
): string {
  return `
    <div class="card-grid">
      ${cards.map(card => `
        <div class="card">
          <div class="card-title">${card.title}</div>
          ${card.subtitle ? `<div class="card-subtitle">${card.subtitle}</div>` : ''}
          ${card.stats.map(stat => `
            <div class="stat-row">
              <span class="stat-label">${stat.label}</span>
              <span class="stat-value">${stat.value}</span>
            </div>
          `).join('')}
          ${card.progressBars ? card.progressBars.map(bar => `
            <div class="progress-bar">
              <div class="progress-fill progress-${bar.type}" style="width: ${bar.percent}%"></div>
            </div>
          `).join('') : ''}
        </div>
      `).join('')}
    </div>
  `;
}
