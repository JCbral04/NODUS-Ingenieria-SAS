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

El MVP cubre el flujo del caso desde el onboarding hasta la autorización de
ejecución: onboarding → debida diligencia y clasificación → bolsa interna y
asignación → propuesta versionada con QA → decisión del cliente → contratación
con checklist bloqueante → SLA y trazabilidad completa.

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│  Presentation Layer        Next.js 16 + React + TypeScript      │
│  (Vercel en producción)    Tailwind · login y flujos por rol    │
├─────────────────────────────────────────────────────────────────┤
│  API Layer                 NestJS — monolito modular (REST)     │
│  (Railway/Render)          JWT + RBAC · Swagger /api/docs       │
├─────────────────────────────────────────────────────────────────┤
│  Business Layer            WorkflowService (máquina de estados) │
│                            Motor SLA · validación LOV gobernada │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                PostgreSQL 16 + Prisma ORM           │
│  Audit Layer               AuditLog append-only (inmutable)     │
└─────────────────────────────────────────────────────────────────┘
```

**Decisiones de arquitectura** (sustentadas en `docs/adr/`):

- **Monolito modular** (no microservicios): módulos NestJS desacoplados por
  dominio. RNF-008 cumplido sin el costo operativo de distribuir el MVP.
  Ver [ADR-001](docs/adr/ADR-001-stack-y-arquitectura.md).
- **Workflow-driven**: los 16 estados del caso son un enum gobernado; toda
  transición ocurre **únicamente** a través de `WorkflowService`, que valida,
  persiste y escribe bitácora dual (`CaseStateHistory` + `AuditLog`) en la
  misma transacción.
- **API-first + event-ready**: toda acción relevante pasa por la API REST y
  deja rastro auditable, lo que habilita integraciones futuras (ERP/CRM).
- **Alcance priorizado bajo plazo**: justificación completa en
  [ADR-002](docs/adr/ADR-002-alcance-mvp-priorizado.md) (corte original) y
  [ADR-003](docs/adr/ADR-003-reduccion-alcance-mvp-plazo.md) (recorte real,
  con gestión de dependencias y exclusiones documentadas).

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS, React Hook Form + Zod |
| Backend | NestJS 10, TypeScript, class-validator, Swagger |
| Base de datos | PostgreSQL 16, Prisma ORM |
| Autenticación | JWT (access 1h + refresh 7d verificado), RBAC (5 roles) |
| DevOps | Docker Compose, GitHub Actions (CI: build + tests en cada PR), GitFlow |
| Calidad | ESLint, Jest (backend, tests unitarios del checklist contractual) |

## 4. Estructura del repositorio

```
nodus-ingenieria-sas/
├── backend/               API NestJS + Prisma
│   ├── prisma/            schema.prisma (22+ tablas) + seed idempotente
│   └── src/
│       ├── auth/          JWT, login, refresh, guards + @Roles()
│       ├── users/         consulta de usuarios por email/id
│       ├── cases/         onboarding T1, clasificación T2, lista/detalle,
│       │                  bolsa, postulación, asignación, decisión cliente, SLA
│       ├── workflow/      WorkflowService — mapa de 16 estados
│       ├── proposals/     propuestas TP4C versionadas + QA + envío
│       ├── contracts/     checklist T7A + autorización bloqueante (RF-070)
│       ├── audit/         AuditService (bitácora inmutable)
│       └── (consultants, applications, sla, documents,
│           notifications, execution: módulos Fase 2, esqueleto listo)
├── frontend/              Next.js 16 (app router): login, layout por rol,
│                          onboarding T1, lista/detalle con timeline,
│                          clasificación, bolsa, postulantes, dashboard, SLA
├── docs/                  ADRs, matriz de trazabilidad, QA, evidencias
├── .github/workflows/     CI + CODEOWNERS + plantillas
├── docker-compose.yml     entorno local (PostgreSQL 16 + healthcheck)
└── Makefile               make setup / install / up / migrate / seed
```

## 5. Instalación y ejecución

### Requisitos

- Node.js 20+
- Docker + Docker Compose (para PostgreSQL)
- npm 10+
- **Windows:** `make` no viene instalado por defecto. Instálalo
  (`choco install make`) o usa los comandos manuales de la Opción B.

### Opción A — con Docker (recomendada)

```bash
# 1. Clonar
git clone https://github.com/JCbral04/NODUS-Ingenieria-SAS.git
cd NODUS-Ingenieria-SAS

# 2. Variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Dependencias + base de datos + migraciones + seed demo
make setup
```

&gt; **Nota:** `make setup` instala las dependencias automáticamente
&gt; (target `install`). Si prefieres paso a paso: `make install` primero,
&gt; luego `make up && make migrate && make seed`.

### Opción B — manual

```bash
docker compose up -d --wait          # solo la base de datos (espera healthcheck)
cd backend && npm install
npx prisma migrate dev && npx prisma db seed
npm run start:dev                     # API en http://localhost:3001
cd ../frontend && npm install
npm run dev                           # Web en http://localhost:3000
```

### Verificación rápida

```bash
curl http://localhost:3001/api/docs      # Swagger UI con todos los endpoints
```

&gt; **Si `prisma migrate dev` falla con `P1000` pese a tener el contenedor
&gt; `healthy`:** el puerto 5432 probablemente esté ocupado por otro proceso
&gt; (PostgreSQL local u otro contenedor). Cambia el mapeo en
&gt; `docker-compose.yml` a `"5433:5432"` y ajusta `DATABASE_URL` en
&gt; `backend/.env` al mismo puerto.

## 6. Variables de entorno

Documentadas en `backend/.env.example` y `frontend/.env.example`. Las
obligatorias: `DATABASE_URL` y `JWT_SECRET` (generar con
`openssl rand -hex 32` en producción).

## 7. Roles y usuarios demo

| Rol | Email | Puede |
|---|---|---|
| Advisory | `advisory@nodus.co` | Revisar, clasificar, publicar, asignar, QA de propuestas, monitorear SLA |
| Mipyme | `cliente@acme.co` | Crear casos (también vía onboarding), decidir propuestas |
| Consultor | `consultor1@nodus.co` | Ver bolsa elegible, postularse, proponer (versionado) |
| Admin | `admin@nodus.co` | Parametrizar LOV, SLA y usuarios |

&gt; Password de todos los usuarios demo: `Nodus2026*` (configurable con
&gt; `SEED_PASSWORD` antes de sembrar). Los usuarios creados por el onboarding
&gt; (ej. al registrar una empresa) entran con el password elegido en el formulario.

## 8. Módulos implementados y trazabilidad

Módulos con endpoints reales en `main`, verificados con `curl` en cada PR:

| Módulo | Endpoints / funcionalidad | PR |
|---|---|---|
| Auth + RBAC | `POST /api/auth/login` (bitácora LOGIN con IP) · `refresh` verificado por claim `type` · `GET /profile` · `GET /admin/ping` (demo 403 MIPYME) | [#15](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/15) |
| Cases — Onboarding T1 | `POST /api/cases` (público): empresa + usuario + contacto + caso en **una transacción**; anti-duplicados correo/dominio/nombre/NIT → 409; validación de integridad LOV → 422 | [#34](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/34) |
| Workflow engine | `PATCH /api/cases/:id/status`: mapa de 16 estados, único punto de cambio, bitácora dual en cada transición, transiciones inválidas → 422 | [#34](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/34) |
| Clasificación T2 | `POST /api/cases/:id/classification` (solo Advisory, LOV validado, historial acumulativo) → CLASIFICADO | [#37](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/37) |
| Lista + detalle | `GET /api/cases` filtrada por rol en servidor · `GET /api/cases/:id` con timeline (stateHistory + AuditLog) | [#37](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/37) |
| Bolsa interna | `POST :id/publish` · `GET /api/cases/pool` (elegibilidad por especialidad, sin datos sensibles) · `POST :id/apply` (T3C, doble postulación → 409) | [#38](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/38) |
| Asignación + SLA | `GET :id/applications` · `POST :id/assign` (único responsable, transacción) · `GET :id/sla` (semáforo OK/POR_VENCER/VENCIDO) | [#41](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/41) |
| Propuestas + decisión + contratación | Propuestas TP4C **versionadas** (unique caseId+version) · QA con guarda de envío (RF-055) · `POST :id/decision` (cliente dueño) · checklist T7A materializado con **autorización bloqueante RF-070** (422 con pending[]) | [#55](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/55) |
| Frontend | Layout + login real ([#16](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/16)) · onboarding T1 ([#39](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/39)) · lista/detalle con timeline ([#40](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/40)) · clasificación ([#45](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/45)) · bolsa + postulación ([#47](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/47)) · postulantes + asignar ([#49](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/49)) · badge SLA ([#51](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/51)) · dashboard KPIs ([#53](https://github.com/JCbral04/NODUS-Ingenieria-SAS/pull/53)) | varios |

Cada requerimiento de la matriz del cliente (`RF-001`…`RF-087`,
`RT-001`…`RT-023`) se mapea a endpoint(s)/pantalla(s) en
[`docs/trazabilidad.md`](docs/trazabilidad.md), actualizado con cada PR.

## 9. Workflow del caso (16 estados)

```
CREADO → EN REVISIÓN → CLASIFICADO → EN POSTULACIÓN → ASIGNADO
  → PROPUESTA EN DISEÑO → PROPUESTA LISTA PARA QA → PROPUESTA ENVIADA
  → EN DECISIÓN DEL CLIENTE ↺ (AJUSTES DE PROPUESTA → re-diseño)
  → PROPUESTA ACEPTADA → PENDIENTE DE CONTRATACIÓN → AUTORIZADO PARA EJECUCIÓN
  → (EN EJECUCIÓN → LISTO PARA CIERRE → CERRADO — Fase 2)
Ramas: EN DECISIÓN → CERRADO SIN CONTRATACIÓN
```

Recorrido verificado de punta a punta (CAS-000007): 12 estados con bitácora
dual en cada salto, hasta `AUTORIZADO_PARA_EJECUCION` (ver PR #55).

## 10. Alcance y justificación del MVP

**Implementado en `main`:** autenticación + RBAC (5 roles) · empresa única y
onboarding T1 · workflow completo de 16 estados con bitácora dual · debida
diligencia y clasificación con LOV gobernado · bolsa interna con elegibilidad
por especialidad · postulación T3C · asignación de responsable único ·
propuestas versionadas con QA y guarda de envío · decisión del cliente ·
contratación con checklist bloqueante (RF-070) · semáforo SLA · frontend
navegable por rol para todo el flujo.

**Fase 2 (cortado explícitamente y documentado en
[ADR-003](docs/adr/ADR-003-reduccion-alcance-mvp-plazo.md)):** ejecución y
seguimiento operativo (RF-073–080), cierre del caso con acta (RF-081–087),
gestión documental con archivos (RT-019–023), notificaciones in-app
(RT-010–014), ajustes de propuesta en loop completo, peer review avanzado,
reputación de consultores, videollamadas, WhatsApp, firma electrónica y
analítica BI. Los módulos del dominio ya existen como esqueleto NestJS.

## 11. Calidad y evidencias

- **CI** (`.github/workflows/ci.yml`): build backend + frontend, validación de
  Prisma, tests Jest y CodeQL en cada PR. Rama `main` protegida: PR + 1
  aprobación + code owners + CI verde obligatorio.
- **QA de instalación**: reporte con verificación en frío (Linux sandbox +
  Windows 11 real), 5 hallazgos aplicados — ver `docs/qa/` y PR #56.
- **Revisiones de código**: 3 rounds de revisión con hallazgos de robustez
  resueltos (bypass RF-070, atomicidad con compensación, integridad de FKs).
- **Evidencias**: [`docs/evidencias/`](docs/evidencias/) — capturas del flujo
  end-to-end por rol; las verificaciones reproducibles (curl) de cada módulo
  están documentadas en el cuerpo de cada PR.

## 12. Equipo

| Integrante | Rol en el proyecto |
|---|---|
| Juan Cabral | Líder técnico — backend, arquitectura, workflow, DevOps |
| Laura Ruiz | Frontend y UX/UI (login, onboarding, casos, bolsa, dashboard) |
| Manuel Osorio | Documentación, QA, datos de prueba, evidencias y release |

## 13. Licencia

MIT — Proyecto desarrollado como prueba técnica para Ingenierías SAS.
