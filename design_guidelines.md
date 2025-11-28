# Design Guidelines: Litigation Management Dashboard - Passivo Sob Gestão

## Design Approach
**Power BI/Tableau-Inspired Dashboard** - Modern business intelligence interface with V.tal brand identity. This is a data-heavy, analytics-focused application requiring clean information hierarchy and professional visualization standards.

## Core Visual Identity

### Typography
- **Primary Font**: Roboto or Inter
- **Hierarchy**:
  - Dashboard titles: text-2xl to text-3xl, font-semibold
  - Section headers: text-xl, font-medium
  - Table headers: text-sm, font-semibold, uppercase tracking
  - Data values: text-lg to text-2xl for emphasis, text-sm for tables
  - Labels/captions: text-xs to text-sm, font-normal

### Color Palette (V.tal Brand)
- **Primary Accent**: Yellow (#FFD100 or similar V.tal yellow) - for highlights, active states, key metrics
- **Background**: Light gray (#F5F5F5 to #FAFAFA)
- **Card/Panel**: White (#FFFFFF) with subtle shadows
- **Headers**: Dark teal/blue (#1E3A5F or similar) for table headers and navigation
- **Text**: Dark gray (#1F2937) for primary, medium gray (#6B7280) for secondary
- **Data Visualization**: Blue-yellow gradient scale, distinct colors for phases and risk levels

## Layout System

### Overall Structure
**Fixed Sidebar + Main Content Area** (dashboard split-screen pattern)

**Sidebar (Left, Fixed)**:
- Width: w-64 to w-72
- Background: Dark teal/navy
- Spacing: p-6 with py-4 for menu items
- Contains:
  - System title: "CONTENCIOSO – ECOSSISTEMA DE GESTÃO" (bold, large)
  - Category: "Brainstorm" (medium weight)
  - Active module: "Passivo Sob Gestão (Base Dez/24)" with yellow accent
  - Placeholder slots for future modules

**Main Content Area (Right)**:
- Full remaining width with max-width constraint (max-w-7xl)
- Padding: p-6 to p-8
- Background: Light gray

### Spacing System
Use Tailwind units: **4, 6, 8, 12** for consistent rhythm
- Component gaps: gap-6
- Section spacing: py-8 to py-12
- Card padding: p-6
- Table cell padding: px-4 py-3

## Component Library

### Dashboard Cards/Panels
- Background: White
- Border radius: rounded-lg
- Shadow: shadow-md with subtle elevation
- Padding: p-6
- Each card contains title bar with yellow accent border-l-4

### Data Tables (Admin View & Dashboards)
**Excel-style Professional Tables**:
- Header row: Dark teal background, white text, uppercase, font-semibold
- Alternating row colors: White and very light gray (#F9FAFB)
- Total rows: Medium gray background (#E5E7EB), font-semibold
- Cell alignment: Numbers right-aligned, text left-aligned
- Borders: Subtle borders between cells (border-gray-200)
- Padding: px-4 py-3 for cells

### KPI Cards
Large metric displays in grid layout (grid-cols-2 lg:grid-cols-4):
- White background cards
- Large number: text-3xl to text-4xl, font-bold
- Label below: text-sm, text-gray-600
- Yellow accent bar or icon
- Minimal spacing, maximum readability

### Charts & Visualizations
**Chart Container**:
- White card background
- Title bar with chart name
- Padding around visualization
- Use Chart.js or Recharts for animated, responsive charts

**Chart Types Required**:
1. **Vertical Bar Chart**: Process counts by phase
2. **Horizontal Bar Chart**: Total values by phase  
3. **Pie Chart**: Risk distribution (Remoto/Possível/Provável)
4. **Grouped Column Chart**: Average ticket by phase
5. **Comparative Bar Chart**: Company breakdown

**Chart Styling**:
- Consistent color scheme across all charts
- Animated on load (subtle, professional)
- Tooltips on hover
- Legend placement: bottom or right
- Grid lines: subtle, minimal

### Number Formatting
**Display Rules** (critical for Brazilian Portuguese):
- Values ≥ 1,000,000: "144 M" format
- Values ≥ 1,000: "537 k" format  
- Currency prefix: "R$" where applicable
- Percentages: "(23.5%)" format in parentheses
- Ticket médio: Full currency format with thousands separator

## Dashboard Layouts

### Dashboard 1: "Passivo Sob Gestão"
**Two-Column Table Layout** (side-by-side comparison):
- Left table: Phase breakdown (Conhecimento, Recursal, Execução)
- Right table: Risk classification (Remoto, Possível, Provável)
- Both tables show: Nº processos, %, Valor total, %, Ticket médio
- Total row at bottom of each table
- Grid: grid-cols-1 lg:grid-cols-2, gap-6

**KPI Row** above or below tables:
- 4 metric cards: Total processos, Total passivo, % risco provável, % fase recursal

**Chart Section** below tables:
- Grid of 4 charts (grid-cols-1 md:grid-cols-2)

### Dashboard 2: "Detalhamento por Origem"
**Single Wide Table**:
- Rows: V.tal, OI, Serede, Sprink, Outros Terceiros, TOTAL
- Column groups: Conhecimento, Recursal, Execução, Total Geral
- Each group shows: Nº and %
- Full-width table with horizontal scroll on mobile

**Visualization Row**:
- Pie chart (company distribution)
- Horizontal bar chart (company comparison)
- Grid: grid-cols-1 lg:grid-cols-2

## Navigation & Interactions

### Sidebar Navigation
- Hover state: Subtle lightening of background
- Active module: Yellow left border (border-l-4), slightly lighter background
- Smooth transitions (transition-colors duration-200)

### Data Interactions
- Table rows: Hover effect with light background change
- Charts: Tooltips on hover with formatted data
- No complex animations - focus on data clarity
- Loading states: Subtle skeleton loaders or spinners

## Accessibility
- High contrast for data readability
- Clear focus states for keyboard navigation
- ARIA labels for charts and data tables
- Responsive tables with horizontal scroll on mobile
- Touch-friendly hit areas (min 44px) for mobile

## Images
**No hero images or marketing imagery** - This is a pure data dashboard. The only visual elements are:
- Company logos (small) in sidebar or table headers if needed
- Chart visualizations
- Icon indicators for risk levels (optional: small icon next to Remoto/Possível/Provável)

## Responsive Behavior
- **Desktop (lg+)**: Full sidebar + multi-column layouts
- **Tablet (md)**: Collapsible sidebar, 2-column grids become 1-column  
- **Mobile**: Hamburger menu for sidebar, all tables stack vertically, horizontal scroll for wide tables

**Critical**: Maintain data integrity and readability at all breakpoints - never hide essential information.