# Contencioso - Ecossistema de Gestão

## Overview
A Power BI-style litigation management dashboard with multi-tenant support for V.tal and NIO, featuring role-based access control (Admin/Viewer) and module-level permissions. The system includes:
- **Module 1**: "Passivo Sob Gestão" - Displays lawsuits organized by procedural phase, risk classification, and company origin with period comparison
- **Module 2**: "Entrada & Saídas" - Case tracking with "Entradas" (new cases) and "Encerrados" (closed cases) sub-modules
- **Module 3**: "Mapas Estratégicos" - Mapa de Decisões with Turmas → Desembargadores structure for tracking judicial vote status

## Multi-Tenant Architecture
- **Two Tenants**: V.tal (yellow #ffd700) and NIO (green #01DA01)
- **Complete Data Isolation**: All data tables have tenantId columns, all queries filter by tenant
- **Row-Level Security**: Storage layer enforces tenant scoping on every CRUD operation
- **Session-Based Tenant Context**: User's tenantId stored in session, extracted by routes
- **Multi-Tenant User Access**: Users can access multiple tenants via user_tenants many-to-many relationship

## Authentication & Authorization
- PostgreSQL-backed sessions with bcrypt password hashing
- Default admin credentials: username "admin", password "123456" (both V.tal and NIO access)
- Role-based access: Admin (full CRUD) vs Viewer (read-only)
- Module-level permissions: Admins can configure which modules each viewer can access
- Server-side middleware enforces both role and module permissions
- **Two-step login flow**: authenticate → select tenant (auto-login if user has only one tenant)
- **Tenant switching**: Logged-in users with multiple tenants can switch via sidebar dropdown

## Current State
- Module 1 (Passivo Sob Gestão) is fully implemented with:
  - Fixed sidebar navigation with dark teal theme and V.tal branding
  - Dashboard with side-by-side data tables (Phase and Risk views)
  - KPI cards showing key metrics
  - Multiple interactive charts (bar, pie, grouped columns)
  - Company breakdown dashboard (Detalhamento por Origem)
  - Admin data table with export functionality
  - Dark/Light theme toggle

- Module 2 (Mapas Estratégicos - Mapa de Decisões) is fully implemented with:
  - Simplified structure: Turmas → Desembargadores (no TRT/Vara dependencies)
  - Turmas management with optional "regiao" field
  - Desembargadores with vote status tracking (FAVORÁVEL, DESFAVORÁVEL, EM ANÁLISE, SUSPEITO)
  - Tabbed interface: Turmas view (cards with statistics) and Desembargadores view (table listing)
  - Admin CRUD operations for both Turmas and Desembargadores
  - Progress bars showing vote distribution percentages

- Module 3 (Brainstorm) includes:
  - Relatório page for report generation
  - Gestão page for batch data management

## Architecture

### Frontend (React + Vite)
- **client/src/App.tsx**: Main application with routing and sidebar layout
- **client/src/pages/dashboard.tsx**: Module 1 dashboard with KPIs, tables, and charts
- **client/src/pages/admin-dados.tsx**: Admin page with raw data table and export
- **client/src/pages/admin-users.tsx**: User management page (Admin only)
- **client/src/pages/mapa-decisoes.tsx**: Module 2 - Turmas and Desembargadores management
- **client/src/pages/brainstorm-relatorio.tsx**: Module 3 - Report generation
- **client/src/pages/brainstorm-gestao.tsx**: Module 3 - Data management
- **client/src/components/**: Reusable UI components
  - `app-sidebar.tsx`: Navigation sidebar with module groups
  - `kpi-card.tsx`: Metric display cards
  - `data-table-*.tsx`: Data tables for phases, risks, and company breakdown
  - `charts/*.tsx`: Recharts-based visualizations

### Backend (Express)
- **server/routes.ts**: API endpoints
  - Module 1: `GET /api/passivo`, `GET /api/passivo/raw`
  - Module 2: `GET /api/mapa-decisoes`, CRUD for `/api/turmas`, `/api/desembargadores`
  - Auth: `POST /api/login`, `POST /api/logout`, `GET /api/user`
  - Admin: `GET/POST/PATCH/DELETE /api/users`
- **server/storage.ts**: In-memory storage with data aggregation and vote statistics calculations
- **server/auth.ts**: Passport.js authentication with PostgreSQL sessions

### Database (PostgreSQL)
- **users**: User accounts with roles (admin/viewer)
- **session**: Express sessions with connect-pg-simple
- **turmas**: Chamber units with optional regiao field
- **desembargadores**: Judges with turma_id relationship and vote status
- **carteira_rpac**: Case portfolio data (Brainstorm module)

### Shared
- **shared/schema.ts**: TypeScript types, Drizzle ORM schemas, and Zod validation

## Data Model

### Module 1 - Passivo Sob Gestão
1. **Fase Processual** (Procedural Phase): Conhecimento, Recursal, Execução
2. **Classificação de Risco** (Risk Classification): Remoto, Possível, Provável
3. **Empresa** (Company Origin): V.tal, OI, Serede, Sprink, Outros Terceiros

### Module 2 - Vote Status System
- FAVORÁVEL - Favorable vote
- DESFAVORÁVEL - Unfavorable vote
- EM ANÁLISE - Under analysis
- SUSPEITO - Suspect (questionable status)
- Statistics calculated per Turma: percentages for each status

## User Preferences
- Brazilian Portuguese localization
- V.tal brand colors (yellow accent, dark teal headers)
- Power BI/Tableau-style visualizations
- Number formatting: 144,000 → "144 M", 537 → "537 k"

## Recent Changes
- November 2024: Initial implementation of Module 1
- November 2024: Added authentication system with PostgreSQL sessions
- December 2024: Restructured Module 2 - Removed TRT/Vara/Juízes, now uses Turmas → Desembargadores with vote status
- December 2024: Implemented Brainstorm module with relatorio and gestao pages
- January 2026: Implemented complete multi-tenant data isolation architecture
  - Added tenantId columns to all 16 data tables
  - Updated storage layer with tenant-scoped CRUD operations
  - All API routes now extract tenantId from session and pass to storage
  - In-memory Passivo data stored per tenant using Map structure
- January 2026: Implemented multi-tenant user access
  - Added user_tenants many-to-many relationship table
  - Two-step login flow: authenticate → select tenant
  - Tenant switching for logged-in users via sidebar dropdown
  - New users automatically added to all tenants
  - React Query cache handling uses setQueryData for seamless tenant switching
- January 2026: Smart Excel import for Mapas de Decisões
  - Auto-creates Turmas and Desembargadores if they don't exist during import
  - New endpoint POST /api/decisoes/smart-import
  - Updated column structure: Data, Nº Processo, Local, Turma, Relator, Resultado, Responsabilidade, UPI, Empresa
  - Brazilian date format DD/MM/YYYY throughout

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
