# Casos de Prueba Negativos por Rol

Casos de prueba priorizados por el equipo (ver Issue #13) para validar el
control de acceso por rol (RBAC) y las reglas del workflow antes de que se
complete el módulo de autenticación (Issue #2). Corresponden a los
requerimientos RNF-003, RNF-004 (roles y permisos) y RF-020/RF-024
(transiciones de estado controladas).

---

## CP-001 · Mipyme intentando clasificar un caso

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que un usuario con rol Mipyme no pueda ejecutar una acción reservada al rol Advisory |
| **Rol autenticado** | Mipyme (cliente) |
| **Precondición** | Existe un caso en estado `EN REVISIÓN`, asociado a la empresa del usuario Mipyme autenticado |
| **Endpoint bajo prueba** | `PATCH /api/cases/:id/classification` *(pendiente de confirmar ruta exacta cuando se implemente)* |
| **Pasos** | 1. Autenticarse como usuario con rol Mipyme.<br>2. Intentar clasificar el caso enviando una petición al endpoint de clasificación. |
| **Resultado esperado** | Respuesta `403 Forbidden`. El caso permanece en estado `EN REVISIÓN`, sin cambios. |
| **Requerimientos relacionados** | RF-019, RF-020, RNF-004 |

---

## CP-002 · Transición de estado inválida

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que el sistema rechace saltos de estado que no siguen el flujo definido del workflow |
| **Rol autenticado** | Advisory (o el rol que corresponda al intentar la transición) |
| **Precondición** | Existe un caso en estado `CREADO` |
| **Endpoint bajo prueba** | `PATCH /api/cases/:id/status` |
| **Pasos** | 1. Autenticarse con un rol habilitado para cambiar estados.<br>2. Intentar transicionar el caso directamente de `CREADO` a `CERRADO`, saltándose los estados intermedios (`EN REVISIÓN`, `CLASIFICADO`, etc.). |
| **Resultado esperado** | La petición es rechazada (error de validación, ej. `400 Bad Request` o `409 Conflict` según se defina). El caso permanece en `CREADO`. |
| **Requerimientos relacionados** | RF-016, RF-024, RF-080, RF-087 (control de flujo de estados) |

---

## CP-003 · Consultor no elegible viendo caso de la bolsa

| Campo | Detalle |
|---|---|
| **Objetivo** | Verificar que solo consultores elegibles puedan ver los casos publicados en la bolsa interna |
| **Rol autenticado** | Consultor (sin cumplir criterios de elegibilidad para el caso específico) |
| **Precondición** | Existe un caso `CLASIFICADO` publicado en la bolsa interna, con criterios de elegibilidad que el consultor autenticado no cumple |
| **Endpoint bajo prueba** | `GET /api/cases/pool/:id` *(pendiente de confirmar ruta exacta cuando se implemente)* |
| **Pasos** | 1. Autenticarse como consultor que no cumple los criterios de elegibilidad del caso.<br>2. Intentar acceder al detalle del caso desde la bolsa. |
| **Resultado esperado** | Respuesta `403 Forbidden`. El consultor no puede ver el detalle del caso. |
| **Requerimientos relacionados** | RF-027, RF-028, RNF-004 |

---

## Notas

- Estos 3 casos se priorizaron por ser los que más riesgo de fuga de datos o de
  incumplimiento del workflow representan una vez que el módulo de auth
  (Issue #2) quede activo.
- Las rutas exactas de los endpoints deben confirmarse/actualizarse cuando el
  backend las implemente (ver `docs/trazabilidad.md`).
- Estado de ejecución: **Pendiente** — se actualizará con evidencia (captura o
  log de respuesta) una vez que el módulo de auth y los guards RBAC estén
  disponibles.
