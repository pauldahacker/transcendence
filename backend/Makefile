# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/09/19 02:36:59 by rzhdanov          #+#    #+#              #
#    Updated: 2025/09/19 23:54:42 by rzhdanov         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

dev-up:
	docker compose up --build

dev-down:
	docker compose down -v

logs:
	docker compose logs -f

test-auth:
	@COUNTER=$$(cat .test-counter 2>/dev/null || echo 0); \
	COUNTER=$$((COUNTER+1)); \
	echo $$COUNTER > .test-counter; \
	EMAIL="test$$COUNTER@a.com"; \
	echo "using $$EMAIL"; \
	curl -sk https://localhost/auth/healthz; \
	curl -sk -H "content-type: application/json" \
	  -d "{\"email\":\"$$EMAIL\",\"password\":\"Password123\"}" \
	  https://localhost/auth/signup || true; \
	curl -sk -H "content-type: application/json" \
	  -d "{\"email\":\"$$EMAIL\",\"password\":\"Password123\"}" \
	  https://localhost/auth/login


test-auth-remove-entries:

