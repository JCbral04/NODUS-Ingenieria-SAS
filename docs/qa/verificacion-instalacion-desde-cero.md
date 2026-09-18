# QA — Verificación de instalación desde cero (Issue #30)

Ejecutado siguiendo el flujo indicado en el issue: clon limpio en carpeta
temporal → `make setup` → `npm run build` (backend y frontend) → `curl` de
login y creación de caso → registro de tiempos y errores.

- **Fecha:** 2026-09-18
- **Commit verificado:** `main` al momento del clon (18-sep-2026)
- **Entorno de ejecución:** contenedor Linux (Ubuntu 24.04) aislado, sin
  Docker y con acceso de red restringido a una lista blanca de dominios
  (no incluye `binaries.prisma.sh` ni Docker Hub). Node v22.22.2 / npm 10.9.7.
  Esto **no es el entorno de un desarrollador real** — se documenta para
  poder separar qué fricciones son del repo y cuáles son de este sandbox.

---

## Resumen de resultados

| # | Paso (README §5, Opción A) | Resultado | Tiempo |
|---|---|---|---|
| 1 | `git clone` | ✅ OK | instantáneo |
| 2 | `cp backend/.env.example backend/.env`<br>`cp frontend/.env.example frontend/.env.local` | ✅ OK | instantáneo |
| 3 | `make setup` (`up` → `migrate` → `seed`) tal cual lo describe el README | ❌ **Falla** | 0 s (falla inmediata en `up`) |
| 3a | `make migrate` sin `npm install` previo (para aislar la causa) | ❌ **Falla** | 59 s |
| 4 | `cd backend && npm install` | ✅ OK | 20 s |
| 5 | `make migrate` (con `node_modules` ya instalado) | ❌ Bloqueado por sandbox | 3 s |
| 6 | `npx prisma generate` (aislado) | ❌ Bloqueado por sandbox | 4 s |
| 7 | `cd backend && npm run build` | ❌ Falla (consecuencia de #5/#6) | 4 s |
| 8 | `cd frontend && npm install` | ✅ OK — 0 vulnerabilidades | 8 s |
| 9 | `cd frontend && npm run build` | ✅ **OK** — build de producción completo (12 rutas) | 23 s |
| 10 | `curl`/`Invoke-RestMethod` login | ✅ **OK** (ver segunda corrida en Windows, más abajo) | — |
| 11 | `curl`/`Invoke-RestMethod` creación de caso | ✅ **OK** — `CAS-000006` creado (ver segunda corrida) | — |

---

## Hallazgos (fricción real del repo/README)

### 🔴 Hallazgo 1 — La Opción A del README no instala dependencias antes de `make setup`
**Repro:** clon limpio → copiar `.env` → `make setup` directo (sin `npm install`).

```
cd backend && npx prisma migrate dev
npm warn exec The following package was not found and will be installed: prisma@8.0.0-rc.15
npm error Cannot read properties of null (reading 'edgesOut')
make: *** [Makefile:15: migrate] Error 1
```

**Causa:** `backend/package.json` fija `"prisma": "^5.22.0"`, pero como
`node_modules` no existe todavía, `npx prisma migrate dev` resuelve y
descarga la última versión publicada (`8.0.0-rc.15`, un release candidate),
que no es compatible y revienta con un error interno de npm — no un mensaje
claro de "faltan dependencias".

**Impacto:** cualquiera que siga la Opción A del README literalmente (que no
menciona `npm install` en ningún paso) se topa con este error confuso en el
primer intento.

**Fix sugerido** — agregar el `npm install` de ambos paquetes antes de
`make setup`, o mejor: que el propio `Makefile` lo haga. Dos opciones:

<details>
<summary>Opción 1 — ajustar el README (mínima)</summary>

```diff
 # 2. Variables de entorno
 cp backend/.env.example backend/.env
 cp frontend/.env.example frontend/.env.local

+# 3. Instalar dependencias
+cd backend && npm install && cd ..
+cd frontend && npm install && cd ..
+
-# 3. Base de datos + migraciones + datos demo
+# 4. Base de datos + migraciones + datos demo
 make setup
```
</details>

<details>
<summary>Opción 2 — que <code>make setup</code> lo haga solo (recomendada)</summary>

```diff
-.PHONY: up down logs migrate seed setup
+.PHONY: up down logs install migrate seed setup

+install:       ## Instalar dependencias de backend y frontend
+	cd backend && npm install
+	cd frontend && npm install
+
 migrate:       ## Ejecutar migraciones Prisma
 	cd backend && npx prisma migrate dev

 seed:          ## Cargar datos demo
 	cd backend && npx prisma db seed

-setup: up migrate seed   ## Entorno completo: DB + migraciones + seed
+setup: install up migrate seed   ## Entorno completo: deps + DB + migraciones + seed
```
</details>

### 🟡 Hallazgo 2 — Versión de Next.js documentada no coincide con la instalada
El README (§3, tabla de stack) indica **Next.js 15**, pero
`frontend/package.json` fija `"next": "^16.3.5"` y el build real corre sobre
**Next.js 16.3.5 (Turbopack)**. No bloquea nada (el build pasa limpio), pero
puede confundir a quien lea la tabla de stack antes de instalar.

**Fix sugerido:**
```diff
-| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui, React Hook Form + Zod |
+| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS, shadcn/ui, React Hook Form + Zod |
```

---

## Limitaciones de esta corrida (no son bugs del repo)

- **Docker no disponible en el sandbox de ejecución** → se sustituyó
  `docker compose up -d db` por un PostgreSQL 16 nativo instalado vía `apt`,
  con el mismo usuario/base (`nodus`/`nodus`) que espera `DATABASE_URL` en
  `.env.example`. Un desarrollador con Docker instalado (el requisito real
  del README) no debería ver esta parte como fricción.
- **Sin salida a `binaries.prisma.sh`** → el motor nativo de Prisma
  (`libquery_engine.so.node`) no se pudo descargar (`403 Forbidden` del
  proxy de red del sandbox), lo que bloqueó `prisma migrate dev`,
  `prisma generate`, el build del backend y, en cascada, las pruebas
  `curl` de login y creación de caso. Esto es una restricción de red de
  este entorno de ejecución, no del proyecto — en una máquina con acceso
  normal a internet este paso no debería fallar.

**Pendiente de completar por el equipo (en una máquina con Docker + internet
normal):** una vez aplicado el fix del Hallazgo 1, correr `make setup`
completo y `curl http://localhost:3001/api/auth/login` +
`curl -X POST http://localhost:3001/api/cases` para cerrar la evidencia con
capturas reales, tal como pide el issue.

---

## Lo que sí quedó verificado end-to-end

- ✅ Clon limpio y copia de `.env` — sin fricción.
- ✅ `backend: npm install` — 20 s, sin errores (solo warnings de paquetes
  deprecados típicos de NestJS 10, no bloqueantes).
- ✅ `frontend: npm install` — 8 s, **0 vulnerabilidades**.
- ✅ `frontend: npm run build` — 23 s, compila y prerenderiza las 12 rutas
  (`/`, `/login`, `/casos`, `/casos/[id]`, `/dashboard`, `/empresas`,
  `/consultores`, `/documentos`, `/sla`, `/workflow`, `/registro-caso`,
  `/_not-found`) sin errores de TypeScript.

---

## Segunda corrida — instalación real en Windows 11 (equipo del QA)

A diferencia de la corrida anterior (sandbox Linux sin Docker), esta segunda
verificación se hizo **de punta a punta en la máquina real de Manuel Osorio
(Windows 11)**, incluyendo Docker de verdad. Esto permitió completar los dos
pasos que habían quedado pendientes: `curl` de login y `curl` de creación de
caso. Se documentan aquí las fricciones adicionales que solo aparecen en un
entorno Windows real (no visibles desde el sandbox Linux de la primera
corrida).

### Prerrequisitos que no estaban instalados

| Fricción | Detalle | Solución aplicada |
|---|---|---|
| Docker Desktop pedía WSL2 | Error *"Docker Desktop - WSL not installed"* al abrir Docker por primera vez | `wsl --install` desde PowerShell como administrador + reinicio. El README no menciona este prerrequisito de Windows explícitamente (solo dice "Docker + Docker Compose"), vale la pena aclararlo para usuarios Windows sin WSL2 previo. |
| Corte de internet a mitad de la descarga de la distro Ubuntu de WSL | `Código de error: Wsl/InstallDistro/0x80072eff` | Reintentar `wsl --install` una vez restablecido el internet — no hace falta reinstalar desde cero. |

### 🔴 Hallazgo 3 — `make` no existe en Windows por defecto
`make setup` falla inmediatamente con:
```
make : El término 'make' no se reconoce como nombre de un cmdlet...
```
Windows (PowerShell/cmd) no trae `make` instalado a menos que se instale
manualmente (Chocolatey, Git Bash con extras, WSL, etc.), algo que el README
no menciona. **Se resolvió corriendo el equivalente manual, comando por
comando:**
```powershell
docker compose up -d
cd backend
npx prisma migrate dev
npx prisma db seed
```
**Fix sugerido para el README:** agregar una nota bajo "Requisitos" indicando
que en Windows `make` no viene por defecto, y dar la alternativa manual
(los 3 comandos de arriba) como Opción C, o documentar instalación de `make`
vía `choco install make`.

### 🔴 Hallazgo 4 — El puerto 5432 de Postgres falla por conflicto en Windows
Con Docker ya corriendo y el contenedor `nodus-db` en estado `healthy`
(confirmado con `docker ps` y con conexión directa exitosa vía
`docker exec -it nodus-db psql -U nodus -d nodus`), la migración desde el
host seguía fallando:
```
Error: P1000: Authentication failed against database server at `localhost`,
the provided database credentials for `(not available)` are not valid.
```
Es decir: la base de datos en sí funciona perfecto con `nodus`/`nodus`, pero
la conexión TCP desde Windows a `localhost:5432` nunca llega bien — típico
de un conflicto de puerto con otro servicio (otro Postgres nativo, otra app)
o de una particularidad de red WSL2/Docker Desktop con ese puerto específico
en el equipo del usuario.

**Solución aplicada:** cambiar el mapeo de puerto de `5432:5432` a
`5433:5432` en `docker-compose.yml`, y actualizar `DATABASE_URL` en
`backend/.env` a `localhost:5433`. Con eso, migración y seed corrieron sin
problema.

**Fix sugerido para el README:** agregar una nota en la sección de
Instalación: *"Si `prisma migrate dev` falla con `P1000` pese a que
`docker ps` muestra el contenedor `healthy`, es probable que el puerto 5432
esté ocupado por otro proceso en tu máquina. Cambia el mapeo de puerto en
`docker-compose.yml` (ej. a `5433:5432`) y ajusta `DATABASE_URL` en
`backend/.env` al mismo puerto."*

### 🟡 Hallazgo 5 — Advertencia para quien haga QA: verificar la rama activa
Durante esta corrida, el clon local terminó apuntando a la rama
`docs/readme-realidad-implementada` en vez de `main` (arrastrado de un
`checkout` anterior en el equipo del QA, no un problema del repositorio en
sí). Esto causó que `POST /api/cases` devolviera `404 Cannot POST /api/cases`
pese a que el código en `main` sí define ese endpoint correctamente — el
`CasesController` simplemente no existía en esa rama vieja.

**No es un bug del repo**, pero sí una fricción real de proceso: nada en el
README recuerda confirmar `git branch` / `git status` antes de probar. Se
sugiere agregar un recordatorio en el checklist de QA: *"confirmar que el
checkout está sobre `main` (`git branch`, `git log -1 --oneline`) antes de
levantar el entorno."*

### PowerShell + `curl.exe`: nota de proceso (no es fricción del repo)
Al ejecutar los `curl` pedidos por el issue desde PowerShell en Windows, el
alias `curl` (que en PowerShell apunta a `Invoke-WebRequest`, no al curl
real) y las reglas de escapado de comillas de PowerShell causaron dos
problemas menores:
- `curl.exe -d "..."` con comillas escapadas (`\"`) llegaba con el JSON mal
  formado (`Expected property name or '}' in JSON at position 1`).
- `localhost` resolvía de forma inconsistente entre IPv4/IPv6, dando
  `Failed to connect` de forma intermitente.

**Se resolvió** usando `127.0.0.1` en vez de `localhost`, y cambiando de
`curl.exe` a los cmdlets nativos de PowerShell (`Invoke-RestMethod` con
`ConvertTo-Json`), que no tienen problemas de escapado. Esto es una
particularidad de PowerShell, no algo que el equipo del proyecto deba
corregir, pero vale la pena anotarlo como tip para el próximo QA en Windows.

### ✅ Resultado final — los dos pasos pendientes, completados

**Login** (`POST /api/auth/login`, usuario `advisory@nodus.co` /
`Nodus2026*`):
```powershell
$body = @{ email = "advisory@nodus.co"; password = "Nodus2026*" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```
→ Respuesta `200 OK` con `accessToken` (JWT) válido. ✅

**Creación de caso** (`POST /api/cases`, endpoint público de onboarding T1):
```powershell
$caso = @{
  companyName = "Empresa Prueba QA"; taxId = "900123456-1"; country = "Colombia";
  city = "Bogotá"; contactName = "Juan Tester"; position = "Gerente";
  email = "contacto@empresaqa.co"; phone = "3001234567"; password = "Prueba2026*";
  acceptsTerms = $true; title = "Necesitamos mejorar procesos de TI";
  description = "Caso de prueba creado durante QA de instalación del issue 30";
  areaId = 2; urgencyId = 20; impactId = 24
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/cases" -Method Post -Body $caso -ContentType "application/json"
```
→ Respuesta `201 Created`:
```
caseNumber  status   email
----------  ------   -----
CAS-000006  CREADO   contacto@empresaqa.co
```
✅ Empresa + contacto + caso creados en una sola transacción, tal como
describe el README (§8, Onboarding T1). Evidencia: capturas de pantalla del
proceso completo adjuntas en la conversación del equipo (WSL, Docker
Desktop, `docker ps`, `npx prisma migrate dev`, `npx prisma db seed`,
Swagger UI con la ruta `/api/cases` mapeada, y las dos respuestas exitosas
de arriba).

### Checklist de campos usados para probar `POST /api/cases`
Como el README no documenta el shape exacto del `OnboardingDto`, se dejan
aquí los campos reales (tomados de
`backend/src/cases/dto/onboarding.dto.ts`) para que el próximo QA no tenga
que adivinarlos:

| Campo | Tipo | Notas |
|---|---|---|
| `companyName` | string | |
| `taxId` | string (opcional) | NIT |
| `country` | string | |
| `city` | string | |
| `contactName` | string | |
| `position` | string | cargo del contacto |
| `email` | string (email) | |
| `phone` | string | |
| `password` | string (mín. 8) | |
| `acceptsTerms` | boolean | |
| `title` | string | título del caso |
| `description` | string | |
| `areaId` | int | ver tabla `LovValue`, categoría `AREA_PROBLEMA` (ids 1–8) |
| `urgencyId` | int | categoría `NIVEL_URGENCIA` (ids 19–21) |
| `impactId` | int | categoría `NIVEL_IMPACTO` (ids 22–25) |

**Fix sugerido:** documentar este shape en el README (§8) o enlazar
directamente a Swagger (`/api/docs`), ya que ahora mismo solo aparece en el
código fuente del DTO.
