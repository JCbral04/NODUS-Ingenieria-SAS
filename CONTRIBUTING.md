# Contribución y flujo de trabajo (DevOps)

Somos 3 desarrolladores y 5 días. Este flujo está diseñado para que `main`
esté **siempre ejecutable**: es lo primero que revisará el evaluador.

## 1. Ramas

- `main` — protegida. Código siempre ejecutable. Solo entra vía PR.
- `feature/<modulo>-<descripcion>` — funcionalidad (ej. `feature/cases-onboarding`).
- `fix/<modulo>-<descripcion>` — correcciones.
- `docs/<descripcion>` — documentación.
- `chore/<descripcion>` — configuración, dependencias, CI.

**Regla de oro:** ramas de vida corta (< 1 día). Si una rama vive más de un
día, se parte en ramas más pequeñas.

## 2. Flujo de trabajo

```bash
git checkout main && git pull origin main
git checkout -b feature/cases-onboarding
# ...commits frecuentes y pequeños...
git push origin feature/cases-onboarding
# Abrir PR en GitHub, pedir revisión a OTRO compañero
# CI en verde + 1 aprobación → squash & merge a main → borrar rama
```

## 3. Convenciones de commit

Formato: `<tipo>(<alcance>): <descripcion en imperativo>`

Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.

Ejemplos:

```
feat(cases): onboarding T1 con verificación de empresa única
fix(workflow): transición inválida de CREADO a ASIGNADO bloqueada
docs(readme): instrucciones de instalación con Docker
```

## 4. Definition of Done (para cerrar un PR)

- [ ] Cumple los requerimientos RF/RT asignados (ver `docs/trazabilidad.md`)
- [ ] Todo cambio de estado pasa por `WorkflowService` (nunca UPDATE directo)
- [ ] Bitácora automática en la acción (auditoría)
- [ ] Guards de roles en el endpoint (RBAC)
- [ ] `npm run build` y tests pasan localmente
- [ ] CI en verde
- [ ] Variables de entorno nuevas documentadas en `.env.example`

## 5. Integración diaria

Cada noche (máximo 8 p.m.) lo que esté en `main` debe levantar con
`make setup` + `npm run start:dev` sin errores. Si alguien rompe `main`,
tiene prioridad absoluta de arreglo sobre cualquier feature nueva.

## 6. Revisiones de código

- El autor nunca aprueba su propio PR.
- Revisar es revisar: lógica de negocio, permisos, bitácora, calidad — no
  solo "que compile".
- Comentarios resueltos o respondidos antes del merge.

## 7. CI/CD

`.github/workflows/ci.yml` compila backend y frontend y ejecuta tests en
cada push a `main` y cada PR. **No se mergea con CI en rojo.**
