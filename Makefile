# Makefile for Transcendence Frontend + Nginx

# Docker Compose file
DC = docker compose -f srcs/docker-compose.yml

# Default target
all: build up

# ------------------------------
# 1️⃣ Clean previous builds
clean:
	@echo "Stopping containers and removing volumes..."
	-$(DC) down -v
	@echo "Removing dist folder..."
	-rm -rf srcs/frontend/dist

# ------------------------------
# 2️⃣ Build TypeScript
ts:
	@echo "Installing dependencies and compiling TypeScript..."
	cd srcs/frontend && npm install
	cd srcs/frontend && npx tsc

# ------------------------------
# 3️⃣ Build Docker images
build: ts
	@echo "Building Docker images..."
	$(DC) build

# ------------------------------
# 4️⃣ Start containers
up:
	@echo "Starting containers..."
	$(DC) up -d

# ------------------------------
# 5️⃣ Rebuild from scratch
re: clean all

.PHONY: all clean ts build up re
