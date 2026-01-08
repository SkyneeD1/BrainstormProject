export interface DOMExportOptions {
  title: string;
  tenant: string;
  tenantColor: string;
}

// Dashboard export data interface
export interface DashboardExportData {
  summary: {
    totalProcessos: number;
    totalPassivo: number;
    ticketMedioGlobal: number;
    percentualRiscoProvavel: number;
    percentualFaseRecursal: number;
  };
  fases: Array<{
    fase: string;
    processos: number;
    percentualProcessos: number;
    valorTotal: number;
    percentualValor: number;
    ticketMedio: number;
  }>;
  riscos: Array<{
    risco: string;
    processos: number;
    percentualProcessos: number;
    valorTotal: number;
    percentualValor: number;
    ticketMedio: number;
  }>;
  empresas: Array<{
    empresa: string;
    conhecimento: { processos: number; valor: number; percentualValor: number };
    recursal: { processos: number; valor: number; percentualValor: number };
    execucao: { processos: number; valor: number; percentualValor: number };
    total: { processos: number; percentualProcessos: number; valor: number; percentualValor: number };
  }>;
  periodoLabel: string;
}

export interface MapaDecisoesExportData {
  trts: Array<{
    nome: string;
    totalTurmas: number;
    totalDesembargadores: number;
    totalDecisoes: number;
    favoraveis: number;
    desfavoraveis: number;
    percentualFavoravel: number;
    turmas: Array<{
      id: string;
      nome: string;
      totalDesembargadores: number;
      totalDecisoes: number;
      favoraveis: number;
      desfavoraveis: number;
      percentualFavoravel: number;
      desembargadores: Array<{
        id: string;
        nome: string;
        totalDecisoes: number;
        favoraveis: number;
        desfavoraveis: number;
        percentualFavoravel: number;
        decisoes: Array<{
          id: string;
          data: string;
          processo: string;
          resultado: string;
          responsabilidade: string;
          empresa: string;
        }>;
      }>;
    }>;
  }>;
  labels: {
    pageTitle: string;
    level1: string;
    level1Plural?: string;
    level2: string;
    level3: string;
  };
  instancia: string;
}

export async function exportPageAsHTML(
  element: HTMLElement,
  options: DOMExportOptions
): Promise<void> {
  const { title, tenant } = options;
  
  // Save original state of tab panels
  const originalStates = saveOriginalStates(element);
  
  // First, expand all hidden content
  expandAllContent(element);
  
  // Wait a bit for any animations/transitions to complete
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const clone = element.cloneNode(true) as HTMLElement;
  
  const allStyles = extractAllStyles();
  
  applyInlineStyles(element, clone);
  
  // Make all tab panels visible in the clone
  showAllTabPanels(clone);
  
  const html = buildFullHTML(clone, allStyles, title, tenant);
  
  // Restore original state
  restoreOriginalStates(element, originalStates);
  
  downloadHTML(html, `${title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`);
}

interface ElementState {
  element: HTMLElement;
  hidden: boolean;
  dataState: string | null;
  display: string;
}

function saveOriginalStates(element: HTMLElement): ElementState[] {
  const states: ElementState[] = [];
  
  const tabPanels = element.querySelectorAll('[role="tabpanel"]');
  tabPanels.forEach(panel => {
    const el = panel as HTMLElement;
    states.push({
      element: el,
      hidden: el.hasAttribute('hidden'),
      dataState: el.getAttribute('data-state'),
      display: el.style.display
    });
  });
  
  return states;
}

function restoreOriginalStates(element: HTMLElement, states: ElementState[]): void {
  states.forEach(state => {
    if (state.hidden) {
      state.element.setAttribute('hidden', '');
    } else {
      state.element.removeAttribute('hidden');
    }
    if (state.dataState) {
      state.element.setAttribute('data-state', state.dataState);
    }
    state.element.style.display = state.display;
  });
}

function expandAllContent(element: HTMLElement): void {
  // Expand all tab panels by making them visible
  const tabPanels = element.querySelectorAll('[role="tabpanel"]');
  tabPanels.forEach(panel => {
    (panel as HTMLElement).removeAttribute('hidden');
    (panel as HTMLElement).setAttribute('data-state', 'active');
    (panel as HTMLElement).style.display = 'block';
  });
  
  // Expand all collapsible content
  const collapsibles = element.querySelectorAll('[data-state="closed"]');
  collapsibles.forEach(item => {
    (item as HTMLElement).setAttribute('data-state', 'open');
  });
  
  // Expand accordions
  const accordionItems = element.querySelectorAll('[data-orientation="vertical"] [data-state="closed"]');
  accordionItems.forEach(item => {
    (item as HTMLElement).setAttribute('data-state', 'open');
  });
}

function showAllTabPanels(clone: HTMLElement): void {
  // Find all tabs containers
  const tabsContainers = clone.querySelectorAll('[role="tablist"]');
  
  tabsContainers.forEach(tabList => {
    const container = tabList.parentElement;
    if (!container) return;
    
    // Get all tab panels in this container
    const panels = container.querySelectorAll('[role="tabpanel"]');
    const tabs = tabList.querySelectorAll('[role="tab"]');
    
    // Add section headers and show all panels
    panels.forEach((panel, index) => {
      const panelEl = panel as HTMLElement;
      panelEl.removeAttribute('hidden');
      panelEl.setAttribute('data-state', 'active');
      panelEl.style.display = 'block';
      
      // Get the tab name for this panel
      const tabName = tabs[index]?.textContent?.trim() || `Seção ${index + 1}`;
      
      // Add a visual separator/header before the panel content
      const header = document.createElement('div');
      header.className = 'export-section-header';
      header.style.cssText = 'padding: 16px 0 8px 0; margin-top: 24px; border-top: 2px solid #e5e7eb; font-size: 18px; font-weight: 600; color: inherit;';
      header.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 8px;">${tabName}</span>`;
      
      panelEl.insertBefore(header, panelEl.firstChild);
    });
  });
  
  // Hide the tab navigation itself since we're showing all content
  tabsContainers.forEach(tabList => {
    (tabList as HTMLElement).style.display = 'none';
  });
}

function extractAllStyles(): string {
  const styles: string[] = [];
  
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      if (sheet.cssRules) {
        for (const rule of Array.from(sheet.cssRules)) {
          styles.push(rule.cssText);
        }
      }
    } catch (e) {
      if (sheet.href) {
        styles.push(`/* External stylesheet: ${sheet.href} */`);
      }
    }
  }
  
  return styles.join('\n');
}

function applyInlineStyles(original: HTMLElement, clone: HTMLElement): void {
  const originalElements = original.querySelectorAll('*');
  const cloneElements = clone.querySelectorAll('*');
  
  applyComputedStyle(original, clone);
  
  originalElements.forEach((origEl, index) => {
    const cloneEl = cloneElements[index] as HTMLElement;
    if (origEl instanceof HTMLElement && cloneEl) {
      applyComputedStyle(origEl, cloneEl);
    }
  });
}

function applyComputedStyle(original: HTMLElement, clone: HTMLElement): void {
  const computed = window.getComputedStyle(original);
  const important = [
    'display', 'flex-direction', 'justify-content', 'align-items', 'gap',
    'grid-template-columns', 'grid-template-rows',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'border', 'border-radius', 'border-color', 'border-width',
    'background', 'background-color', 'background-image',
    'color', 'font-family', 'font-size', 'font-weight', 'line-height', 'text-align',
    'position', 'top', 'right', 'bottom', 'left', 'z-index',
    'overflow', 'opacity', 'visibility',
    'box-shadow', 'transform'
  ];
  
  important.forEach(prop => {
    const value = computed.getPropertyValue(prop);
    if (value && value !== 'none' && value !== 'auto' && value !== '0px' && value !== 'normal') {
      clone.style.setProperty(prop, value);
    }
  });
}

function buildFullHTML(content: HTMLElement, styles: string, title: string, tenant: string): string {
  const isDark = document.documentElement.classList.contains('dark');
  const bgColor = isDark ? '#0a0a0a' : '#ffffff';
  const textColor = isDark ? '#fafafa' : '#0a0a0a';
  
  return `<!DOCTYPE html>
<html lang="pt-BR" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${tenant}</title>
  <style>
    :root {
      --background: ${isDark ? '0 0% 3.9%' : '0 0% 100%'};
      --foreground: ${isDark ? '0 0% 98%' : '0 0% 3.9%'};
      --card: ${isDark ? '0 0% 3.9%' : '0 0% 100%'};
      --card-foreground: ${isDark ? '0 0% 98%' : '0 0% 3.9%'};
      --popover: ${isDark ? '0 0% 3.9%' : '0 0% 100%'};
      --popover-foreground: ${isDark ? '0 0% 98%' : '0 0% 3.9%'};
      --primary: 47.9 95.8% 53.1%;
      --primary-foreground: 26 83.3% 14.1%;
      --secondary: ${isDark ? '0 0% 14.9%' : '0 0% 96.1%'};
      --secondary-foreground: ${isDark ? '0 0% 98%' : '0 0% 9%'};
      --muted: ${isDark ? '0 0% 14.9%' : '0 0% 96.1%'};
      --muted-foreground: ${isDark ? '0 0% 63.9%' : '0 0% 45.1%'};
      --accent: ${isDark ? '0 0% 14.9%' : '0 0% 96.1%'};
      --accent-foreground: ${isDark ? '0 0% 98%' : '0 0% 9%'};
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 0 0% 98%;
      --border: ${isDark ? '0 0% 14.9%' : '0 0% 89.8%'};
      --input: ${isDark ? '0 0% 14.9%' : '0 0% 89.8%'};
      --ring: 47.9 95.8% 53.1%;
      --radius: 0.5rem;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${bgColor};
      color: ${textColor};
      min-height: 100vh;
    }
    
    ${styles}
    
    /* Print styles */
    @media print {
      body {
        background: white !important;
        color: black !important;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  ${content.outerHTML}
  <script>
    // Enable basic tab switching
    document.addEventListener('DOMContentLoaded', function() {
      // Handle tab clicks
      document.querySelectorAll('[role="tab"]').forEach(function(tab) {
        tab.addEventListener('click', function() {
          const tabList = this.closest('[role="tablist"]');
          if (!tabList) return;
          
          // Deactivate all tabs
          tabList.querySelectorAll('[role="tab"]').forEach(function(t) {
            t.setAttribute('aria-selected', 'false');
            t.setAttribute('data-state', 'inactive');
          });
          
          // Activate clicked tab
          this.setAttribute('aria-selected', 'true');
          this.setAttribute('data-state', 'active');
          
          // Find and show/hide tab panels
          const panelId = this.getAttribute('aria-controls');
          const container = tabList.parentElement;
          if (container) {
            container.querySelectorAll('[role="tabpanel"]').forEach(function(panel) {
              if (panel.id === panelId) {
                panel.removeAttribute('hidden');
                panel.setAttribute('data-state', 'active');
              } else {
                panel.setAttribute('hidden', '');
                panel.setAttribute('data-state', 'inactive');
              }
            });
          }
        });
      });

      // Handle collapsible sections
      document.querySelectorAll('[data-collapsible]').forEach(function(trigger) {
        trigger.addEventListener('click', function() {
          const content = this.nextElementSibling;
          if (content) {
            const isOpen = content.getAttribute('data-state') === 'open';
            content.setAttribute('data-state', isOpen ? 'closed' : 'open');
            this.setAttribute('aria-expanded', !isOpen);
          }
        });
      });
    });
  </script>
</body>
</html>`;
}

function downloadHTML(html: string, filename: string): void {
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

// Export Mapa de Decisões with full hierarchy - styled like the app
export async function exportMapaDecisoesAsHTML(
  data: MapaDecisoesExportData,
  options: DOMExportOptions
): Promise<void> {
  const { title, tenant, tenantColor } = options;
  const isDark = document.documentElement.classList.contains('dark');
  const bgColor = isDark ? '#0a0a0a' : '#f8fafc';
  const textColor = isDark ? '#fafafa' : '#0a0a0a';
  const cardBg = isDark ? '#1a1a1a' : '#ffffff';
  const borderColor = isDark ? '#333' : '#e2e8f0';
  const mutedColor = isDark ? '#888' : '#64748b';
  const accentBg = isDark ? '#0f172a' : '#f1f5f9';
  
  const labels = data.labels;
  
  // Calculate totals
  const totalTRTs = data.trts.length;
  const totalTurmas = data.trts.reduce((sum, t) => sum + t.totalTurmas, 0);
  const totalDesemb = data.trts.reduce((sum, t) => sum + t.totalDesembargadores, 0);
  const totalDecisoes = data.trts.reduce((sum, t) => sum + t.totalDecisoes, 0);
  const totalFav = data.trts.reduce((sum, t) => sum + t.favoraveis, 0);
  const overallPercent = totalDecisoes > 0 ? Math.round((totalFav / totalDecisoes) * 100) : 0;
  
  let content = `
    <div style="max-width: 1400px; margin: 0 auto; padding: 32px;">
      <header style="margin-bottom: 32px; display: flex; align-items: center; gap: 16px;">
        <div style="width: 48px; height: 48px; background: ${tenantColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${isDark ? '#000' : '#fff'}" stroke-width="2">
            <path d="M4 7l8 4 8-4M4 7v10l8 4 8-4V7M4 7l8-4 8 4"/>
          </svg>
        </div>
        <div>
          <h1 style="font-size: 24px; font-weight: bold; margin: 0;">${labels.pageTitle}</h1>
          <p style="color: ${mutedColor}; font-size: 14px; margin: 4px 0 0 0;">
            Exportado em ${new Date().toLocaleDateString('pt-BR')} - ${tenant}
          </p>
        </div>
      </header>
      
      <!-- Summary KPIs -->
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 32px;">
        <div style="padding: 20px; background: ${cardBg}; border-radius: 12px; border: 1px solid ${borderColor}; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: ${tenantColor};">${totalTRTs}</div>
          <div style="color: ${mutedColor}; font-size: 12px; text-transform: uppercase; margin-top: 4px;">${labels.level1}s</div>
        </div>
        <div style="padding: 20px; background: ${cardBg}; border-radius: 12px; border: 1px solid ${borderColor}; text-align: center;">
          <div style="font-size: 32px; font-weight: bold;">${totalTurmas}</div>
          <div style="color: ${mutedColor}; font-size: 12px; text-transform: uppercase; margin-top: 4px;">${labels.level2}s</div>
        </div>
        <div style="padding: 20px; background: ${cardBg}; border-radius: 12px; border: 1px solid ${borderColor}; text-align: center;">
          <div style="font-size: 32px; font-weight: bold;">${totalDesemb}</div>
          <div style="color: ${mutedColor}; font-size: 12px; text-transform: uppercase; margin-top: 4px;">${labels.level3}s</div>
        </div>
        <div style="padding: 20px; background: ${cardBg}; border-radius: 12px; border: 1px solid ${borderColor}; text-align: center;">
          <div style="font-size: 32px; font-weight: bold;">${totalDecisoes}</div>
          <div style="color: ${mutedColor}; font-size: 12px; text-transform: uppercase; margin-top: 4px;">Decisões</div>
        </div>
        <div style="padding: 20px; background: ${cardBg}; border-radius: 12px; border: 1px solid ${borderColor}; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #10b981;">${overallPercent}%</div>
          <div style="color: ${mutedColor}; font-size: 12px; text-transform: uppercase; margin-top: 4px;">Favorável</div>
        </div>
      </div>
  `;
  
  // Render each TRT as a card
  for (const trt of data.trts) {
    const desfavPercent = 100 - trt.percentualFavoravel;
    content += `
      <div style="margin-bottom: 24px; background: ${cardBg}; border-radius: 12px; border: 1px solid ${borderColor}; overflow: hidden;">
        <!-- TRT Header -->
        <div style="padding: 20px; background: ${accentBg}; border-bottom: 1px solid ${borderColor};">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h2 style="font-size: 18px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 10px;">
              <span style="display: inline-block; width: 8px; height: 8px; background: ${tenantColor}; border-radius: 50%;"></span>
              ${trt.nome}
            </h2>
            <div style="display: flex; gap: 24px; font-size: 13px;">
              <span><strong>${trt.totalTurmas}</strong> <span style="color: ${mutedColor};">${labels.level2}s</span></span>
              <span><strong>${trt.totalDesembargadores}</strong> <span style="color: ${mutedColor};">${labels.level3}s</span></span>
              <span><strong>${trt.totalDecisoes}</strong> <span style="color: ${mutedColor};">decisões</span></span>
            </div>
          </div>
          <!-- Progress bar -->
          <div style="margin-top: 12px; height: 8px; background: #ef4444; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${trt.percentualFavoravel}%; background: #10b981;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px;">
            <span style="color: #10b981;">Favorável: ${trt.percentualFavoravel}%</span>
            <span style="color: #ef4444;">Desfavorável: ${desfavPercent}%</span>
          </div>
        </div>
        
        <!-- Turmas within TRT -->
        <div style="padding: 16px;">
    `;
    
    for (const turma of trt.turmas) {
      const turmaDesfav = 100 - turma.percentualFavoravel;
      content += `
          <div style="margin-bottom: 16px; padding: 16px; background: ${accentBg}; border-radius: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <h3 style="font-size: 15px; font-weight: 600; margin: 0;">${turma.nome}</h3>
              <div style="font-size: 12px; color: ${mutedColor};">
                ${turma.totalDesembargadores} ${labels.level3.toLowerCase()}(s) | ${turma.totalDecisoes} decisões
              </div>
            </div>
            <!-- Turma progress bar -->
            <div style="height: 6px; background: #ef4444; border-radius: 3px; overflow: hidden; margin-bottom: 16px;">
              <div style="height: 100%; width: ${turma.percentualFavoravel}%; background: #10b981;"></div>
            </div>
      `;
      
      // Desembargadores table
      if (turma.desembargadores.length > 0) {
        content += `
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: ${isDark ? '#222' : '#e2e8f0'};">
                  <th style="padding: 10px 12px; text-align: left; border-radius: 6px 0 0 0;">${labels.level3}</th>
                  <th style="padding: 10px 12px; text-align: center; width: 100px;">Decisões</th>
                  <th style="padding: 10px 12px; text-align: center; width: 100px;">Favorável</th>
                  <th style="padding: 10px 12px; text-align: center; width: 120px; border-radius: 0 6px 0 0;">Status</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        for (const desemb of turma.desembargadores) {
          const statusColor = desemb.percentualFavoravel >= 60 ? '#10b981' : 
                             desemb.percentualFavoravel >= 40 ? '#f59e0b' : '#ef4444';
          content += `
                <tr style="border-bottom: 1px solid ${borderColor};">
                  <td style="padding: 12px; font-weight: 500;">${desemb.nome}</td>
                  <td style="padding: 12px; text-align: center;">${desemb.totalDecisoes}</td>
                  <td style="padding: 12px; text-align: center; color: ${statusColor}; font-weight: 600;">${desemb.percentualFavoravel}%</td>
                  <td style="padding: 12px; text-align: center;">
                    <div style="height: 6px; background: #ef4444; border-radius: 3px; overflow: hidden;">
                      <div style="height: 100%; width: ${desemb.percentualFavoravel}%; background: #10b981;"></div>
                    </div>
                  </td>
                </tr>
          `;
          
          // Show decisions if any
          if (desemb.decisoes.length > 0) {
            content += `
                <tr>
                  <td colspan="4" style="padding: 0;">
                    <div style="padding: 12px 12px 12px 32px; background: ${isDark ? '#111' : '#f8fafc'};">
                      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                          <tr style="color: ${mutedColor};">
                            <th style="padding: 6px 8px; text-align: left; font-weight: 500;">Data</th>
                            <th style="padding: 6px 8px; text-align: left; font-weight: 500;">Processo</th>
                            <th style="padding: 6px 8px; text-align: left; font-weight: 500;">Resultado</th>
                            <th style="padding: 6px 8px; text-align: left; font-weight: 500;">Responsabilidade</th>
                            <th style="padding: 6px 8px; text-align: left; font-weight: 500;">Empresa</th>
                          </tr>
                        </thead>
                        <tbody>
            `;
            
            for (const dec of desemb.decisoes) {
              const resultColor = dec.resultado.toLowerCase().includes('favor') ? '#10b981' : 
                                 dec.resultado.toLowerCase().includes('desfavor') ? '#ef4444' : mutedColor;
              content += `
                          <tr>
                            <td style="padding: 6px 8px;">${dec.data}</td>
                            <td style="padding: 6px 8px; font-family: monospace; font-size: 11px;">${dec.processo}</td>
                            <td style="padding: 6px 8px; color: ${resultColor}; font-weight: 500;">${dec.resultado}</td>
                            <td style="padding: 6px 8px;">${dec.responsabilidade}</td>
                            <td style="padding: 6px 8px;">${dec.empresa}</td>
                          </tr>
              `;
            }
            
            content += `
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
            `;
          }
        }
        
        content += `
              </tbody>
            </table>
        `;
      }
      
      content += `
          </div>
      `;
    }
    
    content += `
        </div>
      </div>
    `;
  }
  
  content += `</div>`;
  
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${tenant}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${bgColor};
      color: ${textColor};
      line-height: 1.5;
    }
    @media print {
      body { background: white !important; color: black !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
  
  downloadHTML(html, `mapa-decisoes-${new Date().toISOString().split('T')[0]}.html`);
}

// Format currency for dashboard export
function formatCurrencyExport(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercentExport(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Export Dashboard with both sections (Visão Geral + Detalhamento por Origem)
export async function exportDashboardAsHTML(
  data: DashboardExportData,
  options: DOMExportOptions
): Promise<void> {
  const { title, tenant, tenantColor } = options;
  const isDark = document.documentElement.classList.contains('dark');
  const bgColor = isDark ? '#0a0a0a' : '#ffffff';
  const textColor = isDark ? '#fafafa' : '#0a0a0a';
  const cardBg = isDark ? '#1a1a1a' : '#f9fafb';
  const borderColor = isDark ? '#333' : '#e5e7eb';
  const mutedColor = isDark ? '#888' : '#6b7280';
  
  const { summary, fases, riscos, empresas, periodoLabel } = data;
  
  let content = `
    <div style="max-width: 1400px; margin: 0 auto; padding: 32px;">
      <header style="margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid ${tenantColor};">
        <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">
          ${title}
        </h1>
        <p style="color: ${mutedColor};">
          Período: ${periodoLabel} | Exportado em ${new Date().toLocaleDateString('pt-BR')} - ${tenant}
        </p>
      </header>
      
      <!-- KPIs -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px;">
        <div style="padding: 20px; background: ${cardBg}; border-radius: 8px; border: 1px solid ${borderColor};">
          <div style="color: ${mutedColor}; font-size: 12px; text-transform: uppercase;">Total de Processos</div>
          <div style="font-size: 28px; font-weight: bold; margin-top: 8px;">${summary.totalProcessos.toLocaleString('pt-BR')}</div>
        </div>
        <div style="padding: 20px; background: ${cardBg}; border-radius: 8px; border: 1px solid ${borderColor};">
          <div style="color: ${mutedColor}; font-size: 12px; text-transform: uppercase;">Total do Passivo</div>
          <div style="font-size: 28px; font-weight: bold; margin-top: 8px;">${formatCurrencyExport(summary.totalPassivo)}</div>
        </div>
        <div style="padding: 20px; background: ${cardBg}; border-radius: 8px; border: 1px solid ${borderColor};">
          <div style="color: ${mutedColor}; font-size: 12px; text-transform: uppercase;">% Risco Provável</div>
          <div style="font-size: 28px; font-weight: bold; margin-top: 8px; color: #ef4444;">${formatPercentExport(summary.percentualRiscoProvavel)}</div>
        </div>
        <div style="padding: 20px; background: ${cardBg}; border-radius: 8px; border: 1px solid ${borderColor};">
          <div style="color: ${mutedColor}; font-size: 12px; text-transform: uppercase;">% Fase Recursal</div>
          <div style="font-size: 28px; font-weight: bold; margin-top: 8px; color: #10b981;">${formatPercentExport(summary.percentualFaseRecursal)}</div>
        </div>
      </div>
      
      <!-- Section 1: Visão Geral -->
      <section style="margin-bottom: 48px;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 24px; padding-bottom: 8px; border-bottom: 1px solid ${borderColor};">
          Visão Geral
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
          <!-- Tabela Fases -->
          <div>
            <h3 style="font-size: 14px; font-weight: 600; color: ${mutedColor}; margin-bottom: 12px; text-transform: uppercase;">
              Visão por Fase Processual
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: ${isDark ? '#222' : '#e5e7eb'};">
                  <th style="padding: 10px; text-align: left; border: 1px solid ${borderColor};">Fase</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">Processos</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">%</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">Valor Total</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
  `;
  
  for (const fase of fases) {
    content += `
                <tr style="background: ${cardBg};">
                  <td style="padding: 10px; border: 1px solid ${borderColor}; font-weight: 500;">${fase.fase}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${fase.processos.toLocaleString('pt-BR')}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${formatPercentExport(fase.percentualProcessos)}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${formatCurrencyExport(fase.valorTotal)}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${formatCurrencyExport(fase.ticketMedio)}</td>
                </tr>
    `;
  }
  
  content += `
                <tr style="background: ${isDark ? '#333' : '#d1d5db'}; font-weight: bold;">
                  <td style="padding: 10px; border: 1px solid ${borderColor};">TOTAL</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${summary.totalProcessos.toLocaleString('pt-BR')}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">100%</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${formatCurrencyExport(summary.totalPassivo)}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${formatCurrencyExport(summary.ticketMedioGlobal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Tabela Riscos -->
          <div>
            <h3 style="font-size: 14px; font-weight: 600; color: ${mutedColor}; margin-bottom: 12px; text-transform: uppercase;">
              Visão por Classificação de Risco
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: ${isDark ? '#222' : '#e5e7eb'};">
                  <th style="padding: 10px; text-align: left; border: 1px solid ${borderColor};">Risco</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">Processos</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">%</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">Valor Total</th>
                  <th style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
  `;
  
  const riskColors: Record<string, string> = {
    'Remoto': '#10b981',
    'Possível': '#f59e0b',
    'Provável': '#ef4444'
  };
  
  for (const risco of riscos) {
    const rColor = riskColors[risco.risco] || textColor;
    content += `
                <tr style="background: ${cardBg};">
                  <td style="padding: 10px; border: 1px solid ${borderColor}; font-weight: 500; color: ${rColor};">${risco.risco}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${risco.processos.toLocaleString('pt-BR')}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${formatPercentExport(risco.percentualProcessos)}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${formatCurrencyExport(risco.valorTotal)}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${formatCurrencyExport(risco.ticketMedio)}</td>
                </tr>
    `;
  }
  
  content += `
                <tr style="background: ${isDark ? '#333' : '#d1d5db'}; font-weight: bold;">
                  <td style="padding: 10px; border: 1px solid ${borderColor};">TOTAL</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${summary.totalProcessos.toLocaleString('pt-BR')}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">100%</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${formatCurrencyExport(summary.totalPassivo)}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid ${borderColor};">${formatCurrencyExport(summary.ticketMedioGlobal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      <!-- Section 2: Detalhamento por Origem -->
      <section>
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 24px; padding-bottom: 8px; border-bottom: 1px solid ${borderColor};">
          Detalhamento por Origem / Empresa
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: ${isDark ? '#222' : '#e5e7eb'};">
              <th style="padding: 10px; text-align: left; border: 1px solid ${borderColor};" rowspan="2">Empresa</th>
              <th style="padding: 10px; text-align: center; border: 1px solid ${borderColor};" colspan="2">Conhecimento</th>
              <th style="padding: 10px; text-align: center; border: 1px solid ${borderColor};" colspan="2">Recursal</th>
              <th style="padding: 10px; text-align: center; border: 1px solid ${borderColor};" colspan="2">Execução</th>
              <th style="padding: 10px; text-align: center; border: 1px solid ${borderColor};" colspan="3">Total</th>
            </tr>
            <tr style="background: ${isDark ? '#222' : '#e5e7eb'};">
              <th style="padding: 8px; text-align: right; border: 1px solid ${borderColor}; font-size: 11px;">Procs</th>
              <th style="padding: 8px; text-align: right; border: 1px solid ${borderColor}; font-size: 11px;">Valor</th>
              <th style="padding: 8px; text-align: right; border: 1px solid ${borderColor}; font-size: 11px;">Procs</th>
              <th style="padding: 8px; text-align: right; border: 1px solid ${borderColor}; font-size: 11px;">Valor</th>
              <th style="padding: 8px; text-align: right; border: 1px solid ${borderColor}; font-size: 11px;">Procs</th>
              <th style="padding: 8px; text-align: right; border: 1px solid ${borderColor}; font-size: 11px;">Valor</th>
              <th style="padding: 8px; text-align: right; border: 1px solid ${borderColor}; font-size: 11px;">Procs</th>
              <th style="padding: 8px; text-align: right; border: 1px solid ${borderColor}; font-size: 11px;">%</th>
              <th style="padding: 8px; text-align: right; border: 1px solid ${borderColor}; font-size: 11px;">Valor</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  for (const emp of empresas) {
    content += `
            <tr style="background: ${cardBg};">
              <td style="padding: 10px; border: 1px solid ${borderColor}; font-weight: 500;">${emp.empresa}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid ${borderColor};">${emp.conhecimento.processos.toLocaleString('pt-BR')}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid ${borderColor};">${formatCurrencyExport(emp.conhecimento.valor)}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid ${borderColor};">${emp.recursal.processos.toLocaleString('pt-BR')}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid ${borderColor};">${formatCurrencyExport(emp.recursal.valor)}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid ${borderColor};">${emp.execucao.processos.toLocaleString('pt-BR')}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid ${borderColor};">${formatCurrencyExport(emp.execucao.valor)}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid ${borderColor};">${emp.total.processos.toLocaleString('pt-BR')}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid ${borderColor};">${formatPercentExport(emp.total.percentualProcessos)}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid ${borderColor};">${formatCurrencyExport(emp.total.valor)}</td>
            </tr>
    `;
  }
  
  content += `
          </tbody>
        </table>
      </section>
    </div>
  `;
  
  const htmlDoc = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${tenant}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${bgColor};
      color: ${textColor};
      line-height: 1.5;
    }
    @media print {
      body { background: white !important; color: black !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
  
  downloadHTML(htmlDoc, `passivo-sob-gestao-${new Date().toISOString().split('T')[0]}.html`);
}

// Export Mapa de Decisões as fully interactive HTML with navigation menu
export async function exportMapaDecisoesInteractiveHTML(
  data: MapaDecisoesExportData,
  options: DOMExportOptions
): Promise<void> {
  const { title, tenant, tenantColor } = options;
  const isDark = document.documentElement.classList.contains('dark');
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const sidebarBg = isDark ? '#0f172a' : '#1e293b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  
  const labels = data.labels;
  
  // Calculate totals
  const totalTRTs = data.trts.length;
  const totalTurmas = data.trts.reduce((sum, t) => sum + t.totalTurmas, 0);
  const totalDesemb = data.trts.reduce((sum, t) => sum + t.totalDesembargadores, 0);
  const totalDecisoes = data.trts.reduce((sum, t) => sum + t.totalDecisoes, 0);
  const totalFav = data.trts.reduce((sum, t) => sum + t.favoraveis, 0);
  const overallPercent = totalDecisoes > 0 ? Math.round((totalFav / totalDecisoes) * 100) : 0;

  // Generate JSON data for JavaScript
  const jsonData = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${tenant}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${bgColor};
      color: ${textColor};
      line-height: 1.5;
      height: 100vh;
      overflow: hidden;
    }
    .app-container { display: flex; height: 100vh; }
    
    /* Sidebar */
    .sidebar {
      width: 280px;
      background: ${sidebarBg};
      color: #fff;
      overflow-y: auto;
      flex-shrink: 0;
    }
    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .sidebar-header h1 { font-size: 18px; font-weight: 600; }
    .sidebar-header .subtitle { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .sidebar-nav { padding: 12px; }
    .nav-section { margin-bottom: 16px; }
    .nav-section-title {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      padding: 8px 12px;
      font-weight: 600;
    }
    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
      font-size: 14px;
    }
    .nav-item:hover { background: rgba(255,255,255,0.1); }
    .nav-item.active { background: ${tenantColor}; color: #000; }
    .nav-item .count {
      font-size: 11px;
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 10px;
    }
    .nav-item.active .count { background: rgba(0,0,0,0.2); }
    
    /* Main content */
    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    
    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      color: ${mutedColor};
    }
    .breadcrumb-item { cursor: pointer; }
    .breadcrumb-item:hover { color: ${tenantColor}; }
    .breadcrumb-sep { color: ${borderColor}; }
    .breadcrumb-current { color: ${textColor}; font-weight: 500; }
    
    /* Stats bar */
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: ${cardBg};
      border-radius: 12px;
      padding: 16px;
      border: 1px solid ${borderColor};
      text-align: center;
    }
    .stat-value { font-size: 28px; font-weight: bold; }
    .stat-label { font-size: 11px; color: ${mutedColor}; text-transform: uppercase; margin-top: 4px; }
    
    /* Cards grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .trt-card, .turma-card {
      background: ${cardBg};
      border-radius: 12px;
      padding: 20px;
      border: 1px solid ${borderColor};
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .trt-card:hover, .turma-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .card-title { font-weight: 600; font-size: 16px; }
    .card-badge { 
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 500;
    }
    .badge-green { background: #10b981; color: white; }
    .badge-yellow { background: #f59e0b; color: white; }
    .badge-red { background: #ef4444; color: white; }
    
    /* Progress bar */
    .progress-bar { height: 8px; background: #ef4444; border-radius: 4px; overflow: hidden; margin: 12px 0 8px; }
    .progress-fill { height: 100%; background: #10b981; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 11px; }
    .progress-fav { color: #10b981; }
    .progress-desfav { color: #ef4444; }
    
    /* Card stats */
    .card-stats { display: flex; gap: 16px; margin-top: 12px; font-size: 12px; color: ${mutedColor}; }
    
    /* Desembargador table */
    .desemb-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .desemb-table th { 
      padding: 12px 16px;
      text-align: left;
      background: ${isDark ? '#334155' : '#f1f5f9'};
      font-size: 12px;
      text-transform: uppercase;
      color: ${mutedColor};
    }
    .desemb-table td { padding: 14px 16px; border-bottom: 1px solid ${borderColor}; }
    .desemb-table tr { cursor: pointer; transition: background 0.2s; }
    .desemb-table tbody tr:hover { background: ${isDark ? '#334155' : '#f8fafc'}; }
    
    /* Decisoes table */
    .decisoes-container { margin-top: 24px; }
    .decisoes-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .decisoes-table th { 
      padding: 10px 12px;
      text-align: left;
      background: ${isDark ? '#334155' : '#f1f5f9'};
      font-weight: 500;
      color: ${mutedColor};
    }
    .decisoes-table td { padding: 10px 12px; border-bottom: 1px solid ${borderColor}; }
    .result-fav { color: #10b981; font-weight: 500; }
    .result-desfav { color: #ef4444; font-weight: 500; }
    
    /* Back button */
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: ${cardBg};
      border: 1px solid ${borderColor};
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-bottom: 20px;
      transition: background 0.2s;
    }
    .back-btn:hover { background: ${isDark ? '#334155' : '#f1f5f9'}; }
    
    @media print {
      body { background: white !important; color: black !important; }
      .sidebar { display: none; }
      .main-content { padding: 20px; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>${labels.pageTitle}</h1>
        <div class="subtitle">${tenant} - ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
      <nav class="sidebar-nav" id="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">${labels.level1Plural || labels.level1 + 's'}</div>
          <div id="nav-items"></div>
        </div>
      </nav>
    </aside>
    
    <!-- Main content -->
    <main class="main-content" id="main-content">
      <div id="content-area"></div>
    </main>
  </div>
  
  <script>
    const mapData = ${jsonData};
    const labels = mapData.labels;
    const tenantColor = '${tenantColor}';
    
    // State
    let currentView = 'home'; // home, trt, turma, desembargador
    let selectedTRT = null;
    let selectedTurma = null;
    let selectedDesemb = null;
    
    // Initialize
    function init() {
      renderNavItems();
      renderHome();
    }
    
    function renderNavItems() {
      const container = document.getElementById('nav-items');
      container.innerHTML = '<div class="nav-item' + (currentView === 'home' ? ' active' : '') + '" onclick="goHome()"><span>Visão Geral</span></div>';
      
      mapData.trts.forEach(trt => {
        const isActive = selectedTRT === trt.nome;
        container.innerHTML += \`
          <div class="nav-item\${isActive ? ' active' : ''}" onclick="selectTRT('\${trt.nome}')">
            <span>\${trt.nome}</span>
            <span class="count">\${trt.totalDecisoes}</span>
          </div>
        \`;
      });
    }
    
    function goHome() {
      currentView = 'home';
      selectedTRT = null;
      selectedTurma = null;
      selectedDesemb = null;
      renderNavItems();
      renderHome();
    }
    
    function selectTRT(nome) {
      currentView = 'trt';
      selectedTRT = nome;
      selectedTurma = null;
      selectedDesemb = null;
      renderNavItems();
      renderTRT();
    }
    
    function selectTurma(turmaId) {
      currentView = 'turma';
      selectedTurma = turmaId;
      selectedDesemb = null;
      renderTurma();
    }
    
    function selectDesemb(desembId) {
      currentView = 'desembargador';
      selectedDesemb = desembId;
      renderDesemb();
    }
    
    function getBadgeClass(pct) {
      if (pct >= 60) return 'badge-green';
      if (pct >= 40) return 'badge-yellow';
      return 'badge-red';
    }
    
    function renderBreadcrumb() {
      let html = '<div class="breadcrumb">';
      html += '<span class="breadcrumb-item" onclick="goHome()">Início</span>';
      
      if (selectedTRT) {
        html += '<span class="breadcrumb-sep">›</span>';
        if (currentView === 'trt') {
          html += '<span class="breadcrumb-current">' + selectedTRT + '</span>';
        } else {
          html += '<span class="breadcrumb-item" onclick="selectTRT(\\'' + selectedTRT + '\\')">' + selectedTRT + '</span>';
        }
      }
      
      if (selectedTurma) {
        const trt = mapData.trts.find(t => t.nome === selectedTRT);
        const turma = trt?.turmas.find(t => t.id === selectedTurma);
        if (turma) {
          html += '<span class="breadcrumb-sep">›</span>';
          if (currentView === 'turma') {
            html += '<span class="breadcrumb-current">' + turma.nome + '</span>';
          } else {
            html += '<span class="breadcrumb-item" onclick="selectTurma(\\'' + turma.id + '\\')">' + turma.nome + '</span>';
          }
        }
      }
      
      if (selectedDesemb) {
        const trt = mapData.trts.find(t => t.nome === selectedTRT);
        const turma = trt?.turmas.find(t => t.id === selectedTurma);
        const desemb = turma?.desembargadores.find(d => d.id === selectedDesemb);
        if (desemb) {
          html += '<span class="breadcrumb-sep">›</span>';
          html += '<span class="breadcrumb-current">' + desemb.nome + '</span>';
        }
      }
      
      html += '</div>';
      return html;
    }
    
    function renderHome() {
      const totalTRTs = mapData.trts.length;
      const totalTurmas = mapData.trts.reduce((s, t) => s + t.totalTurmas, 0);
      const totalDesemb = mapData.trts.reduce((s, t) => s + t.totalDesembargadores, 0);
      const totalDecisoes = mapData.trts.reduce((s, t) => s + t.totalDecisoes, 0);
      const totalFav = mapData.trts.reduce((s, t) => s + t.favoraveis, 0);
      const pct = totalDecisoes > 0 ? Math.round((totalFav / totalDecisoes) * 100) : 0;
      
      let html = renderBreadcrumb();
      html += \`
        <div class="stats-bar">
          <div class="stat-card"><div class="stat-value" style="color: \${tenantColor}">\${totalTRTs}</div><div class="stat-label">\${labels.level1}s</div></div>
          <div class="stat-card"><div class="stat-value">\${totalTurmas}</div><div class="stat-label">\${labels.level2}s</div></div>
          <div class="stat-card"><div class="stat-value">\${totalDesemb}</div><div class="stat-label">\${labels.level3}s</div></div>
          <div class="stat-card"><div class="stat-value">\${totalDecisoes}</div><div class="stat-label">Decisões</div></div>
          <div class="stat-card"><div class="stat-value" style="color: #10b981">\${pct}%</div><div class="stat-label">Favorável</div></div>
        </div>
        <div class="cards-grid">
      \`;
      
      mapData.trts.forEach(trt => {
        const desfav = 100 - trt.percentualFavoravel;
        html += \`
          <div class="trt-card" onclick="selectTRT('\${trt.nome}')">
            <div class="card-header">
              <span class="card-title">\${trt.nome}</span>
              <span class="card-badge \${getBadgeClass(trt.percentualFavoravel)}">\${trt.percentualFavoravel}%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width: \${trt.percentualFavoravel}%"></div></div>
            <div class="progress-labels">
              <span class="progress-fav">Fav: \${trt.percentualFavoravel}%</span>
              <span class="progress-desfav">Desf: \${desfav}%</span>
            </div>
            <div class="card-stats">
              <span>\${trt.totalTurmas} \${labels.level2.toLowerCase()}s</span>
              <span>\${trt.totalDesembargadores} \${labels.level3.toLowerCase()}s</span>
              <span>\${trt.totalDecisoes} decisões</span>
            </div>
          </div>
        \`;
      });
      
      html += '</div>';
      document.getElementById('content-area').innerHTML = html;
    }
    
    function renderTRT() {
      const trt = mapData.trts.find(t => t.nome === selectedTRT);
      if (!trt) return goHome();
      
      let html = renderBreadcrumb();
      html += '<button class="back-btn" onclick="goHome()">← Voltar</button>';
      html += \`
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">\${trt.nome}</h2>
        <div class="stats-bar" style="grid-template-columns: repeat(4, 1fr);">
          <div class="stat-card"><div class="stat-value">\${trt.totalTurmas}</div><div class="stat-label">\${labels.level2}s</div></div>
          <div class="stat-card"><div class="stat-value">\${trt.totalDesembargadores}</div><div class="stat-label">\${labels.level3}s</div></div>
          <div class="stat-card"><div class="stat-value">\${trt.totalDecisoes}</div><div class="stat-label">Decisões</div></div>
          <div class="stat-card"><div class="stat-value" style="color: #10b981">\${trt.percentualFavoravel}%</div><div class="stat-label">Favorável</div></div>
        </div>
        <div class="cards-grid">
      \`;
      
      trt.turmas.forEach(turma => {
        const desfav = 100 - turma.percentualFavoravel;
        html += \`
          <div class="turma-card" onclick="selectTurma('\${turma.id}')">
            <div class="card-header">
              <span class="card-title">\${turma.nome}</span>
              <span class="card-badge \${getBadgeClass(turma.percentualFavoravel)}">\${turma.percentualFavoravel}%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width: \${turma.percentualFavoravel}%"></div></div>
            <div class="progress-labels">
              <span class="progress-fav">Fav: \${turma.percentualFavoravel}%</span>
              <span class="progress-desfav">Desf: \${desfav}%</span>
            </div>
            <div class="card-stats">
              <span>\${turma.totalDesembargadores} \${labels.level3.toLowerCase()}s</span>
              <span>\${turma.totalDecisoes} decisões</span>
            </div>
          </div>
        \`;
      });
      
      html += '</div>';
      document.getElementById('content-area').innerHTML = html;
    }
    
    function renderTurma() {
      const trt = mapData.trts.find(t => t.nome === selectedTRT);
      const turma = trt?.turmas.find(t => t.id === selectedTurma);
      if (!turma) return selectTRT(selectedTRT);
      
      let html = renderBreadcrumb();
      html += \`<button class="back-btn" onclick="selectTRT('\${selectedTRT}')">← Voltar para \${selectedTRT}</button>\`;
      html += \`
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">\${turma.nome}</h2>
        <div class="stats-bar" style="grid-template-columns: repeat(3, 1fr);">
          <div class="stat-card"><div class="stat-value">\${turma.totalDesembargadores}</div><div class="stat-label">\${labels.level3}s</div></div>
          <div class="stat-card"><div class="stat-value">\${turma.totalDecisoes}</div><div class="stat-label">Decisões</div></div>
          <div class="stat-card"><div class="stat-value" style="color: #10b981">\${turma.percentualFavoravel}%</div><div class="stat-label">Favorável</div></div>
        </div>
        <table class="desemb-table">
          <thead>
            <tr>
              <th>\${labels.level3}</th>
              <th>Decisões</th>
              <th>Favoráveis</th>
              <th>Desfavoráveis</th>
              <th>% Favorável</th>
            </tr>
          </thead>
          <tbody>
      \`;
      
      turma.desembargadores.forEach(d => {
        html += \`
          <tr onclick="selectDesemb('\${d.id}')">
            <td style="font-weight: 500;">\${d.nome}</td>
            <td>\${d.totalDecisoes}</td>
            <td style="color: #10b981">\${d.favoraveis}</td>
            <td style="color: #ef4444">\${d.desfavoraveis}</td>
            <td><span class="card-badge \${getBadgeClass(d.percentualFavoravel)}">\${d.percentualFavoravel}%</span></td>
          </tr>
        \`;
      });
      
      html += '</tbody></table>';
      document.getElementById('content-area').innerHTML = html;
    }
    
    function renderDesemb() {
      const trt = mapData.trts.find(t => t.nome === selectedTRT);
      const turma = trt?.turmas.find(t => t.id === selectedTurma);
      const desemb = turma?.desembargadores.find(d => d.id === selectedDesemb);
      if (!desemb) return selectTurma(selectedTurma);
      
      let html = renderBreadcrumb();
      html += \`<button class="back-btn" onclick="selectTurma('\${selectedTurma}')">← Voltar para \${turma.nome}</button>\`;
      html += \`
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">\${desemb.nome}</h2>
        <div class="stats-bar" style="grid-template-columns: repeat(4, 1fr);">
          <div class="stat-card"><div class="stat-value">\${desemb.totalDecisoes}</div><div class="stat-label">Decisões</div></div>
          <div class="stat-card"><div class="stat-value" style="color: #10b981">\${desemb.favoraveis}</div><div class="stat-label">Favoráveis</div></div>
          <div class="stat-card"><div class="stat-value" style="color: #ef4444">\${desemb.desfavoraveis}</div><div class="stat-label">Desfavoráveis</div></div>
          <div class="stat-card"><div class="stat-value" style="color: #10b981">\${desemb.percentualFavoravel}%</div><div class="stat-label">Favorável</div></div>
        </div>
        <div class="decisoes-container">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Decisões</h3>
          <table class="decisoes-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Processo</th>
                <th>Resultado</th>
                <th>Responsabilidade</th>
                <th>Empresa</th>
              </tr>
            </thead>
            <tbody>
      \`;
      
      desemb.decisoes.forEach(dec => {
        const isFav = dec.resultado.toLowerCase().includes('favor');
        html += \`
          <tr>
            <td>\${dec.data}</td>
            <td style="font-family: monospace; font-size: 12px;">\${dec.processo}</td>
            <td class="\${isFav ? 'result-fav' : 'result-desfav'}">\${dec.resultado}</td>
            <td>\${dec.responsabilidade}</td>
            <td>\${dec.empresa}</td>
          </tr>
        \`;
      });
      
      html += '</tbody></table></div>';
      document.getElementById('content-area').innerHTML = html;
    }
    
    // Start
    init();
  </script>
</body>
</html>`;

  downloadHTML(html, `mapa-decisoes-interativo-${new Date().toISOString().split('T')[0]}.html`);
}
