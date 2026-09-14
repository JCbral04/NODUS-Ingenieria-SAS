# Backlog Sprint — NODUS MVP (14 → 18 sep)

> Crear en GitHub con los labels: `backend`, `frontend`, `docs`, `qa`, `P0`, `P1`.
> Asignados: @JCbral04 (Juan) · @puringu (Laura) · @273Manuel (Manuel)

---

## Día 1 — Hoy (14 sep): Fundaciones

### 1. chore(backend): esqueleto de módulos NestJS + migración inicial Prisma
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RNF-008
Crear los módulos del dominio vacíos según README: auth, users, companies,
cases, workflow, consultants, applications, proposals, contracts, execution,
documents, sla, audit, notifications. Correr `prisma migrate dev` con el
schema existente.
**Criterios:** `npm run build` verde · Swagger en `/api/docs` lista los módulos.

### 2. feat(auth): JWT + login + refresh + guards RBAC (5 roles)
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RNF-003/004
Login con email/password (bcrypt), emisión de access + refresh token,
`RolesGuard` + `@Roles()` decorador, seed de roles ya existe.
**Criterios:** login devuelve JWT · endpoint de perfil protegido por rol ·
usuario Mipyme no accede a rutas de Advisory (403) · sesión refrescable.

### 3. feat(ui): layout principal + pantalla de login
**Asignado:** Laura · **Labels:** `frontend`, `P0`
Sidebar (Dashboard, Casos, Empresas, Consultores, Workflow, Documentos, SLA)
+ topbar con notificaciones y usuario, según sección 5 del Architecture
Blueprint. Login conectado al endpoint real, token en memoria/localStorage.
**Criterios:** login redirige según rol · layout visible en todas las rutas
protegidas · sesión expirada redirige a login.

### 4. docs: matriz de trazabilidad RF/RT → endpoints → pantallas
**Asignado:** Manuel · **Labels:** `docs`, `P0`
`docs/trazabilidad.md` con tabla: ID requerimiento · descripción · endpoint(s)
· pantalla(s) · PR · estado. Base: matriz del cliente (RF-001…RF-087,
RT-001…RT-023). Se actualiza con cada PR mergeado.

---

## Día 2 (15 sep): Onboarding + workflow

### 5. feat(companies): empresa única + verificación anti-duplicados
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RF-002/003/005
Buscar coincidencias por email, dominio, nombre y NIT antes de crear;
sugerir vinculación al registro existente.
**Criterios:** segundo caso de la misma empresa **no** crea empresa duplicada ·
caso queda vinculado al ID único · historial consolidado por empresa.

### 6. feat(cases): onboarding T1 en dos bloques + creación de caso (CREADO)
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RF-001, 007–014
Flujo transaccional: identificación básica → registro de necesidad (título,
descripción, área LOV, urgencia, impacto, adjuntos). Crea empresa (si aplica)
+ usuario contacto + caso + caseNumber `CAS-XXXXXX` + estado CREADO + entrada
en bitácora, en una sola transacción.
**Criterios:** caso creado en <3 min de formulario · edición permitida solo
en CREADO (RF-013) · adjuntos en `Document` con stage INTAKE.

### 7. feat(workflow): WorkflowService — máquina de estados con guardas
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** todas las transiciones
Único punto de cambio de estado: valida transición permitida, persiste,
escribe CaseStateHistory + AuditLog, dispara notificación. **Prohibido**
UPDATE directo del estado fuera de este servicio.
**Criterios:** transición inválida rechazada con error claro · cada cambio
genera registro en bitácora con actor, fecha, estado anterior/nuevo.

### 8. feat(lov): gobierno de taxonomías (catálogos LOV)
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RF-019/021, RT-015–017
CRUD de LovCategory/LovValue (solo Admin): áreas, intervención, complejidad,
urgencia, impacto, nivel consultor, tipos de incidencia.
**Criterios:** clasificaciones críticas solo aceptan IDs de LOV activos ·
sin texto libre en campos clasificados.

### 9. feat(ui): lista de casos por rol + detalle con timeline
**Asignado:** Laura · **Labels:** `frontend`, `P0`
Lista con filtros por estado (Advisory ve todos; Mipyme solo los suyos;
Consultor solo los asignados/postulados). Detalle con timeline de bitácora
(CaseStateHistory + AuditLog).
**Criterios:** filtros funcionan · timeline muestra actor, fecha y estados.

### 10. docs: casos de prueba por rol
**Asignado:** Manuel · **Labels:** `docs`, `qa`, `P0`
Matriz de pruebas manuales: flujo feliz + al menos 3 negativos por rol
(p. ej. Mipyme intenta clasificar → 403; transición inválida → rechazo).

---

## Día 3 (16 sep): Debida diligencia + bolsa

### 11. feat(cases): debida diligencia T2 + clasificación con LOV
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RF-015–025
Activar revisión (CREADO→EN_REVISION), registro de observaciones, solicitud
de ampliación, validación de elegibilidad y clasificación estructurada →
CLASIFICADO. Guarda historial de reclasificaciones.
**Criterios:** solo Advisory clasifica · reclasificación conserva historial ·
sin texto libre en clasificación.

### 12. feat(bolsa): publicación con elegibilidad + postulación T3C
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RF-026–031, 035/036
Publicar caso (CLASIFICADO→EN_POSTULACION) visible solo para consultores
HABILITADOS con especialidad afín y disponibilidad. Postulación estructurada:
interés, disponibilidad, pertinencia, experiencia. Info sensible del cliente
oculta en la bolsa.
**Criterios:** consultor no elegible no ve el caso · doble postulación
imposible (unique caseId+consultantId).

### 13. feat(bolsa): evaluación de postulaciones + asignación
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RF-032/033/034
Advisory evalúa con criterios (especialidad, nivel, historial) y asigna
único responsable principal → ASIGNADO. Postulaciones perdedoras quedan
NO_ASIGNADO (trazable).
**Criterios:** imposible tener 2 responsables principales activos · cambio de
estado pasa por WorkflowService.

### 14. feat(ui): vista advisory (cola de revisión) + vista bolsa del consultor
**Asignado:** Laura · **Labels:** `frontend`, `P0`
Pantalla de cola de casos EN_REVISION para Advisory (con formulario de
clasificación). Pantalla de bolsa para consultor (cards de oportunidades
elegibles + botón Postular con formulario T3C).
**Criterado:** Advisory clasifica desde la UI · consultor postula desde la UI.

### 15. feat(ui): pantalla de asignación para Advisory
**Asignado:** Manuel · **Labels:** `frontend`, `P0`
Listado de postulaciones por caso con datos del consultor y botón Asignar,
con confirmación y feedback.
**Criterios:** asignar actualiza estado visible en el detalle del caso.

---

## Día 4 (17 sep): Propuesta → decisión → contratación

### 16. feat(proposals): propuesta TP4C estructurada + versionado
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RF-037–042
Expediente de propuesta al asignar (ASIGNADO→PROPUESTA_EN_DISENO). Campos
TP4C: resumen, objetivo, alcance, exclusiones, actividades, entregables,
cronograma, valoración, condiciones. Versionado: nueva fila por versión,
jamás sobrescritura. Documentos complementarios por etapa PROPUESTA.
**Criterios:** (caseId, version) único · versiones anteriores preservadas.

### 17. feat(proposals): revisión metodológica QA (TP4H) + envío formal
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RF-043–046, 049–056
Checklist QA (completitud, coherencia, plantillas, cronograma, exclusiones,
supuestos), observaciones y solicitud de ajustes (nueva versión). Aprobación
→ PROPUESTA_ENVIADA con notificación al cliente.
**Criterios:** propuesta sin QA aprobado no puede enviarse · cada revisión
queda registrada con revisor y resultado.

### 18. feat(decision): decisión del cliente TP6 (aceptar / ajustar / no continuar)
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RF-057–065
Período formal de decisión (PROPUESTA_ENVIADA→EN_DECISION_CLIENTE). Aceptar →
PROPUESTA_ACEPTADA→PENDIENTE_DE_CONTRATACION. Ajustes → AJUSTES_PROPUESTA →
loop a versión nueva. No continuar → CERRADO_SIN_CONTRATACION con motivo
registrado (analítica comercial).
**Criterios:** decisión registrada con actor, fecha y versión afectada ·
loop de ajustes trazable.

### 19. feat(contract): checklist T7A bloqueante + marco operativo T7B
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RF-066–072
Checklist de formalización (contrato, documentos legales, validaciones,
tributarios, verificación advisory) con responsable, fecha y evidencia.
Marco operativo del servicio cargado por el consultor. **Guarda bloqueante:**
sin checklist completo no se pasa a AUTORIZADO_PARA_EJECUCION (RF-070).
**Criterios:** la guarda rechaza la transición si falta un ítem · SLA de
contratación parametrizable.

### 20. feat(ui): editor de propuesta, QA, decisión y checklist de contratación
**Asignado:** Laura + Manuel · **Labels:** `frontend`, `P0`
Editor estructurado TP4C (formulario por bloques), pantalla de revisión con
checklist TP4H, pantalla de decisión para el cliente, checklist T7A con
estados y evidencias.
**Criterios:** el flujo completo propuesta→contratación es usable 100% desde UI.

### 21. chore: punto de control de contingencia
**Asignado:** los 3 · **Labels:** `P0`
Decisión documentada en ADR-003: integración web↔API va bien (se mantiene
NestJS) o se colapsa backend a API Routes de Next.js manteniendo Prisma.

---

## Día 5 (18 sep... entrega viernes: esto corre el jueves noche/viernes temprano)

### 22. feat(execution): agenda T8A + hitos + entregables versionados
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RF-073–080
Agenda operativa con actividades (estados parametrizados), hitos con
criticidad, entregables con versiones y estado. Advisory tiene vista de
seguimiento ejecutivo.
**Criterios:** consultor actualiza avance · hitos vencidos visibles.

### 23. feat(closure): cierre T9 — acta, aceptación del cliente, evaluaciones
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RF-081–087
Declaración de cierre técnico del consultor → revisión final advisory →
entrega formal → aceptación/observaciones del cliente → evaluaciones
(satisfacción T9G + desempeño T9H) → CERRADO.
**Criterios:** caso sin entregables finales no cierra · acta y evaluaciones
registradas en el expediente.

### 24. feat(sla): reglas parametrizables + cálculo de vencimiento
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RT-006–009
SlaRule por estado (horas, nivel de escalamiento). Endpoint que calcula
para cada caso activo su vencimiento, estado (OK / por vencer / vencido) y
genera notificación/alerta.
**Criterios:** dashboard y lista de casos muestran indicador SLA · reglas
editables por Admin sin tocar código.

### 25. feat(notifications): bandeja in-app + plantillas TCOM
**Asignado:** Juan · **Labels:** `backend`, `P0` · **Req:** RT-010–014
Bandeja por usuario con plantillas estandarizadas (caso creado, asignación,
propuesta enviada, SLA por vencer, cierre…). Cada notificación referenciada
al caso y registrada en bitácora.
**Criterios:** eventos clave generan notificación al actor correcto ·
badge de no leídas en topbar.

### 26. feat(dashboard): KPIs operativos básicos
**Asignado:** Juan (API) + Laura (UI) · **Labels:** `backend`, `frontend`, `P0`
Casos por estado, SLA críticos, casos activos, conversión propuestas,
tiempo promedio de atención.
**Criterios:** widgets del Blueprint visibles para Advisory/Admin.

### 27. docs: README final + evidencias (capturas + video 3 min)
**Asignado:** Manuel · **Labels:** `docs`, `P0`
README completo verificado contra la app real. Evidencias en
`docs/evidencias/`: capturas del flujo end-to-end por rol + video demo.

### 28. chore: verificación de instalación desde cero + release
**Asignado:** los 3 · **Labels:** `P0`
Clone limpio → `make setup` → build → recorrido demo completo. Tag
`v1.0.0-mvp` y release en GitHub. Deploy opcional si sobra tiempo.
