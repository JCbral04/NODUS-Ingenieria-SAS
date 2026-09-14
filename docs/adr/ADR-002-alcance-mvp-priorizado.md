# ADR-002 — Alcance del MVP priorizado

**Estado:** Aceptado · **Fecha:** 2026-09-13 · **Decisores:** Juan Cabral, Laura Ruiz, Manuel Osorio

## Contexto

La documentación del cliente describe un roadmap de 8–12 semanas, pero la
prueba tiene un plazo de 5 días. El criterio de evaluación fundamental es
que el repositorio sea **clonable, instalable y ejecutable** con un MVP
funcional. La matriz del cliente clasifica 18 requerimientos como "Incluido
MVP" y 2 como "Fase 2" (peer review avanzado y reputación de consultores).

## Decisión

**P0 — Imprescindible (define el éxito):** auth + RBAC · empresa única y
onboarding T1 · los 16 estados con guardas y bitácora automática · debida
diligencia con LOV · bolsa, postulación T3C y asignación de único
responsable · propuesta TP4C versionada con QA TP4H · decisión del cliente
TP6 · contratación con checklist bloqueante T7 · ejecución y cierre · SLA
parametrizables · notificaciones in-app · gestión documental por etapa ·
dashboard básico · seed demo + README profesional.

**P1 — Solo si P0 está completo:** incidencias T8D, evaluaciones T9G/T9H,
recordatorios programados (cron), email real (Resend).

**P2 — Cortado explícitamente (Fase 2):** peer review, reputación/estrellas,
videollamadas, WhatsApp, firma electrónica, analítica BI. Esta decisión
**está alineada con la matriz del cliente**, no es una omisión arbitraria.

## Justificación

1. El flujo end-to-end completo demuestra todos los criterios de evaluación
   (workflows, roles, trazabilidad, auditoría, SLA) con menos riesgo que
   muchas features aisladas.
2. Instalación impecable > features extra: un repo que no corre anula toda
   la evaluación ("No será suficiente entregar únicamente diseños…").
3. Cortar peer review y reputación reproduce la propia segmentación de la
   matriz del cliente, lo cual es defendible en la sustentación.

## Consecuencias

+ 100% de esfuerzo en el núcleo evaluable.
+ Menor riesgo de integración fallida.
− El dashboard es básico (KPIs operativos simples, no BI).
− Comunicaciones solo in-app (email mock) — suficiente para RT-010–014.
