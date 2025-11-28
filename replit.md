# Contencioso - Ecossistema de Gestão

## Overview
A Power BI-style litigation management dashboard for V.tal, Module 1: "Passivo Sob Gestão" (Liabilities Under Management). The application displays lawsuit data organized by procedural phase, risk classification, and company origin based on December 2024 data.

## Current State
- Module 1 (Passivo Sob Gestão) is fully implemented with:
  - Fixed sidebar navigation with dark teal theme and V.tal branding
  - Dashboard with side-by-side data tables (Phase and Risk views)
  - KPI cards showing key metrics
  - Multiple interactive charts (bar, pie, grouped columns)
  - Company breakdown dashboard (Detalhamento por Origem)
  - Admin data table with export functionality
  - Dark/Light theme toggle

## Architecture

### Frontend (React + Vite)
- **client/src/App.tsx**: Main application with routing and sidebar layout
- **client/src/pages/dashboard.tsx**: Main dashboard with KPIs, tables, and charts
- **client/src/pages/admin-dados.tsx**: Admin page with raw data table and export
- **client/src/components/**: Reusable UI components
  - `app-sidebar.tsx`: Navigation sidebar
  - `kpi-card.tsx`: Metric display cards
  - `data-table-*.tsx`: Data tables for phases, risks, and company breakdown
  - `charts/*.tsx`: Recharts-based visualizations

### Backend (Express)
- **server/routes.ts**: API endpoints
  - `GET /api/passivo`: Returns aggregated dashboard data
  - `GET /api/passivo/raw`: Returns raw process data
- **server/storage.ts**: In-memory storage with data aggregation logic

### Shared
- **shared/schema.ts**: TypeScript types and Zod schemas for all data models

## Data Model
The system uses three main groupings:
1. **Fase Processual** (Procedural Phase): Conhecimento, Recursal, Execução
2. **Classificação de Risco** (Risk Classification): Remoto, Possível, Provável
3. **Empresa** (Company Origin): V.tal, OI, Serede, Sprink, Outros Terceiros

## User Preferences
- Brazilian Portuguese localization
- V.tal brand colors (yellow accent, dark teal headers)
- Power BI/Tableau-style visualizations
- Number formatting: 144,000 → "144 M", 537 → "537 k"

## Recent Changes
- November 2024: Initial implementation of Module 1

## Running the Project
```bash
npm run dev
```
The application runs on port 5000 with both frontend and backend served together.
