BLUE 	= \033[0;34m
GREEN 	= \033[0;32m
RED 	= \033[0;31m
ORANGE	= \033[38;5;209m
YELLOW	= \033[0;93m
BROWN 	= \033[38;2;184;143;29m
RESET 	= \033[0m

FRONTEND = ./srcs/frontend

DC = docker compose -f srcs/docker-compose.yml

all: build up


build:
	@echo "$(YELLOW)Building Docker images...$(RESET)"
	$(DC) build
dev:
	@echo "$(YELLOW)Starting frontend dev container...$(RESET)"
	$(DC) --profile dev up --build frontend-dev

clean:
	@echo "$(ORANGE)Stopping containers and removing volumes...$(ORANGE)"
	-$(DC) down -v
	rm -rf srcs/dist

fclean: clean
	@echo "$(RED)Removing all installed dependencies...$(RESET)"
	rm -rf srcs/frontend/node_modules

up:
	@echo "$(YELLOW)Starting containers...$(RESET)"
	$(DC) up -d
	@echo "$(GREEN)Ok!$(RESET)"

re: fclean all

.PHONY: all clean fclean ts build up re dev
