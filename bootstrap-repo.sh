#!/usr/bin/env bash
# ============================================================================
# NODUS Ingeniería SAS — Script de arranque del repositorio
# Uso:
#   1. Crear en GitHub el repo VACÍO: https://github.com/new
#      (nombre: NODUS-Ingenieria-SAS · Private · SIN README ni licencia)
#   2. Colocar TODOS los archivos del esqueleto en esta carpeta
#   3. bash bootstrap-repo.sh
# ============================================================================
set -euo pipefail

echo "==> 1/5 Inicializando Git (rama main)..."
git init -b main

echo "==> 2/5 Primer commit con el esqueleto..."
git add -A
git commit -m "chore(repo): esqueleto inicial NODUS — CI, docker-compose, Prisma schema/seed, ADRs"

echo "==> 3/5 Generando lockfiles (npm install en backend y frontend)..."
(cd backend && npm install --no-audit --no-fund)
(cd frontend && npm install --no-audit --no-fund)
git add backend/package-lock.json frontend/package-lock.json
git commit -m "chore(deps): lockfiles backend y frontend" || echo "   (sin cambios)"

echo "==> 4/5 Verificación local rápida..."
(cd backend && npx prisma validate) && echo "   ✔ esquema Prisma válido"

echo "==> 5/5 Conectar con GitHub..."
cat <<'EOF'

Ahora ejecuta (con TU usuario):
  git remote add origin git@github.com:TU-USUARIO/NODUS-Ingenieria-SAS.git
  git push -u origin main

Luego en GitHub (2 min):
  Settings → Branches → Add branch protection rule → rama "main":
    ✔ Require a pull request before merging (approvals: 1)
    ✔ Require status checks to pass (seleccionar: backend, frontend)
  Settings → Collaborators → invitar a Laura Ruiz y Manuel Osorio

Validación final del entorno:
  make setup        # Docker: Postgres + migraciones + seed demo
  cd backend && npm run start:dev      # API → http://localhost:3001/api/docs
  cd frontend && npm run dev           # Web → http://localhost:3000

EOF
