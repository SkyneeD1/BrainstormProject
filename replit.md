# Contencioso - Ecossistema de Gestão

## Overview
A Power BI-style litigation management dashboard for V.tal with role-based access control (Admin/Viewer). The system includes:
- **Module 1**: "Passivo Sob Gestão" - Displays 2,276 lawsuits organized by procedural phase, risk classification, and company origin (December 2024 data)
- **Module 2**: "Mapa de Juízes TRTs/Varas Favorabilidade" - Tracks judicial decisions and favorability metrics across Regional Labor Courts (TRTs), Courts (Varas), and Judges

## Authentication
- PostgreSQL-backed sessions with bcrypt password hashing
- Default admin credentials: username "admin", password "123456"
- Role-based access: Admin (full CRUD) vs Viewer (read-only)

## Current State
- Module 1 (Passivo Sob Gestão) is fully implemented with:
  - Fixed sidebar navigation with dark teal theme and V.tal branding
  - Dashboard with side-by-side data tables (Phase and Risk views)
  - KPI cards showing key metrics
  - Multiple interactive charts (bar, pie, grouped columns)
  - Company breakdown dashboard (Detalhamento por Origem)
  - Admin data table with export functionality
  - Dark/Light theme toggle

- Module 2 (Mapa de Juízes) is fully implemented with:
  - Hierarchical structure: TRT → Vara → Juiz → Julgamento
  - TRTs/Varas management page with CRUD operations
  - Juízes directory with favorability visualization
  - Julgamentos registration with weighted scoring
  - Dashboard with favorability analytics and charts
  - Judge avatar component with colored arc visualization

## Architecture

### Frontend (React + Vite)
- **client/src/App.tsx**: Main application with routing and sidebar layout
- **client/src/pages/dashboard.tsx**: Module 1 dashboard with KPIs, tables, and charts
- **client/src/pages/admin-dados.tsx**: Admin page with raw data table and export
- **client/src/pages/admin-users.tsx**: User management page (Admin only)
- **client/src/pages/trts-varas.tsx**: Module 2 - TRTs and Varas management
- **client/src/pages/juizes.tsx**: Module 2 - Judges directory with julgamentos
- **client/src/pages/favorabilidade.tsx**: Module 2 - Favorability analytics dashboard
- **client/src/components/**: Reusable UI components
  - `app-sidebar.tsx`: Navigation sidebar with module groups
  - `judge-avatar.tsx`: Avatar with favorability arc visualization
  - `kpi-card.tsx`: Metric display cards
  - `data-table-*.tsx`: Data tables for phases, risks, and company breakdown
  - `charts/*.tsx`: Recharts-based visualizations

### Backend (Express)
- **server/routes.ts**: API endpoints
  - Module 1: `GET /api/passivo`, `GET /api/passivo/raw`
  - Module 2: CRUD for `/api/trts`, `/api/varas`, `/api/juizes`, `/api/julgamentos`
  - Favorability: `GET /api/favorabilidade/trts`, `GET /api/favorabilidade/juizes`
  - Auth: `POST /api/login`, `POST /api/logout`, `GET /api/user`
  - Admin: `GET/POST/PATCH/DELETE /api/users`
- **server/storage.ts**: In-memory storage with data aggregation and favorability calculations
- **server/auth.ts**: Passport.js authentication with PostgreSQL sessions

### Database (PostgreSQL)
- **users**: User accounts with roles (admin/viewer)
- **session**: Express sessions with connect-pg-simple
- **trts**: Regional Labor Courts (TRT 1-24)
- **varas**: Labor Courts with TRT relationship
- **juizes**: Judges with Vara relationship and type (titular/substituto)
- **julgamentos**: Judgments with result (favoravel/desfavoravel/parcial)

### Shared
- **shared/schema.ts**: TypeScript types, Drizzle ORM schemas, and Zod validation

## Data Model

### Module 1 - Passivo Sob Gestão
1. **Fase Processual** (Procedural Phase): Conhecimento, Recursal, Execução
2. **Classificação de Risco** (Risk Classification): Remoto, Possível, Provável
3. **Empresa** (Company Origin): V.tal, OI, Serede, Sprink, Outros Terceiros

### Module 2 - Favorability Scoring
- Favorável = 1.0 weight
- Parcial = 0.5 weight
- Desfavorável = 0.0 weight
- Percentage = (favoraveis + parciais × 0.5) / total × 100

## User Preferences
- Brazilian Portuguese localization
- V.tal brand colors (yellow accent, dark teal headers)
- Power BI/Tableau-style visualizations
- Number formatting: 144,000 → "144 M", 537 → "537 k"

## Recent Changes
- November 2024: Initial implementation of Module 1
- November 2024: Added authentication system with PostgreSQL sessions
- November 2024: Implemented Module 2 - TRTs, Varas, Juízes, Julgamentos with favorability analytics

## Running the Project
```bash
npm run dev
```
The application runs on port 5000 with both frontend and backend served together.

## Database Commands
```bash
npm run db:push       # Push schema changes to database
npm run db:push --force  # Force push with data loss warning override
```
