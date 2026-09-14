# NODUS — Comandos de orquestación del entorno local

.PHONY: up down logs migrate seed setup

up:            ## Levantar base de datos
	docker compose up -d

down:          ## Detener todo
	docker compose down

logs:          ## Ver logs de la base de datos
	docker compose logs -f db

migrate:       ## Ejecutar migraciones Prisma
	cd backend && npx prisma migrate dev

seed:          ## Cargar datos demo
	cd backend && npx prisma db seed

setup: up migrate seed   ## Entorno completo: DB + migraciones + seed
