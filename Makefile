YELLOW:=$(shell tput bold; tput setaf 3)
RED:=$(shell tput bold; tput setaf 1)
BLUE:=$(shell tput bold; tput setaf 4)
GREEN:=$(shell tput bold; tput setaf 2)
CYAN:=$(shell tput bold; tput setaf 6)
BOLD:=$(shell tput bold)
RESET:=$(shell tput sgr0)

define help_message =
	@echo "$(YELLOW)$(BOLD)[Makefile]$(RESET)$(BOLD)${1}$(RESET)"
endef

PROJECT_NAME=trascendence
ENV_FILE=.env

all:
	@echo
	@echo "${BLUE}${BOLD}Available recipes:${RESET}"

	@echo "  ${GREEN}${BOLD}up      ${CYAN}- Run the containerized application"
	@echo "  ${GREEN}${BOLD}build   ${CYAN}- Build the container image"
	@echo "  ${GREEN}${BOLD}test    ${CYAN}- Run integration tests"
	@echo "  ${GREEN}${BOLD}down    ${CYAN}- Stop the containerized application"
	@echo "  ${GREEN}${BOLD}clean   ${CYAN}- Stop the application and remove the database volume"
	@echo "  ${GREEN}${BOLD}fclean  ${CYAN}- Remove container images"
	@echo "  ${GREEN}${BOLD}re      ${CYAN}- Rebuild and restart the application$(RESET)"
	@echo

$(ENV_FILE): $(ENV_FILE).example
	$(call help_message, "Creating the .env file from .env.example...")
	cp .env.example .env
	sed -i '0,/{generated-by-makefile}/s//$(shell openssl rand -hex 32)/' .env
	sed -i '0,/{generated-by-makefile}/s//$(shell openssl rand -hex 32)/' .env

up: $(ENV_FILE)
	$(call help_message, "Running the containerized application...")
	docker compose up --watch

build:
	$(call help_message, "Building the container image...")
	docker compose build

test:
	$(call help_message, "Running unit tests...")
	docker compose exec api npm run test
	docker compose exec users npm run test
	$(call help_message, "Running integration tests...")
	docker compose up -d
	docker compose exec proxy npm test

down:
	$(call help_message, "Stopping the containerized application...")
	docker compose down

clean:
	$(call help_message, "Stopping the containerized application and removing the database volume...")
	docker compose down -v

fclean: clean
	$(call help_message, "Removing container images...")
	docker rmi -f $(shell docker images --format '{{.Repository}}:{{.Tag}}' | grep "^${PROJECT_NAME}") || true

re: clean build up

.PHONY: all up test build down clean fclean re