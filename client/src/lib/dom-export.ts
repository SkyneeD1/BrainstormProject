export interface DOMExportOptions {
  title: string;
  tenant: string;
  tenantColor: string;
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

// Export Mapa de Decisões with full hierarchy
export async function exportMapaDecisoesAsHTML(
  data: MapaDecisoesExportData,
  options: DOMExportOptions
): Promise<void> {
  const { title, tenant, tenantColor } = options;
  const isDark = document.documentElement.classList.contains('dark');
  const bgColor = isDark ? '#0a0a0a' : '#ffffff';
  const textColor = isDark ? '#fafafa' : '#0a0a0a';
  const cardBg = isDark ? '#1a1a1a' : '#f9fafb';
  const borderColor = isDark ? '#333' : '#e5e7eb';
  const mutedColor = isDark ? '#888' : '#6b7280';
  
  const labels = data.labels;
  
  let content = `
    <div style="max-width: 1400px; margin: 0 auto; padding: 32px;">
      <header style="margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid ${tenantColor};">
        <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">
          ${title} - ${labels.pageTitle}
        </h1>
        <p style="color: ${mutedColor};">
          Exportado em ${new Date().toLocaleDateString('pt-BR')} - ${tenant}
        </p>
      </header>
      
      <div style="margin-bottom: 24px; padding: 16px; background: ${cardBg}; border-radius: 8px; border: 1px solid ${borderColor};">
        <strong>Resumo:</strong> ${data.trts.length} ${labels.level1}(s)
      </div>
  `;
  
  // Render each TRT
  for (const trt of data.trts) {
    content += `
      <div style="margin-bottom: 32px; padding: 24px; background: ${cardBg}; border-radius: 8px; border: 1px solid ${borderColor};">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid ${borderColor};">
          ${labels.level1}: ${trt.nome}
        </h2>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">${trt.totalTurmas}</div>
            <div style="color: ${mutedColor}; font-size: 12px;">${labels.level2}s</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">${trt.totalDesembargadores}</div>
            <div style="color: ${mutedColor}; font-size: 12px;">${labels.level3}s</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">${trt.totalDecisoes}</div>
            <div style="color: ${mutedColor}; font-size: 12px;">Decisoes</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${trt.percentualFavoravel}%</div>
            <div style="color: ${mutedColor}; font-size: 12px;">Favoravel</div>
          </div>
        </div>
    `;
    
    // Render turmas within TRT
    for (const turma of trt.turmas) {
      content += `
        <div style="margin: 16px 0 16px 16px; padding: 16px; background: ${isDark ? '#222' : '#fff'}; border-radius: 6px; border: 1px solid ${borderColor};">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">
            ${labels.level2}: ${turma.nome}
            <span style="font-weight: normal; color: ${mutedColor}; margin-left: 12px;">
              (${turma.totalDecisoes} decisoes, ${turma.percentualFavoravel}% fav)
            </span>
          </h3>
      `;
      
      // Render desembargadores within turma
      for (const desemb of turma.desembargadores) {
        content += `
          <div style="margin: 12px 0 12px 16px; padding: 12px; background: ${cardBg}; border-radius: 4px; border: 1px solid ${borderColor};">
            <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">
              ${labels.level3}: ${desemb.nome}
              <span style="font-weight: normal; color: #10b981; margin-left: 8px;">${desemb.percentualFavoravel}% fav</span>
            </h4>
        `;
        
        if (desemb.decisoes.length > 0) {
          content += `
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px;">
              <thead>
                <tr style="background: ${isDark ? '#333' : '#e5e7eb'};">
                  <th style="padding: 6px 8px; text-align: left; border: 1px solid ${borderColor};">Data</th>
                  <th style="padding: 6px 8px; text-align: left; border: 1px solid ${borderColor};">Processo</th>
                  <th style="padding: 6px 8px; text-align: left; border: 1px solid ${borderColor};">Resultado</th>
                  <th style="padding: 6px 8px; text-align: left; border: 1px solid ${borderColor};">Responsabilidade</th>
                  <th style="padding: 6px 8px; text-align: left; border: 1px solid ${borderColor};">Empresa</th>
                </tr>
              </thead>
              <tbody>
          `;
          
          for (const dec of desemb.decisoes) {
            const resultColor = dec.resultado.toLowerCase().includes('favor') ? '#10b981' : 
                               dec.resultado.toLowerCase().includes('desfavor') ? '#ef4444' : mutedColor;
            content += `
              <tr>
                <td style="padding: 6px 8px; border: 1px solid ${borderColor};">${dec.data}</td>
                <td style="padding: 6px 8px; border: 1px solid ${borderColor};">${dec.processo}</td>
                <td style="padding: 6px 8px; border: 1px solid ${borderColor}; color: ${resultColor};">${dec.resultado}</td>
                <td style="padding: 6px 8px; border: 1px solid ${borderColor};">${dec.responsabilidade}</td>
                <td style="padding: 6px 8px; border: 1px solid ${borderColor};">${dec.empresa}</td>
              </tr>
            `;
          }
          
          content += `
              </tbody>
            </table>
          `;
        } else {
          content += `<p style="color: ${mutedColor}; font-size: 12px;">Nenhuma decisao registrada</p>`;
        }
        
        content += `</div>`;
      }
      
      content += `</div>`;
    }
    
    content += `</div>`;
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
  
  downloadHTML(html, `${title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`);
}
