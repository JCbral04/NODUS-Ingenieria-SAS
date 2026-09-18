# NODUS — Comandos de orquestación del entorno local

.PHONY: install up down logs migrate seed setup

install:       ## Instalar dependencias de backend y frontend
	cd backend && npm install
	cd frontend && npm install

up:            ## Levantar base de datos (espera healthcheck)
	docker compose up -d --wait

down:          ## Detener todo
	docker compose down

logs:          ## Ver logs de la base de datos
	docker compose logs -f db

migrate:       ## Ejecutar migraciones Prisma
	cd backend && npx prisma migrate dev

seed:          ## Cargar datos demo
	cd backend && npx prisma db seed

setup: install up migrate seed   ## Entorno completo: dependencias + DB + migraciones + seed
