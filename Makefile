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
BLOCKCHAIN_DIR=./backend/blockchain/src
API_ORIGIN ?= https://localhost

all:
	@echo
	@echo "${BLUE}${BOLD}Available recipes:${RESET}"

	@echo "  ${GREEN}${BOLD}up      ${CYAN}- Run the containerized application"
	@echo "  ${GREEN}${BOLD}build   ${CYAN}- Generate \`.env\` file and SSL certificates"
	@echo "  ${GREEN}${BOLD}logs    ${CYAN}- Run ELK stack for log management"
	@echo "  ${GREEN}${BOLD}test    ${CYAN}- Run unit and integration tests"
	@echo "  ${GREEN}${BOLD}load	  ${CYAN}- Load initial data into the database"
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

$(ENV_FILE): $(ENV_FILE).example
	$(call help_message, "Creating the .env file from .env.example...")
	cp .env.example .env
	sed -i '0,/{generated-by-makefile}/s//$(shell openssl rand -hex 32)/' .env
	sed -i '0,/{generated-by-makefile}/s//$(shell openssl rand -hex 32)/' .env
	sed -i '0,/{generated-by-makefile}/s//$(shell openssl rand -hex 32)/' .env

build: $(ENV_FILE) $(CERTS_DIR)

up: build
	$(call help_message, "Running the containerized application...")
	docker compose --profile app up --watch

logs:
	$(call help_message, "Running ELK stack...")
	docker compose --profile elk-stack up

test:
	$(call help_message, "Running unit tests...")
	docker compose exec api npm run test
	docker compose exec users npm run test
	docker compose exec tournaments npm test
	$(call help_message, "Running integration tests...")
	npm install --prefix $(TEST_DIR)
	node --env-file=.env $(TEST_DIR)/test.js
	node --env-file=.env backend/tournaments/src/scripts/e_2_e_tournament.js
	$(call help_message, "Running tournaments DB smoke test...")
	docker compose exec tournaments npm run db:smoke
	$(call help_message, "Running end-to-end tournament test...")
	@$(MAKE) e2e_tournament
	$(call help_message, "Running blockchain service tests...")
	@$(MAKE) blockchain_test
	$(call help_message, "Running end-to-end blockchain bridge \(flag dependent\)...")
	@$(MAKE) e2e_blockchain_bridge
	$(call help_message, "Running tournaments score reporting tests...")
	docker compose exec tournaments node score_reporting_test.js

load:
	$(call help_message, "Loading initial data into the database...")
	docker compose exec users node load-db.js

blockchain_dev_certs:
	@set -e; \
	DIR="backend/blockchain/dev-certs"; \
	mkdir -p "$$DIR"; \
	if [ -f "$$DIR/key.pem" ] && [ -f "$$DIR/cert.pem" ]; then \
		echo "Dev certs already exist at $$DIR"; \
	else \
		echo "Generating self-signed dev certs in $$DIR (CN=localhost)"; \
		openssl req -x509 -newkey rsa:2048 -nodes \
			-keyout "$$DIR/key.pem" -out "$$DIR/cert.pem" \
			-days 3650 -subj "/CN=localhost"; \
		echo "✓ Generated $$DIR/key.pem and $$DIR/cert.pem"; \
	fi

blockchain_test: blockchain_dev_certs
	$(call help_message, "Running blockchain unit tests...")
	npm install --prefix $(BLOCKCHAIN_DIR)
	npm test --prefix $(BLOCKCHAIN_DIR)

e2e_blockchain_bridge:
	@cd backend/blockchain/src/scripts && \
	INTERNAL_API_KEY=$$(grep -E '^INTERNAL_API_KEY=' $(CURDIR)/.env | cut -d= -f2- | tr -d '\r') \
	node e2e_blockchain_bridge.js


# --- Blockchain helpers (Fuji) ---

chain-deploy-fuji:
	@test -f .env || (echo ".env missing; run 'make build' first" && exit 1)
	@set -a; . ./.env; set +a; \
	cd $(BLOCKCHAIN_DIR) && npm ci && \
	RPC_URL="$$RPC_URL" PRIVATE_KEY="$$PRIVATE_KEY" \
	npx hardhat run scripts/deploy.cjs --network fuji
 
chain-config:
	@set -a; . ./.env; set +a; \
	curl -sk "$(API_ORIGIN)/api/blockchain/config" \
		-H "x-internal-api-key: $$INTERNAL_API_KEY" | jq .

# Usage: make chain-real-smoke TID=42 WIN=alice SA=3 SB=1 PTW=3
chain-real-smoke:
	@{ \
	  set -e; \
	  test -f .env || { echo ".env missing; run 'make build' first"; exit 1; }; \
	  set -a; . ./.env; set +a; \
	  test -n "$$INTERNAL_API_KEY" || { echo "INTERNAL_API_KEY missing in .env"; exit 1; }; \
	  test -n "$${TID}" || { echo "Set TID=<tournament id>"; exit 1; }; \
	  WIN=$${WIN:-alice}; SA=$${SA:-3}; SB=$${SB:-1}; PTW=$${PTW:-3}; \
	  echo "==> Config"; \
	  curl -sk "$(API_ORIGIN)/api/blockchain/config" \
	    -H "x-internal-api-key: $$INTERNAL_API_KEY" | jq '.'; \
	  echo "==> POST /finals id=$${TID}"; \
	  curl -sk "$(API_ORIGIN)/api/blockchain/finals" \
	    -H "x-internal-api-key: $$INTERNAL_API_KEY" \
	    -H "content-type: application/json" \
	    --data "{\"tournament_id\":$${TID},\"winner_alias\":\"$${WIN}\",\"score_a\":$${SA},\"score_b\":$${SB},\"points_to_win\":$${PTW}}" | jq '.'; \
	  echo "==> GET /finals/$$TID"; \
	  curl -sk "$(API_ORIGIN)/api/blockchain/finals/$${TID}" \
	    -H "x-internal-api-key: $$INTERNAL_API_KEY" | jq '.'; \
	}


# Quick health flags for real-mode adapter
chain-diagnostics:
	@set -a; . ./.env; set +a; \
	curl -sk "$(API_ORIGIN)/api/blockchain/config/diagnostics" \
	-H "x-internal-api-key: $${INTERNAL_API_KEY}" | jq .

# Usage: make chain-check-tx TXHASH=hash_to_be_tested
chain-check-tx:
	@set -a; . ./.env; set +a; \
	curl -s -X POST $$RPC_URL -H "Content-Type: application/json" \
	-d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionByHash","params":["'"$$TXHASH"'"]}'

# e2e_blockchain_bridge:
# 	@cd backend/blockchain/src/scripts && \
# 	BLOCKCHAIN_REPORT_ENABLED=$$(grep -E '^BLOCKCHAIN_REPORT_ENABLED=' $(CURDIR)/.env | cut -d= -f2- | tr -d '\r') \
# 	INTERNAL_API_KEY=$$(grep -E '^INTERNAL_API_KEY=' $(CURDIR)/.env | cut -d= -f2- | tr -d '\r') \
# 	node e2e_blockchain_bridge.js

down:
	$(call help_message, "Stopping the containerized application...")
	docker compose --profile all down

clean:
	$(call help_message, "Stopping the containerized application and removing the database volume...")
	docker compose --profile all down -v || true

fclean: clean
	$(call help_message, "Removing container images...")
	docker rmi -f $(shell docker images --format '{{.Repository}}:{{.Tag}}' | grep "^${PROJECT_NAME}") || true
	$(call help_message, "Removing generated .env file...")
	rm -f $(ENV_FILE)
	$(call help_message, "Removing generated SSL certificates...")
	rm -rf $(CERTS_DIR)

re: clean up

.PHONY: all up test build down clean fclean re \
	e2e_tournament blockchain_dev_certs blockchain_test \
	e2e_blockchain_bridge chain-real-smoke chain-deploy-fuji \ 
	chain-config chain-diagnostics
