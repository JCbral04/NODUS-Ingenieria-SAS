# ADR-003: Reducción de alcance del MVP por plazo

## Estado
Aceptado

## Contexto

El blueprint técnico original (`Nodus_Mvp_Web_Architecture_Blueprint`) estimaba
un MVP v1 en **8–12 semanas**. El plazo real disponible para esta entrega es
de **5 días** (Sprint MVP, 14–18 de septiembre de 2026).

Con esa diferencia de escala, es necesario decidir explícitamente qué parte
del flujo completo del caso (onboarding → cierre) se construye para esta
entrega, y qué parte queda documentada pero fuera de alcance.

## Decisión

**Criterio de corte:** el núcleo mínimo que se entrega en este plazo es:

1. **Workflow engine completo** — máquina de estados con las 16 transiciones
   definidas en el README §9, incluyendo la rama `CERRADO_SIN_CONTRATACION`.
2. **Auditoría** — `AuditLog` inmutable, registrando actor, fecha/hora y
   acción en cada transición y en cada login.
3. **Trazabilidad** — historial de estado por caso (`CaseStateHistory`) y
   matriz RF/RT → endpoints → pantallas (`docs/trazabilidad.md`) mantenida
   al día.
4. **Flujo feliz end-to-end** — onboarding → debida diligencia → clasificación
   → publicación en bolsa → asignación de consultor, con autenticación y
   RBAC funcionando en cada paso.

## Fase 2 (explícitamente fuera de esta entrega)

Los siguientes módulos, ya identificados en la matriz de requerimientos del
cliente, se documentan pero **no se implementan** en esta entrega:

| Módulo | Requerimientos afectados |
|---|---|
| Propuestas (UI, versionamiento, revisión metodológica) | RF-037…RF-048 |
| Formalización y contratación (checklist T7A, marco T7B) | RF-066…RF-072 |
| Ejecución y seguimiento (agenda, hitos, incidencias) | RF-073…RF-080 |
| Cierre del caso (checklist T9C, acta de entrega) | RF-081…RF-087 |
| Peer review avanzado | RF-050, RF-051 |
| Reputación / scoring de consultores | — |

## Justificación de cada exclusión

- **Propuestas (UI):** implica versionamiento documental y revisión
  metodológica — más complejo que el resto del flujo feliz. Se prioriza dejar
  el motor de estados y la auditoría sólidos antes de sumar una pantalla más.
- **Contratación:** depende de que exista una propuesta ya aceptada por el
  cliente, etapa que queda fuera en este corte — es una exclusión en cadena,
  no aislada.
- **Ejecución:** depende de que el caso haya sido contratado; misma lógica de
  dependencia en cadena que el punto anterior.
- **Cierre del caso:** depende de que el caso haya entrado en ejecución;
  también en cadena.
- **Peer review avanzado:** en la matriz del cliente está marcado como
  opcional (RF-050 — "activar peer review opcional"), no bloqueante para el
  flujo feliz.
- **Reputación de consultores:** requiere datos históricos acumulados de
  varios ciclos completos de casos, que no existen en un MVP de 5 días sin
  uso real todavía.

## Consecuencias

- El demo de esta entrega muestra el ciclo de vida de un caso desde el
  registro de la Mipyme hasta la asignación de un consultor responsable,
  con trazabilidad y auditoría completas en cada paso.
- Todo lo listado como Fase 2 ya está identificado y etiquetado en
  `docs/trazabilidad.md`, para retomarlo sin tener que redescubrir el alcance
  después de esta entrega.
- Los criterios de aceptación de los issues de Fase 2 (si ya existen en el
  repo) se mantienen abiertos y se re-priorizan para el siguiente sprint.
