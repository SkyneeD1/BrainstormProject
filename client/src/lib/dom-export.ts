export interface DOMExportOptions {
  title: string;
  tenant: string;
  tenantColor: string;
}

export async function exportPageAsHTML(
  element: HTMLElement,
  options: DOMExportOptions
): Promise<void> {
  const { title, tenant } = options;
  
  const clone = element.cloneNode(true) as HTMLElement;
  
  const allStyles = extractAllStyles();
  
  applyInlineStyles(element, clone);
  
  const html = buildFullHTML(clone, allStyles, title, tenant);
  
  downloadHTML(html, `${title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`);
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
