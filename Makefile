YELLOW=\033[1;33m
RED=\033[1;31m
BLUE=\033[1;34m
GREEN=\033[1;32m
CYAN=\033[1;36m
BOLD=\033[1m
RESET=\033[0m

define help_message =
	@echo -e "$(YELLOW)$(BOLD)[Makefile]$(RESET)$(BOLD)${1}$(RESET)"
endef

define error_message =
	@echo -e "$(RED)$(BOLD)[Makefile]$(RESET)$(BOLD)${1}$(RESET)" >&2
endef

PROJECT_NAME=trascendence
ENV_FILE=.env

all:
	@echo
	@echo -e "${BLUE}${BOLD}Available recipes:"

	@echo -e "  ${GREEN}${BOLD}up                 ${CYAN}- Run the containerized application"
	@echo -e "  ${GREEN}${BOLD}build              ${CYAN}- Build the container image"
	@echo -e "  ${GREEN}${BOLD}test ARG=<service> ${CYAN}- Run tests for the specified container"
	@echo -e "  ${GREEN}${BOLD}down               ${CYAN}- Stop the containerized application"
	@echo -e "  ${GREEN}${BOLD}clean              ${CYAN}- Stop the application and remove the database volume"
	@echo -e "  ${GREEN}${BOLD}fclean             ${CYAN}- Remove container images"
	@echo -e "  ${GREEN}${BOLD}re                 ${CYAN}- Rebuild and restart the application"
	@echo

$(ENV_FILE):
	$(call help_message, "Creating the .env file from .env.example...")
	cp .env.example .env

up: $(ENV_FILE)
	$(call help_message, "Running the containerized application...")
	docker compose up --watch

build:
	$(call help_message, "Building the container image...")
	docker compose build

test:
ifndef ARG
	$(call error_message, "ARG variable is not set.")
	@exit 1
endif
	$(call help_message, "Running test of ${ARG} service...")
	docker compose run --build --rm $(ARG) npm test

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

.PHONY: all up build down clean fclean re