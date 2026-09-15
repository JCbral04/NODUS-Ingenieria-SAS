# Matriz de Trazabilidad RF/RT → Endpoints → Pantallas

Esta tabla documenta la cobertura de los requerimientos funcionales (RF) y transversales (RT) de la matriz del cliente (RF-001…RF-087, RT-001…RT-023) frente a los endpoints, pantallas y PRs que los implementan. Se actualiza con cada PR mergeado — es la evidencia de "interpretación de requerimientos" para la evaluación.

> **Nota:** las columnas *Endpoint(s)* y *Pantalla(s)* de esta versión inicial son una propuesta de mapeo por módulo, tomada de la arquitectura MVP definida en el blueprint técnico. Deben ajustarse (endpoint exacto, pantalla exacta, PR) a medida que cada requerimiento se implemente realmente.

## Estado

Pendiente | En curso | Hecho

## Requerimientos Funcionales (RF)

| ID | Descripción | Endpoint(s) | Pantalla(s) | PR | Estado |
|---|---|---|---|---|---|
| | **Módulo 1 · Gestión de Empresas y Onboarding** | | | | |
| RF-001 | El sistema debe permitir registrar una Mipyme mediante onboarding simplificado | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-002 | El sistema debe validar identidad empresarial evitando duplicados | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-003 | El sistema debe validar coincidencias por correo, dominio, nombre e ID empresarial | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-004 | El sistema debe permitir crear múltiples casos asociados a una misma empresa | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-005 | El sistema debe permitir capturar datos básicos de la empresa | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-006 | El sistema debe permitir aceptación de términos y política de datos | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-007 | El sistema debe permitir registrar la necesidad empresarial mediante Plantilla T1 | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-008 | El sistema debe permitir adjuntar archivos al caso | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-009 | El sistema debe generar automáticamente ID único de caso | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-010 | El sistema debe generar automáticamente el usuario principal de contacto | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-011 | El sistema debe crear automáticamente estructura documental del caso | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-012 | El sistema debe asignar estado inicial CREADO | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-013 | El sistema debe permitir edición del caso solo en estado CREADO | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| RF-014 | El sistema debe almacenar trazabilidad de creación del caso | POST /companies · POST /cases | Onboarding / Alta de empresa y caso | — | Pendiente |
| | **Módulo 2 · Debida Diligencia y Clasificación** | | | | |
| RF-015 | El sistema debe permitir activar revisión del caso | PATCH /cases/:id/status · POST /cases/:id/classification | Revisión y clasificación de caso | — | Pendiente |
| RF-016 | El sistema debe cambiar estado de CREADO a EN REVISIÓN | PATCH /cases/:id/status · POST /cases/:id/classification | Revisión y clasificación de caso | — | Pendiente |
| RF-017 | El sistema debe permitir registrar observaciones de revisión | PATCH /cases/:id/status · POST /cases/:id/classification | Revisión y clasificación de caso | — | Pendiente |
| RF-018 | El sistema debe permitir solicitar ampliación de información | PATCH /cases/:id/status · POST /cases/:id/classification | Revisión y clasificación de caso | — | Pendiente |
| RF-019 | El sistema debe permitir clasificar casos mediante taxonomías parametrizadas | PATCH /cases/:id/status · POST /cases/:id/classification | Revisión y clasificación de caso | — | Pendiente |
| RF-020 | El sistema debe manejar clasificación por área, complejidad, impacto y tipo de intervención | PATCH /cases/:id/status · POST /cases/:id/classification | Revisión y clasificación de caso | — | Pendiente |
| RF-021 | El sistema debe impedir clasificaciones críticas mediante texto libre | PATCH /cases/:id/status · POST /cases/:id/classification | Revisión y clasificación de caso | — | Pendiente |
| RF-022 | El sistema debe permitir validar elegibilidad del caso | PATCH /cases/:id/status · POST /cases/:id/classification | Revisión y clasificación de caso | — | Pendiente |
| RF-023 | El sistema debe registrar evaluación mediante Plantilla T2 | PATCH /cases/:id/status · POST /cases/:id/classification | Revisión y clasificación de caso | — | Pendiente |
| RF-024 | El sistema debe cambiar estado a CLASIFICADO cuando el caso quede habilitado | PATCH /cases/:id/status · POST /cases/:id/classification | Revisión y clasificación de caso | — | Pendiente |
| RF-025 | El sistema debe almacenar historial de reclasificaciones | PATCH /cases/:id/status · POST /cases/:id/classification | Revisión y clasificación de caso | — | Pendiente |
| | **Módulo 3 · Bolsa Interna y Asignación de Consultores** | | | | |
| RF-026 | El sistema debe publicar casos clasificados en bolsa interna | GET /cases/pool · POST /consultants/apply · PATCH /cases/:id/assign | Bolsa de casos / Postulaciones | — | Pendiente |
| RF-027 | El sistema debe filtrar casos según elegibilidad del consultor | GET /cases/pool · POST /consultants/apply · PATCH /cases/:id/assign | Bolsa de casos / Postulaciones | — | Pendiente |
| RF-028 | El sistema debe permitir visualizar casos solo a consultores habilitados | GET /cases/pool · POST /consultants/apply · PATCH /cases/:id/assign | Bolsa de casos / Postulaciones | — | Pendiente |
| RF-029 | El sistema debe permitir postulación estructurada mediante T3C | GET /cases/pool · POST /consultants/apply · PATCH /cases/:id/assign | Bolsa de casos / Postulaciones | — | Pendiente |
| RF-030 | El sistema debe permitir registrar disponibilidad y experiencia del consultor | GET /cases/pool · POST /consultants/apply · PATCH /cases/:id/assign | Bolsa de casos / Postulaciones | — | Pendiente |
| RF-031 | El sistema debe permitir evaluación de postulaciones mediante T3D | GET /cases/pool · POST /consultants/apply · PATCH /cases/:id/assign | Bolsa de casos / Postulaciones | — | Pendiente |
| RF-032 | El sistema debe permitir asignar consultor responsable principal | GET /cases/pool · POST /consultants/apply · PATCH /cases/:id/assign | Bolsa de casos / Postulaciones | — | Pendiente |
| RF-033 | El sistema debe permitir un único responsable principal por caso | GET /cases/pool · POST /consultants/apply · PATCH /cases/:id/assign | Bolsa de casos / Postulaciones | — | Pendiente |
| RF-034 | El sistema debe cambiar estado de EN POSTULACIÓN a ASIGNADO | GET /cases/pool · POST /consultants/apply · PATCH /cases/:id/assign | Bolsa de casos / Postulaciones | — | Pendiente |
| RF-035 | El sistema debe permitir solicitudes de aclaración estructuradas | GET /cases/pool · POST /consultants/apply · PATCH /cases/:id/assign | Bolsa de casos / Postulaciones | — | Pendiente |
| RF-036 | El sistema debe controlar acceso parcial a información sensible del cliente | GET /cases/pool · POST /consultants/apply · PATCH /cases/:id/assign | Bolsa de casos / Postulaciones | — | Pendiente |
| | **Módulo 4 · Diseño de Propuesta** | | | | |
| RF-037 | El sistema debe habilitar expediente documental de propuesta | POST /proposals · PATCH /proposals/:id | Editor de propuesta | — | Pendiente |
| RF-038 | El sistema debe permitir análisis estructurado del caso mediante TP4B | POST /proposals · PATCH /proposals/:id | Editor de propuesta | — | Pendiente |
| RF-039 | El sistema debe permitir construir propuesta estructurada TP4C | POST /proposals · PATCH /proposals/:id | Editor de propuesta | — | Pendiente |
| RF-040 | El sistema debe permitir gestionar anexos y documentos complementarios | POST /proposals · PATCH /proposals/:id | Editor de propuesta | — | Pendiente |
| RF-041 | El sistema debe manejar versionamiento documental | POST /proposals · PATCH /proposals/:id | Editor de propuesta | — | Pendiente |
| RF-042 | El sistema debe impedir sobrescribir versiones anteriores | POST /proposals · PATCH /proposals/:id | Editor de propuesta | — | Pendiente |
| RF-043 | El sistema debe permitir revisión metodológica mediante TP4H | POST /proposals · PATCH /proposals/:id | Editor de propuesta | — | Pendiente |
| RF-044 | El sistema debe permitir registrar observaciones y ajustes | POST /proposals · PATCH /proposals/:id | Editor de propuesta | — | Pendiente |
| RF-045 | El sistema debe permitir consolidar versión formal de propuesta | POST /proposals · PATCH /proposals/:id | Editor de propuesta | — | Pendiente |
| RF-046 | El sistema debe cambiar estado a PROPUESTA LISTA PARA QA | POST /proposals · PATCH /proposals/:id | Editor de propuesta | — | Pendiente |
| RF-047 | El sistema debe permitir reunión virtual de presentación de propuesta | POST /proposals · PATCH /proposals/:id | Editor de propuesta | — | Pendiente |
| RF-048 | El sistema debe registrar evidencia y resumen de reunión | POST /proposals · PATCH /proposals/:id | Editor de propuesta | — | Pendiente |
| | **Módulo 5 · QA, Peer Review y Validación** | | | | |
| RF-049 | El sistema debe permitir revisión metodológica de propuestas | POST /proposals/:id/review | QA / Revisión metodológica | — | Pendiente |
| RF-050 | El sistema debe permitir activar peer review opcional | POST /proposals/:id/review | QA / Revisión metodológica | — | Pendiente |
| RF-051 | El sistema debe permitir revisión experta estructurada | POST /proposals/:id/review | QA / Revisión metodológica | — | Pendiente |
| RF-052 | El sistema debe registrar observaciones técnicas | POST /proposals/:id/review | QA / Revisión metodológica | — | Pendiente |
| RF-053 | El sistema debe permitir solicitar ajustes al consultor | POST /proposals/:id/review | QA / Revisión metodológica | — | Pendiente |
| RF-054 | El sistema debe registrar nuevas versiones ajustadas | POST /proposals/:id/review | QA / Revisión metodológica | — | Pendiente |
| RF-055 | El sistema debe autorizar envío formal al cliente | POST /proposals/:id/review | QA / Revisión metodológica | — | Pendiente |
| RF-056 | El sistema debe cambiar estado a PROPUESTA ENVIADA | POST /proposals/:id/review | QA / Revisión metodológica | — | Pendiente |
| | **Módulo 6 · Decisión del Cliente** | | | | |
| RF-057 | El sistema debe habilitar período formal de decisión del cliente | PATCH /proposals/:id/decision | Decisión de propuesta (portal Mipyme) | — | Pendiente |
| RF-058 | El sistema debe permitir aceptar propuesta | PATCH /proposals/:id/decision | Decisión de propuesta (portal Mipyme) | — | Pendiente |
| RF-059 | El sistema debe permitir solicitar ajustes a propuesta | PATCH /proposals/:id/decision | Decisión de propuesta (portal Mipyme) | — | Pendiente |
| RF-060 | El sistema debe permitir cerrar caso sin contratación | PATCH /proposals/:id/decision | Decisión de propuesta (portal Mipyme) | — | Pendiente |
| RF-061 | El sistema debe registrar respuesta formal mediante TP6A | PATCH /proposals/:id/decision | Decisión de propuesta (portal Mipyme) | — | Pendiente |
| RF-062 | El sistema debe gestionar ajustes mediante TP6B y TP6C | PATCH /proposals/:id/decision | Decisión de propuesta (portal Mipyme) | — | Pendiente |
| RF-063 | El sistema debe registrar aceptación formal TP6D | PATCH /proposals/:id/decision | Decisión de propuesta (portal Mipyme) | — | Pendiente |
| RF-064 | El sistema debe cambiar estado a PENDIENTE DE CONTRATACIÓN | PATCH /proposals/:id/decision | Decisión de propuesta (portal Mipyme) | — | Pendiente |
| RF-065 | El sistema debe registrar motivos de cierre comercial | PATCH /proposals/:id/decision | Decisión de propuesta (portal Mipyme) | — | Pendiente |
| | **Módulo 7 · Formalización y Contratación** | | | | |
| RF-066 | El sistema debe habilitar checklist de contratación T7A | POST /cases/:id/contract-checklist | Checklist de contratación | — | Pendiente |
| RF-067 | El sistema debe permitir registrar evidencias contractuales | POST /cases/:id/contract-checklist | Checklist de contratación | — | Pendiente |
| RF-068 | El sistema debe permitir cargar marco operativo del servicio T7B | POST /cases/:id/contract-checklist | Checklist de contratación | — | Pendiente |
| RF-069 | El sistema debe controlar cumplimiento de requisitos mínimos | POST /cases/:id/contract-checklist | Checklist de contratación | — | Pendiente |
| RF-070 | El sistema debe impedir inicio de ejecución sin checklist completo | POST /cases/:id/contract-checklist | Checklist de contratación | — | Pendiente |
| RF-071 | El sistema debe registrar SLA de contratación | POST /cases/:id/contract-checklist | Checklist de contratación | — | Pendiente |
| RF-072 | El sistema debe cambiar estado a AUTORIZADO PARA EJECUCIÓN | POST /cases/:id/contract-checklist | Checklist de contratación | — | Pendiente |
| | **Módulo 8 · Ejecución y Seguimiento** | | | | |
| RF-073 | El sistema debe permitir crear agenda operativa T8A | POST /cases/:id/milestones · GET /cases/:id/sla | Ejecución / Agenda y hitos | — | Pendiente |
| RF-074 | El sistema debe permitir gestionar hitos y entregables | POST /cases/:id/milestones · GET /cases/:id/sla | Ejecución / Agenda y hitos | — | Pendiente |
| RF-075 | El sistema debe controlar SLA de ejecución | POST /cases/:id/milestones · GET /cases/:id/sla | Ejecución / Agenda y hitos | — | Pendiente |
| RF-076 | El sistema debe generar alertas de incumplimiento | POST /cases/:id/milestones · GET /cases/:id/sla | Ejecución / Agenda y hitos | — | Pendiente |
| RF-077 | El sistema debe permitir registrar incidencias T8D | POST /cases/:id/milestones · GET /cases/:id/sla | Ejecución / Agenda y hitos | — | Pendiente |
| RF-078 | El sistema debe permitir seguimiento ejecutivo por advisory | POST /cases/:id/milestones · GET /cases/:id/sla | Ejecución / Agenda y hitos | — | Pendiente |
| RF-079 | El sistema debe permitir cargar entregables versionados | POST /cases/:id/milestones · GET /cases/:id/sla | Ejecución / Agenda y hitos | — | Pendiente |
| RF-080 | El sistema debe cambiar estado a EN EJECUCIÓN | POST /cases/:id/milestones · GET /cases/:id/sla | Ejecución / Agenda y hitos | — | Pendiente |
| | **Módulo 9 · Cierre del Caso** | | | | |
| RF-081 | El sistema debe permitir cierre técnico del caso | PATCH /cases/:id/close | Cierre de caso | — | Pendiente |
| RF-082 | El sistema debe permitir revisión final mediante checklist T9C | PATCH /cases/:id/close | Cierre de caso | — | Pendiente |
| RF-083 | El sistema debe permitir generar acta de entrega | PATCH /cases/:id/close | Cierre de caso | — | Pendiente |
| RF-084 | El sistema debe permitir aceptación final del cliente | PATCH /cases/:id/close | Cierre de caso | — | Pendiente |
| RF-085 | El sistema debe permitir evaluar satisfacción del cliente | PATCH /cases/:id/close | Cierre de caso | — | Pendiente |
| RF-086 | El sistema debe permitir evaluar desempeño del consultor | PATCH /cases/:id/close | Cierre de caso | — | Pendiente |
| RF-087 | El sistema debe cambiar estado a CERRADO | PATCH /cases/:id/close | Cierre de caso | — | Pendiente |

## Requerimientos Transversales (RT)

| ID | Descripción | Endpoint(s) | Pantalla(s) | PR | Estado |
|---|---|---|---|---|---|
| | **Transversal · Bitácora y Auditoría** | | | | |
| RT-001 | El sistema debe registrar todas las acciones relevantes en bitácora | GET /audit-logs | Bitácora / Visor de auditoría | — | Pendiente |
| RT-002 | La bitácora debe registrar actor, fecha, hora y acción | GET /audit-logs | Bitácora / Visor de auditoría | — | Pendiente |
| RT-003 | La bitácora debe registrar estado anterior y nuevo | GET /audit-logs | Bitácora / Visor de auditoría | — | Pendiente |
| RT-004 | La bitácora debe ser inmodificable | GET /audit-logs | Bitácora / Visor de auditoría | — | Pendiente |
| RT-005 | El sistema debe permitir trazabilidad completa del caso | GET /audit-logs | Bitácora / Visor de auditoría | — | Pendiente |
| | **Transversal · SLA y Alertas** | | | | |
| RT-006 | El sistema debe manejar SLA parametrizables por etapa | GET /sla · POST /sla/rules | Dashboard de SLA | — | Pendiente |
| RT-007 | El sistema debe generar alertas preventivas | GET /sla · POST /sla/rules | Dashboard de SLA | — | Pendiente |
| RT-008 | El sistema debe generar escalamientos automáticos | GET /sla · POST /sla/rules | Dashboard de SLA | — | Pendiente |
| RT-009 | El sistema debe monitorear tiempos de atención | GET /sla · POST /sla/rules | Dashboard de SLA | — | Pendiente |
| | **Transversal · Comunicaciones** | | | | |
| RT-010 | El sistema debe manejar comunicaciones estructuradas | POST /notifications | Centro de notificaciones | — | Pendiente |
| RT-011 | El sistema debe usar plantillas oficiales de comunicación | POST /notifications | Centro de notificaciones | — | Pendiente |
| RT-012 | El sistema debe enviar notificaciones automáticas | POST /notifications | Centro de notificaciones | — | Pendiente |
| RT-013 | El sistema debe registrar comunicaciones enviadas | POST /notifications | Centro de notificaciones | — | Pendiente |
| RT-014 | El sistema debe permitir comunicación controlada entre actores | POST /notifications | Centro de notificaciones | — | Pendiente |
| | **Transversal · Gobierno de Datos y LOV** | | | | |
| RT-015 | El sistema debe administrar listas de valores centralizadas (LOV) | GET /lov · POST /lov | Configuración / Administración de LOV | — | Pendiente |
| RT-016 | El sistema debe impedir uso de texto libre en clasificaciones críticas | GET /lov · POST /lov | Configuración / Administración de LOV | — | Pendiente |
| RT-017 | El sistema debe permitir parametrización de taxonomías | GET /lov · POST /lov | Configuración / Administración de LOV | — | Pendiente |
| RT-018 | El sistema debe mantener integridad relacional entre empresa, caso y documentos | GET /lov · POST /lov | Configuración / Administración de LOV | — | Pendiente |
| | **Transversal · Gestión Documental** | | | | |
| RT-019 | El sistema debe manejar repositorio documental estructurado | POST /documents · GET /documents/:caseId | Repositorio de documentos | — | Pendiente |
| RT-020 | El sistema debe permitir versionamiento documental | POST /documents · GET /documents/:caseId | Repositorio de documentos | — | Pendiente |
| RT-021 | El sistema debe asociar todos los documentos al ID del caso | POST /documents · GET /documents/:caseId | Repositorio de documentos | — | Pendiente |
| RT-022 | El sistema debe controlar permisos de acceso documental | POST /documents · GET /documents/:caseId | Repositorio de documentos | — | Pendiente |
| RT-023 | El sistema debe permitir almacenamiento por etapa y versión | POST /documents · GET /documents/:caseId | Repositorio de documentos | — | Pendiente |

---

Total: 87 RF + 23 RT = 110 requerimientos listados.