# ADR-001 — Stack tecnológico y arquitectura monolito modular

**Estado:** Aceptado · **Fecha:** 2026-09-13 · **Decisores:** Juan Cabral, Laura Ruiz, Manuel Osorio

## Contexto

La prueba exige una plataforma full-stack ejecutable en ~5 días con 3
desarrolladores, con workflow complejo de 16 estados, RBAC, auditoría,
gestión documental y SLA. El Architecture Blueprint suministrado por el
cliente recomienda: Next.js + NestJS + PostgreSQL/Prisma, monolito modular
para el MVP.

## Decisión

1. **Frontend:** Next.js 15 + TypeScript + Tailwind + shadcn/ui.
2. **Backend:** NestJS (monolito modular, un módulo por dominio).
3. **BD:** PostgreSQL 16 + Prisma (migraciones versionables = scripts de BD).
4. **Auth:** JWT + RBAC con 5 roles.
5. **Documentos:** almacenamiento local en el MVP, con interfaz de
   almacenamiento desacoplada para migrar a S3 sin tocar el dominio.
6. **Despliegue:** Docker Compose local; Vercel + Railway como opcional.

## Alternativas consideradas

- **Next.js full-stack (API Routes):** menos superficie de integración, pero
  sacrifica la calidad y documentación de la API REST que el evaluador
  califica explícitamente. Descartado, con plan de contingencia documentado
  (colapso a API Routes si la integración web↔API se retrasa > 1 día).
- **Microservicios:** inviable en el plazo; violaría la regla "MVP funcional".
- **Django:** productivo para CRUD, pero rompe coherencia con el Blueprint
  del cliente y debilita la sustentación (stack TypeScript end-to-end).

## Consecuencias

+ Mismo lenguaje (TypeScript) en toda la pila: un solo desarrollador puede
  cruzar capas en emergencia.
+ Módulos NestJS desacoplados permiten extraer microservicios en Fase 2+.
+ Prisma da type-safety cruzado backend/BD y migraciones reproducibles.
− Dos aplicaciones desplegables: más configuración de CORS/entorno
  (mitigado con `.env.example` y docker-compose).
