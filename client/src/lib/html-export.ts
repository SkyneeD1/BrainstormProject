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
    background: #0a0a0a;
    color: #fafafa;
    line-height: 1.6;
    min-height: 100vh;
  }
  .app-container {
    display: flex;
    min-height: 100vh;
  }
  .sidebar {
    width: 260px;
    background: linear-gradient(180deg, #0f4c4c 0%, #0a3535 100%);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(255,255,255,0.1);
    position: fixed;
    height: 100vh;
    overflow-y: auto;
  }
  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 0;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .sidebar-logo-icon {
    width: 40px;
    height: 40px;
    background: ${tenantColor};
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: ${tenantColor === '#ffd700' ? '#000' : '#fff'};
    font-size: 1.25rem;
  }
  .sidebar-logo-text {
    font-size: 1.125rem;
    font-weight: 600;
    color: #fff;
  }
  .sidebar-nav {
    list-style: none;
    flex: 1;
  }
  .nav-item {
    padding: 0.75rem 1rem;
    margin-bottom: 0.25rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: rgba(255,255,255,0.7);
    font-size: 0.875rem;
  }
  .nav-item:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
  .nav-item.active {
    background: ${tenantColor}33;
    color: #fff;
    border-left: 3px solid ${tenantColor};
  }
  .nav-icon {
    width: 20px;
    height: 20px;
    opacity: 0.7;
  }
  .sidebar-footer {
    padding-top: 1rem;
    border-top: 1px solid rgba(255,255,255,0.1);
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
  }
  .main-content {
    flex: 1;
    margin-left: 260px;
    background: #0a0a0a;
  }
  .main-header {
    background: #141414;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #262626;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .header-title {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .header-title h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #fafafa;
  }
  .header-title .subtitle {
    font-size: 0.875rem;
    color: #a1a1aa;
  }
  .header-badge {
    background: ${tenantColor};
    color: ${tenantColor === '#ffd700' ? '#000' : '#fff'};
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
  }
  .content-area {
    padding: 2rem;
  }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2rem;
  }
  .kpi-card {
    background: #171717;
    border: 1px solid #262626;
    border-radius: 12px;
    padding: 1.25rem;
    position: relative;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  .kpi-card:hover {
    border-color: ${tenantColor}66;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }
  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${tenantColor}, ${tenantColor}88);
  }
  .kpi-value {
    font-size: 2rem;
    font-weight: 700;
    color: #fafafa;
    margin-bottom: 0.25rem;
  }
  .kpi-label {
    font-size: 0.8rem;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .kpi-trend {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  .kpi-trend.positive { background: #14532d; color: #22c55e; }
  .kpi-trend.negative { background: #7f1d1d; color: #ef4444; }
  .section {
    background: #171717;
    border: 1px solid #262626;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    overflow: hidden;
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #262626;
    cursor: pointer;
    transition: background 0.2s;
  }
  .section-header:hover {
    background: #1c1c1c;
  }
  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #fafafa;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .section-title::before {
    content: '';
    width: 4px;
    height: 20px;
    background: ${tenantColor};
    border-radius: 2px;
  }
  .section-toggle {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #71717a;
    transition: transform 0.2s;
  }
  .section.collapsed .section-toggle {
    transform: rotate(-90deg);
  }
  .section.collapsed .section-content {
    display: none;
  }
  .section-content {
    padding: 1.5rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  th, td {
    padding: 0.875rem 1rem;
    text-align: left;
    border-bottom: 1px solid #262626;
  }
  th {
    background: #1c1c1c;
    font-weight: 600;
    color: #a1a1aa;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  tr:hover td {
    background: #1c1c1c;
  }
  td {
    color: #e4e4e7;
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.25rem;
  }
  .card {
    background: #1c1c1c;
    border: 1px solid #262626;
    border-radius: 10px;
    padding: 1.25rem;
    transition: all 0.2s ease;
  }
  .card:hover {
    border-color: ${tenantColor}44;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }
  .card-title {
    font-weight: 600;
    font-size: 1rem;
    color: #fafafa;
    margin-bottom: 0.25rem;
  }
  .card-subtitle {
    font-size: 0.75rem;
    color: #71717a;
    margin-bottom: 1rem;
  }
  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #262626;
  }
  .stat-row:last-child {
    border-bottom: none;
  }
  .stat-label {
    color: #a1a1aa;
    font-size: 0.875rem;
  }
  .stat-value {
    font-weight: 600;
    color: #fafafa;
  }
  .progress-container {
    margin-top: 1rem;
  }
  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
    color: #a1a1aa;
  }
  .progress-bar {
    height: 8px;
    background: #262626;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  .progress-favoravel { background: linear-gradient(90deg, #10b981, #34d399); }
  .progress-desfavoravel { background: linear-gradient(90deg, #ef4444, #f87171); }
  .progress-analise { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  .progress-suspeito { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.625rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    gap: 0.375rem;
  }
  .badge-favoravel { background: #14532d; color: #22c55e; }
  .badge-desfavoravel { background: #7f1d1d; color: #ef4444; }
  .badge-analise { background: #78350f; color: #fbbf24; }
  .badge-suspeito { background: #4c1d95; color: #a78bfa; }
  .tabs {
    display: flex;
    gap: 0.25rem;
    background: #1c1c1c;
    padding: 0.25rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }
  .tab {
    padding: 0.625rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    color: #a1a1aa;
    transition: all 0.2s;
    border: none;
    background: transparent;
  }
  .tab:hover {
    color: #fafafa;
    background: #262626;
  }
  .tab.active {
    background: ${tenantColor};
    color: ${tenantColor === '#ffd700' ? '#000' : '#fff'};
    font-weight: 500;
  }
  .tab-content {
    display: none;
  }
  .tab-content.active {
    display: block;
  }
  .chart-container {
    padding: 1rem;
    background: #1c1c1c;
    border-radius: 8px;
  }
  .bar-chart {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .bar-item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .bar-label {
    width: 120px;
    font-size: 0.8rem;
    color: #a1a1aa;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bar-track {
    flex: 1;
    height: 24px;
    background: #262626;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }
  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, ${tenantColor}, ${tenantColor}cc);
    border-radius: 4px;
    display: flex;
    align-items: center;
    padding-left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: ${tenantColor === '#ffd700' ? '#000' : '#fff'};
    min-width: 40px;
  }
  .bar-value {
    width: 60px;
    text-align: right;
    font-size: 0.875rem;
    font-weight: 600;
    color: #fafafa;
  }
  .footer {
    padding: 2rem;
    text-align: center;
    color: #52525b;
    font-size: 0.75rem;
    border-top: 1px solid #262626;
    margin-top: 2rem;
  }
  .tooltip {
    position: relative;
    display: inline-block;
  }
  .tooltip .tooltip-text {
    visibility: hidden;
    background: #27272a;
    color: #fafafa;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    position: absolute;
    z-index: 1000;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .tooltip:hover .tooltip-text {
    visibility: visible;
  }
  .print-only {
    display: none;
  }
  @media print {
    body { background: white; color: #000; }
    .sidebar { display: none; }
    .main-content { margin-left: 0; }
    .main-header { background: #f8f8f8; }
    .section { background: white; border: 1px solid #ddd; }
    .kpi-card { background: #f8f8f8; border: 1px solid #ddd; }
    .card { background: #f8f8f8; }
    th { background: #e8e8e8; }
    .print-only { display: block; }
    @page { margin: 1cm; }
  }
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main-content { margin-left: 0; }
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .card-grid { grid-template-columns: 1fr; }
  }
`;

const getInteractiveScript = () => `
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Toggle sections
    document.querySelectorAll('.section-header').forEach(function(header) {
      header.addEventListener('click', function() {
        this.parentElement.classList.toggle('collapsed');
      });
    });
    
    // Tab functionality
    document.querySelectorAll('.tabs').forEach(function(tabContainer) {
      const tabs = tabContainer.querySelectorAll('.tab');
      tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          const targetId = this.getAttribute('data-target');
          const parent = this.closest('.section-content') || document;
          
          // Update active tab
          tabs.forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          
          // Update content
          parent.querySelectorAll('.tab-content').forEach(function(content) {
            content.classList.remove('active');
          });
          const target = parent.querySelector('#' + targetId);
          if (target) target.classList.add('active');
        });
      });
    });
    
    // Animate bars on scroll
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.bar-fill').forEach(function(bar) {
            const width = bar.getAttribute('data-width');
            bar.style.width = width;
          });
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.bar-chart').forEach(function(chart) {
      observer.observe(chart);
    });
  });
<\/script>
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

  const tenantInitial = tenant.charAt(0).toUpperCase();

  const sectionsHTML = sections.map((section, idx) => `
    <div class="section" id="section-${idx}">
      <div class="section-header">
        <h2 class="section-title">${section.title}</h2>
        <div class="section-toggle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      <div class="section-content">
        ${section.content}
      </div>
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
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">${tenantInitial}</div>
        <span class="sidebar-logo-text">${tenant}</span>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-item active">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
          ${title}
        </div>
      </nav>
      <div class="sidebar-footer">
        Contencioso - Ecossistema de Gestão<br/>
        Relatório exportado em ${formattedDate}
      </div>
    </aside>
    
    <main class="main-content">
      <header class="main-header">
        <div class="header-title">
          <h1>${title}</h1>
          ${subtitle ? `<span class="subtitle">${subtitle}</span>` : ''}
        </div>
        <div class="header-badge">${tenant}</div>
      </header>
      
      <div class="content-area">
        ${sectionsHTML}
      </div>
      
      <div class="footer">
        Relatório gerado automaticamente pelo sistema Contencioso - Ecossistema de Gestão<br/>
        ${formattedDate}
      </div>
    </main>
  </div>
  ${getInteractiveScript()}
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

export function generateKPIHTML(kpis: Array<{ label: string; value: string | number; trend?: string }>): string {
  return `
    <div class="kpi-grid">
      ${kpis.map(kpi => {
        const trendClass = kpi.trend ? (kpi.trend.startsWith('+') || kpi.trend.startsWith('▲') ? 'positive' : 'negative') : '';
        return `
          <div class="kpi-card">
            <div class="kpi-value">${kpi.value}</div>
            <div class="kpi-label">${kpi.label}</div>
            ${kpi.trend ? `<div class="kpi-trend ${trendClass}">${kpi.trend}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function generateTableHTML(
  headers: string[],
  rows: string[][],
  options?: { striped?: boolean; compact?: boolean }
): string {
  return `
    <table${options?.compact ? ' class="compact"' : ''}>
      <thead>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row, idx) => `
          <tr${options?.striped && idx % 2 === 1 ? ' style="background:#1c1c1c"' : ''}>
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
    progressBars?: Array<{ label: string; percent: number; type: 'favoravel' | 'desfavoravel' | 'analise' | 'suspeito' }>;
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
          ${card.progressBars ? `
            <div class="progress-container">
              ${card.progressBars.map(bar => `
                <div class="progress-label">
                  <span>${bar.label}</span>
                  <span>${bar.percent}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill progress-${bar.type}" style="width: ${bar.percent}%"></div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

export function generateBarChartHTML(
  data: Array<{ label: string; value: number; displayValue?: string }>,
  options?: { maxValue?: number; color?: string }
): string {
  const maxValue = options?.maxValue || Math.max(...data.map(d => d.value));
  
  return `
    <div class="chart-container">
      <div class="bar-chart">
        ${data.map(item => {
          const percent = maxValue > 0 ? (item.value / maxValue * 100) : 0;
          return `
            <div class="bar-item">
              <div class="bar-label" title="${item.label}">${item.label}</div>
              <div class="bar-track">
                <div class="bar-fill" data-width="${percent}%" style="width: 0%"></div>
              </div>
              <div class="bar-value">${item.displayValue || item.value}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function generateTabsHTML(
  tabs: Array<{ id: string; label: string; content: string }>,
  defaultActiveId?: string
): string {
  const activeId = defaultActiveId || tabs[0]?.id;
  
  return `
    <div class="tabs">
      ${tabs.map(tab => `
        <button class="tab${tab.id === activeId ? ' active' : ''}" data-target="tab-${tab.id}">
          ${tab.label}
        </button>
      `).join('')}
    </div>
    ${tabs.map(tab => `
      <div class="tab-content${tab.id === activeId ? ' active' : ''}" id="tab-${tab.id}">
        ${tab.content}
      </div>
    `).join('')}
  `;
}

export function generateBadgeHTML(
  text: string,
  type: 'favoravel' | 'desfavoravel' | 'analise' | 'suspeito'
): string {
  const icons = {
    favoravel: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    desfavoravel: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    analise: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    suspeito: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
  };
  
  return `<span class="badge badge-${type}">${icons[type]} ${text}</span>`;
}
