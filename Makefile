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
CERTS_DIR=./common/certs
TEST_DIR=./backend/test

all:
	@echo
	@echo "${BLUE}${BOLD}Available recipes:${RESET}"

	@echo "  ${GREEN}${BOLD}up      ${CYAN}- Run the containerized application"
	@echo "  ${GREEN}${BOLD}build   ${CYAN}- Generate \`.env\` file and SSL certificates"
	@echo "  ${GREEN}${BOLD}test    ${CYAN}- Run unit and integration tests"
	@echo "  ${GREEN}${BOLD}down    ${CYAN}- Stop the containerized application"
	@echo "  ${GREEN}${BOLD}clean   ${CYAN}- Stop the application and remove the database volume"
	@echo "  ${GREEN}${BOLD}fclean  ${CYAN}- Remove container images"
	@echo "  ${GREEN}${BOLD}re      ${CYAN}- (clean + up)${RESET}"
	@echo

$(CERTS_DIR):
	$(call help_message, "Generating self-signed SSL certificates...")
	mkdir -p $(CERTS_DIR)
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout $(CERTS_DIR)/key.pem -out $(CERTS_DIR)/cert.pem -subj "/CN=localhost"
	chmod 644 $(CERTS_DIR)/cert.pem $(CERTS_DIR)/key.pem
#	chown 1000:1000 $(CERTS_DIR)/cert.pem $(CERTS_DIR)/key.pem

$(ENV_FILE): $(ENV_FILE).example
	$(call help_message, "Creating the .env file from .env.example...")
	cp .env.example .env
	sed -i '0,/{generated-by-makefile}/s//$(shell openssl rand -hex 32)/' .env
	sed -i '0,/{generated-by-makefile}/s//$(shell openssl rand -hex 32)/' .env
	echo "\nVITE_INTERNAL_API_KEY=$$INTERNAL_API_KEY" >> $(ENV_FILE)

build: $(ENV_FILE) $(CERTS_DIR)

up: build
	$(call help_message, "Running the containerized application...")
	docker compose up --build --watch

test:
	$(call help_message, "Running unit tests...")
	docker compose exec api npm run test
	docker compose exec users npm run test
	$(call help_message, "Running integration tests...")
	npm install --prefix $(TEST_DIR)
	node --env-file=.env $(TEST_DIR)/test.js
	$(call help_message, "Running tournaments unit tests...")
	docker compose exec tournaments npm test
	$(call help_message, "Running tournaments DB smoke test...")
	docker compose exec tournaments npm run db:smoke
	$(call help_message, "Running tournaments score reporting tests...")
	docker compose exec tournaments node score_reporting_test.js
	$(call help_message, "Running end-to-end tournament test...")
	$(MAKE) e2e_tournament	

e2e_tournament:
	@cd backend/tournaments/src/scripts && \
	INTERNAL_API_KEY=$$(grep -E '^INTERNAL_API_KEY=' $(CURDIR)/.env | cut -d= -f2- | tr -d '\r') \
	node e_2_e_tournament.js

down:
	$(call help_message, "Stopping the containerized application...")
	docker compose down

clean:
	$(call help_message, "Stopping the containerized application and removing the database volume...")
	docker compose down -v || true

fclean: clean
	$(call help_message, "Removing container images...")
	docker rmi -f $(shell docker images --format '{{.Repository}}:{{.Tag}}' | grep "^${PROJECT_NAME}") || true
	$(call help_message, "Removing generated .env file...")
	rm -f $(ENV_FILE)
	$(call help_message, "Removing generated SSL certificates...")
	rm -rf $(CERTS_DIR)

re: clean up

.PHONY: all up test build down clean fclean re e2e_tournament
