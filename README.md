<div align="center">

# NODUS Ingeniería SAS

**Plataforma empresarial de orquestación de casos entre Mipymes y consultores**

Prueba técnica — Ingenierías SAS (Colombia) · Septiembre 2026

</div>

---

## 1. Descripción del proyecto

NODUS es una plataforma web multiusuario que conecta **Mipymes con necesidades
empresariales** y **consultores especializados** bajo un modelo **orquestado,
trazable y gobernado metodológicamente**: la plataforma (Advisory NODUS) controla
el flujo, la documentación, los tiempos (SLA) y la bitácora de auditoría, sin
asumir la responsabilidad contractual ni técnica del servicio.

El MVP cubre el **ciclo completo del caso**: onboarding → debida diligencia →
bolsa interna y asignación → propuesta → QA → decisión del cliente →
contratación → ejecución → cierre.

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│  Presentation Layer        Next.js 15 + React + TypeScript      │
│  (Vercel en producción)    Tailwind + shadcn/ui                 │
├─────────────────────────────────────────────────────────────────┤
│  API Layer                 NestJS — monolito modular (REST)     │
│  (Railway/Render)          JWT + RBAC · Swagger /api/docs       │
├─────────────────────────────────────────────────────────────────┤
│  Business Layer            WorkflowService (máquina de estados) │
│                            Motor SLA · Notificaciones · LOV     │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                PostgreSQL 16 + Prisma ORM           │
│  Audit Layer               AuditLog append-only (inmutable)     │
│  Storage Layer             Documentos por etapa y versión       │
└─────────────────────────────────────────────────────────────────┘
```

**Decisiones de arquitectura** (sustentadas en `docs/adr/`):

- **Monolito modular** (no microservicios): el dominio es un único bounded
  context con módulos NestJS desacoplados. RNF-008 cumplido sin el costo
  operativo de distribuir el MVP. Ver [ADR-001](docs/adr/ADR-001-stack-y-arquitectura.md).
- **API-first + event-ready**: toda acción relevante pasa por la API REST y
  deja rastro en bitácora, lo que habilita integraciones futuras (ERP/CRM).
- **Workflow-driven**: los 16 estados del caso son un enum gobernado; toda
  transición ocurre únicamente a través de `WorkflowService`, que valida,
  persiste, escribe bitácora y dispara notificación.

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui, React Hook Form + Zod |
| Backend | NestJS 10, TypeScript, class-validator, Swagger |
| Base de datos | PostgreSQL 16, Prisma ORM |
| Autenticación | JWT (access + refresh), RBAC (5 roles) |
| Documentos | Almacenamiento local en MVP (interfaz preparada para S3) |
| Notificaciones | In-app + plantillas TCOM (email real en Fase 2) |
| DevOps | Docker Compose, GitHub Actions (CI), GitFlow simplificado |
| Calidad | ESLint, Prettier, Jest (backend), Vitest (frontend) |

## 4. Estructura del repositorio

```
nodus-ingenieria-sas/
├── backend/            API NestJS + Prisma (módulos por dominio)
│   ├── prisma/         schema.prisma + seed idempotente
│   ├── src/
│   │   ├── auth/       JWT, login, refresh
│   │   ├── users/      gestión de usuarios y roles
│   │   ├── companies/  empresa única + contactos
│   │   ├── cases/      casos, clasificación, bitácora del caso
│   │   ├── workflow/   WorkflowService — máquina de estados
│   │   ├── consultants/ perfiles y ecosistema de consultores
│   │   ├── applications/ postulaciones (bolsa interna)
│   │   ├── proposals/  propuestas versionadas + QA
│   │   ├── contracts/  checklist T7A + marco operativo T7B
│   │   ├── execution/  actividades, hitos, entregables, incidencias
│   │   ├── documents/  repositorio documental por etapa
│   │   ├── sla/        reglas SLA, cálculo de vencimientos
│   │   ├── audit/      AuditLog inmutable + interceptor
│   │   └── notifications/ plantillas TCOM + bandeja in-app
├── frontend/           Next.js 15 (app router)
├── docs/               ADRs, matriz de trazabilidad, evidencias
├── .github/workflows/  CI (build + tests en cada PR)
├── docker-compose.yml  entorno local (PostgreSQL)
└── Makefile            atajos: make setup / up / migrate / seed
```

## 5. Instalación y ejecución

### Requisitos

- Node.js 20+
- Docker + Docker Compose (para PostgreSQL)
- npm 10+

### Opción A — con Docker (recomendada)

```bash
# 1. Clonar
git clone https://github.com/JCbral04/NODUS-Ingenieria-SAS.git
cd NODUS-Ingenieria-SAS

# 2. Variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Base de datos + migraciones + datos demo
make setup
```

### Opción B — manual

```bash
docker compose up -d db                 # solo la base de datos
cd backend && npm install
npx prisma migrate dev && npx prisma db seed
npm run start:dev                        # API en http://localhost:3001
cd ../frontend && npm install
npm run dev                              # Web en http://localhost:3000
```

### Verificación rápida

```bash
curl http://localhost:3001/api/docs      # Swagger UI
```

## 6. Variables de entorno

Documentadas en `backend/.env.example` y `frontend/.env.example`. Las
obligatorias: `DATABASE_URL` y `JWT_SECRET`.

## 7. Roles y usuarios demo

| Rol | Email | Puede |
|---|---|---|
| Advisory | `advisory@nodus.co` | Revisar, clasificar, publicar, asignar, QA, monitorear |
| Mipyme | `cliente@acme.co` | Crear casos, responder, decidir propuestas, aceptar cierre |
| Consultor | `consultor1@nodus.co` | Ver bolsa, postularse, diseñar propuesta, ejecutar |
| Admin | `admin@nodus.co` | Parametrizar LOV, SLA y usuarios |

> Password de todos los usuarios demo: `Nodus2026*` (configurable con
> `SEED_PASSWORD` antes de sembrar).

## 8. Módulos implementados y trazabilidad

Cada requerimiento de la matriz funcional (`RF-001` … `RF-087`, `RT-001` …
`RT-023`) se mapea a endpoint(s) y pantalla(s) en
[`docs/trazabilidad.md`](docs/trazabilidad.md).

## 9. Workflow del caso (16 estados)

```
CREADO → EN REVISIÓN → CLASIFICADO → EN POSTULACIÓN → ASIGNADO
  → PROPUESTA EN DISEÑO → PROPUESTA LISTA PARA QA → PROPUESTA ENVIADA
  → EN DECISIÓN DEL CLIENTE ↺ (AJUSTES DE PROPUESTA)
  → PROPUESTA ACEPTADA → PENDIENTE DE CONTRATACIÓN → AUTORIZADO PARA EJECUCIÓN
  → EN EJECUCIÓN → LISTO PARA CIERRE → CERRADO
Ramas: EN DECISIÓN → CERRADO SIN CONTRATACIÓN · EN REVISIÓN → rechazo documentado
```

## 10. Alcance y justificación del MVP

**Incluido (P0):** autenticación y RBAC · empresa única y onboarding T1 ·
workflow completo con bitácora automática · debida diligencia con LOV ·
bolsa con elegibilidad, postulación T3C y asignación de único responsable ·
propuesta TP4C versionada con QA TP4H · decisión del cliente TP6 ·
contratación con checklist bloqueante T7 · ejecución (agenda, hitos,
entregables) y cierre con acta · SLA parametrizables y notificaciones in-app ·
dashboard básico.

**Fase 2 (cortado explícitamente, alineado con la matriz del cliente):**
peer review avanzado, reputación/estrellas de consultores, videollamadas
integradas, WhatsApp, firma electrónica, analítica BI.

Justificación completa: [ADR-002](docs/adr/ADR-002-alcance-mvp-priorizado.md).

## 11. Evidencias de funcionamiento

Ver [`docs/evidencias/`](docs/evidencias/): capturas del flujo end-to-end y
video demo (se adjuntan en la entrega final).

## 12. Equipo

| Integrante | Rol en el proyecto |
|---|---|
| Juan Cabral | Líder técnico — backend, arquitectura, workflow |
| Laura Ruiz | Frontend y UX/UI |
| Manuel Osorio | Documentación, datos de prueba, QA y despliegue |

## 13. Licencia

MIT — Proyecto desarrollado como prueba técnica para Ingenierías SAS.
